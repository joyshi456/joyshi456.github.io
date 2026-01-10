import React, { useState } from 'react';

interface ExplorerProps {
    initialPath?: string;
    items?: ExplorerItem[];
}

export interface ExplorerItem {
    id: string;
    label: string;
    icon: string; // URL or class
    type: 'folder' | 'file';
    onClick?: () => void;
}

// Default items if none provided
const DEFAULT_ITEMS: ExplorerItem[] = [
    { id: '1', label: 'My Projects', icon: '/img/folder_closed.ico', type: 'folder' },
    { id: '2', label: 'Resume.txt', icon: '/img/notepad_file.ico', type: 'file' },
];

export const Explorer: React.FC<ExplorerProps> = ({
    initialPath = "My Documents",
    items = DEFAULT_ITEMS
}) => {
    const [viewMode, setViewMode] = useState<'large' | 'list'>('large');

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#c0c0c0' }}>
            {/* 1. Menu Bar */}
            <div style={{ display: 'flex', padding: '2px 4px', borderBottom: '1px solid #808080' }}>
                {['File', 'Edit', 'View', 'Go', 'Favorites', 'Help'].map(menu => (
                    <div key={menu} style={{ padding: '2px 6px', cursor: 'default' }}>
                        <span style={{ textDecoration: 'none' }}>{menu[0]}</span>{menu.slice(1)}
                    </div>
                ))}
            </div>

            {/* 2. Standard Buttons (Toolbar) */}
            <div style={{
                display: 'flex',
                gap: 2,
                padding: 4,
                borderBottom: '1px solid #808080',
                backgroundColor: '#c0c0c0'
            }}>
                <div style={{ display: 'flex', gap: 0, marginRight: 8 }}>
                    <ToolbarButton label="Back" icon="/img/back_icon.png" disabled />
                    <ToolbarButton label="Forward" icon="/img/forward_icon.png" disabled />
                    <ToolbarButton label="Up" icon="/img/up_level_icon.png" />
                </div>
                <div style={{ width: 1, backgroundColor: '#808080', margin: '0 4px' }} />
                <div style={{ display: 'flex', gap: 0 }}>
                    <ToolbarButton label="Cut" icon="/img/cut_icon.png" />
                    <ToolbarButton label="Copy" icon="/img/copy_icon.png" />
                    <ToolbarButton label="Paste" icon="/img/paste_icon.png" />
                </div>
                <div style={{ width: 1, backgroundColor: '#808080', margin: '0 4px' }} />
                <ToolbarButton label="Undo" icon="/img/undo_icon.png" />
                <div style={{ width: 1, backgroundColor: '#808080', margin: '0 4px' }} />
                <ToolbarButton label="Delete" icon="/img/delete_icon.png" />
                <ToolbarButton label="Properties" icon="/img/properties_icon.png" />
                <div style={{ width: 1, backgroundColor: '#808080', margin: '0 4px' }} />
                <ToolbarButton label="Views" icon="/img/views_icon.png" onClick={() => setViewMode(m => m === 'large' ? 'list' : 'large')} />
            </div>

            {/* 3. Address Bar */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                padding: '2px 4px 4px 4px',
                gap: 4
            }}>
                <span style={{ color: '#000', fontSize: 15, marginRight: 2 }}>Address</span>
                <div style={{
                    flex: 1,
                    backgroundColor: 'white',
                    border: '2px inset #ffffff', // Heavy inset
                    borderTop: '1px solid #404040', borderLeft: '1px solid #404040',
                    borderRight: '1px solid #ffffff', borderBottom: '1px solid #ffffff',
                    height: 22,
                    display: 'flex',
                    alignItems: 'center',
                    paddingLeft: 2,
                    boxShadow: 'inset 1px 1px 0px #000' // Fake deep inset
                }}>
                    <img src="/img/folder_open.ico" alt="" style={{ width: 16, height: 16, marginRight: 4 }} />
                    <span style={{ fontFamily: 'Tahoma, sans-serif', fontSize: 15 }}>{initialPath}</span>
                </div>
            </div>

            {/* 4. Content Area (White Box) */}
            <div style={{
                flex: 1,
                backgroundColor: 'white',
                borderTop: '2px solid #808080', // Deep inset for content
                borderLeft: '2px solid #808080',
                borderRight: '1px solid #ffffff',
                borderBottom: '1px solid #ffffff',
                margin: 2,
                overflow: 'auto',
                display: 'flex',
                flexDirection: 'column'
            }}>
                {/* File Grid */}
                <div style={{ display: 'flex', flexWrap: 'wrap', padding: 10, gap: 20, alignContent: 'flex-start' }}>
                    {items.map(item => (
                        <div
                            key={item.id}
                            onClick={item.onClick}
                            style={{
                                display: 'flex',
                                flexDirection: viewMode === 'large' ? 'column' : 'row',
                                alignItems: 'center',
                                width: viewMode === 'large' ? 90 : 220,
                                gap: viewMode === 'large' ? 4 : 8,
                                cursor: 'pointer',
                                padding: 2,
                                // Hover effect could be added
                            }}
                        >
                            <img src={item.icon} alt="" style={{ width: 48, height: 48, imageRendering: 'pixelated' }} />
                            <span style={{
                                textAlign: viewMode === 'large' ? 'center' : 'left',
                                fontSize: 14,
                                wordBreak: 'break-word',
                                lineHeight: 1.2
                            }}>
                                {item.label}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
            {/* 5. Status Bar */}
            <div style={{ height: 20, borderTop: '1px solid #808080', display: 'flex', alignItems: 'center', paddingLeft: 4, fontSize: 12, color: '#000' }}>
                {items.length} object(s)
            </div>
        </div>
    );
};

// Simple helper for toolbar buttons
const ToolbarButton: React.FC<{ label: string, icon: string, disabled?: boolean, onClick?: () => void }> = ({ label, icon, disabled, onClick }) => (
    <div
        onClick={onClick}
        style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: 40,
            height: 38,
            border: '1px solid transparent',
            cursor: disabled ? 'default' : 'pointer',
            opacity: disabled ? 0.5 : 1
        }}
    // Add active/hover styles in CSS or simplified here
    >
        {/* <div style={{ width: 20, height: 20, backgroundColor: '#ccc', borderRadius: 2 }} /> Placeholder */}
        <img src={icon} alt="" style={{ width: 20, height: 20 }} />
        <span style={{ fontSize: 12, marginTop: 2 }}>{label}</span>
    </div>
);
