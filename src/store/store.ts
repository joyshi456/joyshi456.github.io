import { create } from 'zustand';
import React from 'react';

export type WindowId = 'cv' | 'projects' | 'contact' | 'cmd' | 'about' | 'paint' | 'mycomputer' | string;

export interface DesktopWindow {
    id: WindowId;
    title: string;
    icon: string;
    component: React.ReactNode;
    isOpen: boolean;
    isMinimized: boolean;
    isMaximized: boolean;
    zIndex: number;
    position?: { x: number; y: number };
    size?: { width: number; height: number };
    preMaximizeState?: { position: { x: number; y: number }; size: { width: number; height: number } };
}

interface AppState {
    windows: Record<WindowId, DesktopWindow>;
    activeWindowId: WindowId | null;
    startMenuOpen: boolean;

    // Agent State
    agentStatus: 'idle' | 'thinking' | 'executing' | 'answering';
    agentMessage: string | null;
    agentCancelled: boolean;

    // Cursor State
    cursorPosition: { x: number; y: number };
    isClicking: boolean;

    // Clippy Demo State
    clippyDemoActive: boolean;
    startClippyDemo: () => void;
    stopClippyDemo: () => void;

    // Actions
    openWindow: (id: WindowId, title?: string, icon?: string, component?: React.ReactNode, size?: { width: number; height: number }) => void;
    closeWindow: (id: WindowId) => void;
    minimizeWindow: (id: WindowId) => void;
    maximizeWindow: (id: WindowId) => void;
    focusWindow: (id: WindowId) => void;
    updateWindowPosition: (id: WindowId, x: number, y: number) => void;
    updateWindowSize: (id: WindowId, width: number, height: number) => void;
    toggleStartMenu: () => void;
    setAgentStatus: (status: AppState['agentStatus'], message?: string) => void;
    cancelAgent: () => void;
    setCursorPosition: (x: number, y: number) => void;
    setIsClicking: (isClicking: boolean) => void;
}

export const useStore = create<AppState>((set, get) => ({
    windows: {
        'cmd': { id: 'cmd', title: 'Command Prompt', isOpen: false, zIndex: 1, position: { x: 50, y: 400 }, isMinimized: false, isMaximized: false, size: { width: 500, height: 350 }, icon: '/img/cmd.png', component: null },
        'cv': { id: 'cv', title: 'Resume - WordPad', isOpen: false, zIndex: 1, position: { x: 50, y: 50 }, isMinimized: false, isMaximized: false, size: { width: 500, height: 400 }, icon: '/img/wordpad_icons/WordPad-icon-cropped.png', component: null },
        'mycomputer': { id: 'mycomputer', title: 'System Properties', isOpen: false, zIndex: 1, position: { x: 100, y: 100 }, isMinimized: false, isMaximized: false, size: { width: 506, height: 450 }, icon: '/img/computer.ico', component: null },
        'documents': { id: 'documents', title: 'My Documents', isOpen: false, zIndex: 1, position: { x: 50, y: 50 }, isMinimized: false, isMaximized: false, size: { width: 500, height: 400 }, icon: '/img/my_docs.png', component: null },
        'contact': { id: 'contact', title: 'Outlook Express', isOpen: false, zIndex: 1, position: { x: 150, y: 150 }, isMinimized: false, isMaximized: false, size: { width: 500, height: 450 }, icon: '/img/outlook_express.png', component: null },
        'paint': { id: 'paint', title: 'Paint', isOpen: false, zIndex: 1, position: { x: 200, y: 100 }, isMinimized: false, isMaximized: false, size: { width: 675, height: 506 }, icon: '/img/paint_icon.png', component: null }
    },
    activeWindowId: null,
    startMenuOpen: false,
    agentStatus: 'idle',
    agentMessage: null,
    agentCancelled: false,
    cursorPosition: { x: window.innerWidth / 2, y: window.innerHeight / 2 },
    isClicking: false,
    clippyDemoActive: false,

    startClippyDemo: () => set({ clippyDemoActive: true }),
    stopClippyDemo: () => set({ clippyDemoActive: false }),

    openWindow: (id, title, icon, component, size) => {
        const { windows } = get();
        // If already exists, just open and focus
        if (windows[id]) {
            const maxZ = Math.max(...Object.values(windows).map(w => w.zIndex), 0);
            set((state) => ({
                windows: {
                    ...state.windows,
                    [id]: { ...state.windows[id], isOpen: true, isMinimized: false, zIndex: maxZ + 1 }
                },
                activeWindowId: id,
                startMenuOpen: false // Close start menu on action
            }));
            return;
        }

        // Register new window (dynamic or static)
        // Note: In a real app we might have a registry, but here we can pass metadata or defaults
        const maxZ = Math.max(...Object.values(windows).map(w => w.zIndex), 0);
        const windowCount = Object.keys(windows).length;
        const newWindow: DesktopWindow = {
            id,
            title: title || 'Untitled',
            icon: icon || '/img/computer.ico',
            component: component || null,
            isOpen: true,
            isMinimized: false,
            isMaximized: false,
            zIndex: maxZ + 1,
            position: { x: 50 + (windowCount * 20), y: 50 + (windowCount * 20) },
            size: size || undefined
        };

        set((state) => ({
            windows: { ...state.windows, [id]: newWindow },
            activeWindowId: id,
            startMenuOpen: false
        }));
    },

    closeWindow: (id) => {
        set((state) => ({
            windows: {
                ...state.windows,
                [id]: { ...state.windows[id], isOpen: false }
            }
        }));
    },

    minimizeWindow: (id) => {
        set((state) => ({
            windows: {
                ...state.windows,
                [id]: { ...state.windows[id], isMinimized: true }
            },
            activeWindowId: null // or find next highest zIndex
        }));
    },

    maximizeWindow: (id) => {
        const { windows } = get();
        const win = windows[id];
        if (!win) return;

        if (win.isMaximized) {
            // Restore to previous state
            const prevState = win.preMaximizeState;
            set((state) => ({
                windows: {
                    ...state.windows,
                    [id]: {
                        ...state.windows[id],
                        isMaximized: false,
                        position: prevState?.position || { x: 100, y: 100 },
                        size: prevState?.size || { width: 400, height: 300 },
                        preMaximizeState: undefined
                    }
                }
            }));
        } else {
            // Maximize - save current state and expand
            // Account for taskbar (approx 30px at bottom)
            const taskbarHeight = 30;
            // Use clientWidth/clientHeight to exclude scrollbars
            const maxWidth = document.documentElement.clientWidth;
            const maxHeight = document.documentElement.clientHeight - taskbarHeight;
            set((state) => ({
                windows: {
                    ...state.windows,
                    [id]: {
                        ...state.windows[id],
                        isMaximized: true,
                        preMaximizeState: {
                            position: win.position || { x: 100, y: 100 },
                            size: win.size || { width: 400, height: 300 }
                        },
                        position: { x: 0, y: 0 },
                        size: { width: maxWidth, height: maxHeight }
                    }
                }
            }));
        }
    },

    focusWindow: (id) => {
        const { windows } = get();
        // boost zIndex
        const maxZ = Math.max(...Object.values(windows).map(w => w.zIndex), 0);

        set((state) => ({
            windows: {
                ...state.windows,
                [id]: { ...state.windows[id], zIndex: maxZ + 1, isMinimized: false }
            },
            activeWindowId: id,
            startMenuOpen: false
        }));
    },

    updateWindowPosition: (id, x, y) => {
        set((state) => ({
            windows: {
                ...state.windows,
                [id]: { ...state.windows[id], position: { x, y } }
            }
        }));
    },

    updateWindowSize: (id, width, height) => {
        set((state) => ({
            windows: {
                ...state.windows,
                [id]: { ...state.windows[id], size: { width, height } }
            }
        }));
    },

    toggleStartMenu: () => set((state) => ({ startMenuOpen: !state.startMenuOpen })),

    setAgentStatus: (status, message) => set({ agentStatus: status, agentMessage: message || null, agentCancelled: false }),

    cancelAgent: () => set({ agentStatus: 'idle', agentMessage: null, agentCancelled: true, isClicking: false }),

    setCursorPosition: (x, y) => set({ cursorPosition: { x, y } }),
    setIsClicking: (isClicking) => set({ isClicking })
}));
