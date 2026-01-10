import React, { useState } from 'react';
import { Win98MonitorIcon } from '../ui/Win98MonitorIcon';

// Windows 98 color palette
const win = {
    face: '#c0c0c0',
    highlight: '#ffffff',
    lightShadow: '#dfdfdf',
    shadow: '#808080',
    darkShadow: '#404040',
    activeCaption: '#000080',
    activeCaptionText: '#ffffff',
};

export const SystemProperties: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'general' | 'device' | 'hardware' | 'performance'>('general');
    const [pressedButton, setPressedButton] = useState<string | null>(null);

    const tabs = [
        { id: 'general', label: 'General' },
        { id: 'device', label: 'Agent Guide' },
        { id: 'hardware', label: 'Hardware Profiles' },
        { id: 'performance', label: 'Performance' }
    ];

    return (
        <div style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: win.face,
            fontFamily: '"MS Sans Serif", Tahoma, sans-serif',
            fontSize: '14px', // Increased from 12px by ~15%
            overflow: 'hidden'
        }}>
            {/* Tab strip */}
            <div style={{
                display: 'flex',
                gap: '2px',
                padding: '6px 6px 0 6px',
                backgroundColor: win.face
            }}>
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            style={{
                                padding: '3px 10px 4px',
                                background: win.face,
                                borderTop: `2px solid ${isActive ? win.highlight : win.shadow}`,
                                borderLeft: `2px solid ${isActive ? win.highlight : win.shadow}`,
                                borderRight: `2px solid ${isActive ? win.darkShadow : win.lightShadow}`,
                                borderBottom: isActive ? '0' : `2px solid ${win.darkShadow}`,
                                position: 'relative',
                                top: isActive ? '1px' : '0',
                                zIndex: isActive ? 2 : 1,
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                                fontSize: '14px',
                                color: '#000',
                                boxShadow: isActive
                                    ? `inset -1px -1px 0 ${win.shadow}, inset 1px 1px 0 ${win.lightShadow}`
                                    : 'none'
                            }}
                        >
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Tab page frame */}
            <div style={{
                flex: 1,
                borderTop: `2px solid ${win.darkShadow}`,
                borderLeft: `2px solid ${win.highlight}`,
                borderRight: `2px solid ${win.darkShadow}`,
                borderBottom: `2px solid ${win.darkShadow}`,
                boxShadow: `inset 1px 1px 0 ${win.shadow}, inset -1px -1px 0 ${win.lightShadow}`,
                padding: '14px',
                margin: '0 6px 6px 6px',
                backgroundColor: win.face,
                overflow: 'auto'
            }}>
                {activeTab === 'general' && (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '150px 1fr',
                        columnGap: '18px',
                        alignItems: 'start'
                    }}>
                        {/* Left side - Icon block */}
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            paddingTop: '8px'
                        }}>
                            <Win98MonitorIcon width={180} />
                        </div>

                        {/* Right side - System info */}
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column'
                        }}>
                            {/* System */}
                            <div style={{ marginBottom: '10px' }}>
                                <div style={{ marginBottom: '2px' }}>System:</div>
                                <div style={{ paddingLeft: '12px' }}>
                                    <div>Microsoft Windows 98</div>
                                    <div>4.10.2222 C</div>
                                </div>
                            </div>

                            {/* Registered to */}
                            <div style={{ marginBottom: '10px', marginTop: '16px' }}>
                                <div style={{ marginBottom: '2px' }}>Registered to:</div>
                                <div style={{ paddingLeft: '12px' }}>
                                    <div>Joy Shi</div>
                                    <div>SWE (Product & Research)</div>
                                    <div>New York, NY</div>
                                </div>
                            </div>

                            {/* Product ID */}
                            <div style={{ marginBottom: '10px', marginTop: '16px' }}>
                                <div style={{ paddingLeft: '12px', color: win.activeCaption }}>
                                    4786-OEM-0014712-64586
                                </div>
                            </div>

                            {/* Special Thanks */}
                            <div style={{ marginTop: '16px' }}>
                                <div style={{ marginBottom: '2px' }}>Special Thanks to:</div>
                                <div style={{ paddingLeft: '12px' }}>
                                    <div>github.com/LucaArgentieri</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'device' && (
                    <div style={{ padding: '20px', textAlign: 'center', color: win.shadow }}>
                        <div>Agent Guide</div>
                        <div style={{ marginTop: '10px', fontSize: '13px' }}>
                            (Feature not implemented)
                        </div>
                    </div>
                )}

                {activeTab === 'hardware' && (
                    <div style={{ padding: '20px', textAlign: 'center', color: win.shadow }}>
                        <div>Hardware Profiles</div>
                        <div style={{ marginTop: '10px', fontSize: '13px' }}>
                            (Feature not implemented)
                        </div>
                    </div>
                )}

                {activeTab === 'performance' && (
                    <div style={{ padding: '20px', textAlign: 'center', color: win.shadow }}>
                        <div>Performance</div>
                        <div style={{ marginTop: '10px', fontSize: '13px' }}>
                            (Feature not implemented)
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom buttons */}
            <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '10px',
                padding: '6px 10px'
            }}>
                {['OK', 'Cancel'].map((label) => {
                    const isPressed = pressedButton === label;
                    return (
                        <button
                            key={label}
                            onMouseDown={() => setPressedButton(label)}
                            onMouseUp={() => setPressedButton(null)}
                            onMouseLeave={() => setPressedButton(null)}
                            style={{
                                minWidth: '72px',
                                padding: '3px 12px',
                                background: win.face,
                                borderTop: `2px solid ${isPressed ? win.darkShadow : win.highlight}`,
                                borderLeft: `2px solid ${isPressed ? win.darkShadow : win.highlight}`,
                                borderRight: `2px solid ${isPressed ? win.highlight : win.darkShadow}`,
                                borderBottom: `2px solid ${isPressed ? win.highlight : win.darkShadow}`,
                                boxShadow: isPressed
                                    ? `inset 1px 1px 0 ${win.shadow}`
                                    : `inset -1px -1px 0 ${win.shadow}, inset 1px 1px 0 ${win.lightShadow}`,
                                fontFamily: 'inherit',
                                fontSize: '14px',
                                cursor: 'pointer',
                                color: '#000'
                            }}
                        >
                            {label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
