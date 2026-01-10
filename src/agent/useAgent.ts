import { useState, useCallback } from 'react';
import { useStore } from '../store/store';
import { getScreenSnapshot } from './ScreenReader';
import { askGeminiAgent } from './GeminiService';

export const useAgent = () => {
    const {
        setAgentStatus,
        setCursorPosition,
        setIsClicking,
        agentCancelled
    } = useStore();

    const [isProcessing, setIsProcessing] = useState(false);

    const executeGoal = useCallback(async (query: string) => {
        if (isProcessing) return;
        setIsProcessing(true);
        setAgentStatus('thinking', 'Analyzing global state...');

        try {
            // 1. Initial State Capture
            // In a continuous loop, we would do this repeatedly.
            // For now, let's do a single-step decision or a simple 2-step sequence.

            // Loop limit to prevent infinite run costs
            let steps = 0;
            const MAX_STEPS = 5;
            let currentQuery = query;

            while (steps < MAX_STEPS) {
                // Check for cancellation
                if (useStore.getState().agentCancelled) {
                    console.log('Agent cancelled by user');
                    setAgentStatus('idle');
                    break;
                }
                // 1. Capture "Vision"
                const screenState = getScreenSnapshot();

                // 2. Ask Gemini
                setAgentStatus('thinking', steps === 0 ? 'Planning...' : 'Reviewing next step...');
                const decision = await askGeminiAgent(currentQuery, screenState);

                // 3. Update overlay with "Thought"
                setAgentStatus('executing', decision.thought);

                if (decision.action === 'finish') {
                    setAgentStatus('idle');
                    break;
                }

                if (decision.action === 'speak') {
                    setAgentStatus('answering', decision.message);
                    break; // End after speaking for now
                }

                if (decision.action === 'draw') {
                    const targetEl = document.querySelector(`[data-agent-id="${decision.target_element_id}"]`);
                    if (targetEl && decision.shapes && decision.shapes.length > 0) {
                        const rect = targetEl.getBoundingClientRect();

                        // Loop through each stroke
                        for (const stroke of decision.shapes) {
                            if (stroke.length === 0) continue;

                            // 1. Move to start
                            const startP = stroke[0];
                            const startX = rect.left + (startP.x * rect.width);
                            const startY = rect.top + (startP.y * rect.height);

                            setCursorPosition(startX, startY);
                            await new Promise(r => setTimeout(r, 500)); // Travel to start

                            // 2. Mouse Down
                            setIsClicking(true);
                            targetEl.dispatchEvent(new MouseEvent('mousedown', {
                                bubbles: true,
                                clientX: startX,
                                clientY: startY
                            }));

                            // 3. Draw Stroke
                            for (let i = 0; i < stroke.length; i++) {
                                const p = stroke[i];
                                const currentX = rect.left + (p.x * rect.width);
                                const currentY = rect.top + (p.y * rect.height);

                                setCursorPosition(currentX, currentY);

                                targetEl.dispatchEvent(new MouseEvent('mousemove', {
                                    bubbles: true,
                                    clientX: currentX,
                                    clientY: currentY
                                }));

                                await new Promise(r => setTimeout(r, 16)); // ~60fps drawing speed
                            }

                            // 4. Mouse Up
                            targetEl.dispatchEvent(new MouseEvent('mouseup', {
                                bubbles: true,
                                clientX: rect.left + (stroke[stroke.length - 1].x * rect.width),
                                clientY: rect.top + (stroke[stroke.length - 1].y * rect.height)
                            }));
                            setIsClicking(false);

                            await new Promise(r => setTimeout(r, 100)); // Pause between strokes
                        }

                        currentQuery = `I just drew coordinates on ${decision.target_element_id}. What next for: ${query}?`;

                    } else {
                        console.warn("Draw target or shapes missing");
                        setAgentStatus('answering', "I wanted to draw, but couldn't find the canvas or shapes.");
                        break;
                    }
                }

                if (decision.action === 'move_and_click') {
                    // Find actual coordinates
                    // (Double check fresh DOM, as things might have moved or Gemini sent stale ID)
                    const targetEl = document.querySelector(`[data-agent-id="${decision.target_element_id}"]`);

                    if (targetEl) {
                        const rect = targetEl.getBoundingClientRect();
                        const targetX = rect.left + rect.width / 2;
                        const targetY = rect.top + rect.height / 2;

                        // Move cursor to position
                        setCursorPosition(targetX, targetY);

                        // Wait for cursor to visually move to the position
                        await new Promise(r => setTimeout(r, 500));

                        // Click
                        setIsClicking(true);
                        await new Promise(r => setTimeout(r, 200));
                        setIsClicking(false);

                        // Trigger actual click
                        // For React components we might need to trigger the handler directly?
                        // `targetEl.click()` works for buttons/inputs usually.
                        (targetEl as HTMLElement).click();
                        (targetEl as HTMLElement).focus(); // Also focus!

                        // Specifically for icons, we often need double click
                        if (decision.target_element_id?.startsWith('icon-')) {
                            const dblClickEvent = new MouseEvent('dblclick', {
                                bubbles: true,
                                cancelable: true,
                                view: window
                            });
                            targetEl.dispatchEvent(dblClickEvent);
                        }

                        // Wait for UI to react
                        await new Promise(r => setTimeout(r, 1000));

                        // Update context for next loop?
                        currentQuery = `I just clicked ${decision.target_element_id}. What next for: ${query}?`;
                    } else {
                        console.warn("Target element not found:", decision.target_element_id);
                        setAgentStatus('answering', "I tried to click something but couldn't find it.");
                        break;
                    }
                }

                if (decision.action === 'type') {
                    const targetEl = document.querySelector(`[data-agent-id="${decision.target_element_id}"]`);
                    if (targetEl && decision.text) {
                        // Ensure focused (should be focused by previous Click, but just in case)
                        (targetEl as HTMLElement).focus();

                        // Simulate typing character by character
                        for (let i = 0; i < decision.text.length; i++) {
                            const char = decision.text[i];

                            // 1. Dispatch keydown/keypress? (React relies heavily on 'input' and 'change')
                            // We'll update the value directly then dispatch 'input'
                            // But for "typing" effect, let's append.

                            const input = targetEl as HTMLInputElement | HTMLTextAreaElement;
                            const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
                            const nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value")?.set;

                            const previousValue = input.value;
                            const newValue = previousValue + char;

                            // Call native setter to bypass React's state suppression if needed
                            if (input instanceof HTMLTextAreaElement && nativeTextAreaValueSetter) {
                                nativeTextAreaValueSetter.call(input, newValue);
                            } else if (input instanceof HTMLInputElement && nativeInputValueSetter) {
                                nativeInputValueSetter.call(input, newValue);
                            } else {
                                input.value = newValue; // Fallback
                            }

                            input.dispatchEvent(new Event('input', { bubbles: true }));

                            // await new Promise(r => setTimeout(r, 50 + Math.random() * 50)); // Random typing speed
                        }

                        // Final change event
                        targetEl.dispatchEvent(new Event('change', { bubbles: true }));

                        currentQuery = `I just typed "${decision.text}" into ${decision.target_element_id}. What next for: ${query}?`;

                    } else {
                        console.warn("Type target or text missing");
                        setAgentStatus('answering', "I wanted to type, but missed the target.");
                    }
                }

                steps++;
            }

        } catch (error) {
            console.error(error);
            setAgentStatus('answering', 'Error during execution.');
        } finally {
            setIsProcessing(false);
        }
    }, [isProcessing, setAgentStatus, setCursorPosition, setIsClicking, agentCancelled]);

    return { runPlan: executeGoal }; // Retain same signature for App.tsx compatibility
};

