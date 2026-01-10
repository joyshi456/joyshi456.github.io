export interface ScreenElement {
    id: string; // "icon-my-computer", "btn-start", "window-cv-close"
    type: string; // "icon", "button", "window"
    x: number; // Center X
    y: number; // Center Y
    visible: boolean;
}

export const getScreenSnapshot = (): ScreenElement[] => {
    // Select all elements we tagged as interactable
    const elements = document.querySelectorAll('[data-agent-id]');

    return Array.from(elements).map((el) => {
        const rect = el.getBoundingClientRect();

        // Basic visibility check: is it effectively on screen?
        const isVisible = rect.width > 0 && rect.height > 0 &&
            rect.top >= 0 && rect.left >= 0 &&
            rect.bottom <= window.innerHeight && rect.right <= window.innerWidth;

        return {
            id: el.getAttribute('data-agent-id') || 'unknown',
            type: el.getAttribute('data-agent-type') || 'generic',
            x: Math.round(rect.left + rect.width / 2),
            y: Math.round(rect.top + rect.height / 2),
            visible: isVisible
        };
    });
};
