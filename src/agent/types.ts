
export type ActionType =
    | 'OPEN_WINDOW'
    | 'WAIT'
    | 'SCROLL_TO'
    | 'SHOW_ANSWER'
    | 'HIGHLIGHT_TEXT'
    | 'MOVE_CURSOR'
    | 'CLICK';

export interface AgentAction {
    type: ActionType;
    payload?: any;
    description: string; // For the "status log"
}

export interface AgentPlan {
    intent: string; // The matched intent description
    steps: AgentAction[];
}

// Registry of known patterns
export interface IntentDefinition {
    patterns: RegExp[]; // or simple strings
    plan: (matches: RegExpMatchArray | null) => AgentPlan;
}
