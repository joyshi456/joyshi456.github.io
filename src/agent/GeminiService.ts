import { callRouter, callAgent } from "../lib/api";
import type { ScreenElement } from "./ScreenReader";

export interface AgentDecision {
  thought: string;
  action: "move_and_click" | "speak" | "wait" | "finish" | "draw" | "type";
  target_element_id?: string;
  coordinates?: { x: number; y: number };
  shapes?: Array<Array<{ x: number; y: number }>>;
  message?: string;
  text?: string;
}

const checkIntent = async (
  userQuery: string
): Promise<{ needs_tool: boolean; response?: string }> => {
  const prompt = `
    Analyze this user request: "${userQuery}"

    Determine if fulfilling this request requires interacting with a computer interface (clicking, typing, navigating, drawing, opening apps).

    - If YES (needs tools): Return { "needs_tool": true }
    - If NO (simple chat/greeting/question): Return { "needs_tool": false, "response": "Your friendly response here" }

    Return STRICT JSON.
    `;

  try {
    return await callRouter(prompt);
  } catch (e) {
    console.warn("Router failed, defaulting to agent", e);
    return { needs_tool: true };
  }
};

// Router check - call this once at the start
export const checkRouterIntent = async (
  userQuery: string
): Promise<{ needs_tool: boolean; response?: string }> => {
  return checkIntent(userQuery);
};

// Agent execution - call this in the action loop (no router)
export const executeAgentStep = async (
  userQuery: string,
  screenState: ScreenElement[]
): Promise<AgentDecision> => {
  const systemPrompt = `
    You are an automated agent operating a Windows 98 desktop portfolio.

    CONTEXT:
    - The screen is the current viewport.
    - You receive a LIST of available interactive elements.
    - To send an EMAIL:
      1. Open "Outlook Express" (if not open).
      2. Click "Name" input (data-agent-id="oe-input-name").
      3. Type the sender's name (infer from request or use "Guest").
      4. Click "Email" input (data-agent-id="oe-input-email").
      5. Type the sender's email (infer from request or use "guest@example.com").
      6. Click "Subject" input.
      7. Type the subject.
      8. Click "Body" textarea.
      9. Type the message.
      10. Click "Send".

    AVAILABLE ACTIONS:
    - "move_and_click": Move cursor to an element and click it. REQUIRED: target_element_id.
    - "type": Type text into the currently focused element (or click first then type). REQUIRED: target_element_id AND "text".
    - "draw": Draw on a canvas. REQUIRED: target_element_id (must be a canvas) AND "shapes".
      "shapes" is an array of strokes. Each stroke is an array of points {x,y} from 0.0 to 1.0 relative to the canvas.
      Example: "shapes": [[{x:0.1, y:0.1}, {x:0.2, y:0.2}]] for a line.
    - "speak": Just show a message in the overlay. REQUIRED: message.
    - "finish": Task is done.

    YOUR GOAL:
    Return a STRICT JSON object with the next single action.
    `;

  const prompt = `
    USER REQUEST: "${userQuery}"
    CURRENT SCREEN STATE (Interactive Elements):
    ${JSON.stringify(screenState)}

    Determine the single best next action.
    `;

  try {
    console.log("Calling Agent API...");
    const result = await callAgent(prompt, systemPrompt);
    console.log("Agent response received");
    return result;
  } catch (error: unknown) {
    console.error("Agent API Error:", error);
    return {
      thought: "I encountered an error.",
      action: "speak",
      message: "Error connecting to AI service.",
    };
  }
};
