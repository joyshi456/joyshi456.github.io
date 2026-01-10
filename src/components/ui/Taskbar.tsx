import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import clsx from 'clsx';

interface TaskbarProps {
    onStartClick: () => void;
    windows: Array<{ id: string; title: string; minimized: boolean; active: boolean }>;
    onWindowClick: (id: string) => void;
}

export const Taskbar: React.FC<TaskbarProps> = ({ onStartClick, windows, onWindowClick }) => {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    };

    return (
        <div className="taskbar" style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 28,
            backgroundColor: '#c0c0c0',
            borderTop: '2px solid #fff',
            display: 'flex',
            alignItems: 'center',
            padding: 2,
            zIndex: 1000,
            boxShadow: 'inset 0 1px 0 #fff'
        }}>
            <Button
                onClick={onStartClick}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    fontWeight: 'bold',
                    height: '100%',
                    padding: '2px 4px'
                }}
            >
                <img
                    src="/img/start.png"
                    alt=""
                    style={{ marginRight: 4, height: 16 }}
                    onError={(e) => e.currentTarget.style.display = 'none'}
                />
                Start
            </Button>

            <div className="vertical-divider" style={{ width: 2, height: 20, margin: '0 4px', borderLeft: '1px solid #808080', borderRight: '1px solid #fff' }} />

            <div className="tasks" style={{ flex: 1, display: 'flex', gap: 2 }}>
                {windows.map((win) => (
                    <Button
                        key={win.id}
                        onClick={() => onWindowClick(win.id)}
                        className={clsx({ active: win.active && !win.minimized })}
                        data-agent-id={`taskbar-win-${win.id}`}
                        data-agent-type="button"
                        style={{
                            flex: 1,
                            maxWidth: 150,
                            textAlign: 'left',
                            display: 'flex',
                            alignItems: 'center',
                            height: '100%',
                            padding: '2px 4px',
                            fontWeight: win.active ? 'bold' : 'normal',
                            backgroundColor: win.active && !win.minimized ? '#e0e0e0' : undefined,
                            boxShadow: win.active && !win.minimized
                                ? 'inset 1px 1px #000, inset -1px -1px #fff' // Pressed look
                                : undefined
                        }}
                    >
                        <span style={{ overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                            {win.title}
                        </span>
                    </Button>
                ))}
            </div>

            <div className="vertical-divider" style={{ width: 2, height: 20, margin: '0 4px', borderLeft: '1px solid #808080', borderRight: '1px solid #fff' }} />

            <div className="tray" style={{
                display: 'flex',
                alignItems: 'center',
                padding: '0 8px',
                border: '1px solid #808080',
                borderBottomColor: '#fff',
                borderRightColor: '#fff',
                height: 22,
                backgroundColor: '#c0c0c0'
            }}>
                <img src="/img/audio.ico" alt="" style={{ height: 16, marginRight: 8 }} />
                <span style={{ fontSize: 13 }}>{formatTime(time)}</span>
            </div>
        </div>
    );
};
