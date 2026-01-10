import type { AgentPlan, IntentDefinition } from './types';

const INTENTS: IntentDefinition[] = [
    {
        patterns: [/experience/i, /work history/i, /resume/i, /cv/i],
        plan: () => ({
            intent: 'View Experience',
            steps: [
                { type: 'WAIT', payload: 1000, description: 'Analyzing request...' },
                { type: 'MOVE_CURSOR', payload: { selector: '[data-label="My Computer"]' }, description: 'Locating My Computer...' },
                { type: 'CLICK', payload: {}, description: 'Opening...' },
                { type: 'WAIT', payload: 1000, description: 'Waiting for window...' },
                { type: 'OPEN_WINDOW', payload: { id: 'cv' }, description: 'Reading file system...' },
                { type: 'WAIT', payload: 800, description: 'Parsing CV...' },
                { type: 'SCROLL_TO', payload: { id: 'cv', selector: '#experience' }, description: 'Locating experience section...' },
                { type: 'SHOW_ANSWER', payload: { text: 'Joy is currently a Software Engineer at Pegasi AI building autonomous agents. Previously, she worked on quantum control systems at Bohr Quantum.' }, description: 'Synthesizing answer...' }
            ]
        })
    },
    {
        patterns: [/projects/i, /built/i, /made/i],
        plan: () => ({
            intent: 'View Projects',
            steps: [
                { type: 'WAIT', payload: 800, description: 'Analyzing request...' },
                { type: 'MOVE_CURSOR', payload: { selector: '[data-label="Projects"]' }, description: 'Locating Projects folder...' },
                { type: 'CLICK', payload: {}, description: 'Opening...' },
                { type: 'OPEN_WINDOW', payload: { id: 'projects' }, description: 'Loading projects...' },
                { type: 'WAIT', payload: 500, description: 'Rendering grid...' }
            ]
        })
    },
    {
        patterns: [/contact/i, /email/i, /reach/i],
        plan: () => ({
            intent: 'View Contact',
            steps: [
                { type: 'MOVE_CURSOR', payload: { selector: '[data-label="Contact"]' }, description: 'Locating Contact info...' },
                { type: 'CLICK', payload: {}, description: 'Opening...' },
                { type: 'OPEN_WINDOW', payload: { id: 'contact' }, description: 'Opening Contact card...' }
            ]
        })
    }
];

export const parseIntent = (query: string): AgentPlan | null => {
    for (const intent of INTENTS) {
        for (const pattern of intent.patterns) {
            const match = query.match(pattern);
            if (match) {
                return intent.plan(match);
            }
        }
    }
    return null; // Fallback to "I don't understand"
};
