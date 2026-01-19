// API helper for Cloudflare Worker endpoints
// All API calls go through the Worker - no keys exposed in frontend

const API_BASE = "https://enjoyshi.com";

// Global abort controller for cancelling all agent requests
let agentAbortController: AbortController | null = null;

export function createAgentAbortController(): AbortController {
  // Abort any existing controller
  if (agentAbortController) {
    agentAbortController.abort();
  }
  agentAbortController = new AbortController();
  return agentAbortController;
}

export function abortAllAgentRequests(): void {
  if (agentAbortController) {
    agentAbortController.abort();
    agentAbortController = null;
  }
}

export function getAgentSignal(): AbortSignal | undefined {
  return agentAbortController?.signal;
}

interface RouterResponse {
  needs_tool: boolean;
  response?: string;
}

interface AgentResponse {
  thought: string;
  action: "move_and_click" | "speak" | "wait" | "finish" | "draw" | "type";
  target_element_id?: string;
  coordinates?: { x: number; y: number };
  shapes?: Array<Array<{ x: number; y: number }>>;
  message?: string;
  text?: string;
}

export async function callRouter(prompt: string): Promise<RouterResponse> {
  const res = await fetch(`${API_BASE}/api/router`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
    signal: getAgentSignal(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Router API error: ${text}`);
  }

  return res.json();
}

export async function callAgent(
  prompt: string,
  systemPrompt: string
): Promise<AgentResponse> {
  const res = await fetch(`${API_BASE}/api/agent`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, systemPrompt }),
    signal: getAgentSignal(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Agent API error: ${text}`);
  }

  return res.json();
}

export async function checkHealth(): Promise<{ ok: boolean; hasGeminiKey: boolean }> {
  const res = await fetch(`${API_BASE}/api/health`);
  return res.json();
}
