import { useState, useCallback, useEffect } from 'react';
import { useStore } from '../store/store';

export interface DemoStep {
    message: string;
    action?: 'moveCursor' | 'click' | 'doubleClick' | 'type';
    target?: string;
    text?: string;
    buttons?: Array<{ label: string; goToStep?: number; action?: 'next' | 'close' }>;
    position?: { x: number; y: number };
    delay?: number;
}

const DEMO_STEPS: DemoStep[] = [
    {
        message: "Hi! I'm Clippy, your office assistant. Want me to show you how to use the AI agent?",
        buttons: [
            { label: 'Yes!', action: 'next' },
            { label: 'No thanks', action: 'close' }
        ],
        position: { x: 200, y: 200 }
    },
    {
        message: "Great! See that Command Prompt icon on the desktop? Double-click it to open.",
        buttons: [{ label: 'Next', action: 'next' }],
        position: { x: 200, y: 280 }
    },
    {
        message: "Once it's open, just type what you want in plain English.\n\nFor example: \"open my resume\"",
        buttons: [{ label: 'Next', action: 'next' }],
        position: { x: 200, y: 200 }
    },
    {
        message: "The AI will read your screen and figure out what to click, type, or draw!",
        buttons: [{ label: 'Next', action: 'next' }],
        position: { x: 200, y: 200 }
    },
    {
        message: "Try these commands:\n• \"send an email to John\"\n• \"draw a smiley in Paint\"\n• \"what can you do?\"",
        buttons: [{ label: 'Got it!', action: 'close' }],
        position: { x: 200, y: 200 }
    }
];

export const useClippyDemo = () => {
    const clippyDemoActive = useStore((state) => state.clippyDemoActive);
    const stopClippyDemo = useStore((state) => state.stopClippyDemo);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);

    // Reset when demo becomes active
    useEffect(() => {
        if (clippyDemoActive) {
            setCurrentStepIndex(0);
        }
    }, [clippyDemoActive]);

    const closeDemo = useCallback(() => {
        stopClippyDemo();
        setCurrentStepIndex(0);
    }, [stopClippyDemo]);

    const nextStep = useCallback(() => {
        const next = currentStepIndex + 1;
        if (next >= DEMO_STEPS.length) {
            closeDemo();
        } else {
            setCurrentStepIndex(next);
        }
    }, [currentStepIndex, closeDemo]);

    const handleButtonClick = useCallback((btn: { label: string; goToStep?: number; action?: 'next' | 'close' }) => {
        if (btn.action === 'close') {
            closeDemo();
        } else if (btn.action === 'next') {
            nextStep();
        } else if (btn.goToStep !== undefined) {
            setCurrentStepIndex(btn.goToStep);
        }
    }, [closeDemo, nextStep]);

    const currentStep = clippyDemoActive ? DEMO_STEPS[currentStepIndex] : null;

    return {
        isActive: clippyDemoActive,
        currentStep,
        closeDemo,
        nextStep,
        handleButtonClick
    };
};
