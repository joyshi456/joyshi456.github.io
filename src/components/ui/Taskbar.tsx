import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from './Button';
import clsx from 'clsx';
import { changeLanguage } from '../../i18n';
import { useStore } from '../../store/store';

interface TaskbarProps {
    onStartClick: () => void;
    windows: Array<{ id: string; title: string; minimized: boolean; active: boolean }>;
    onWindowClick: (id: string) => void;
}

// Language options with their display info
const LANGUAGES = [
    { code: 'en', label: 'English (American)', shortCode: 'En', flag: '🇺🇸' },
    { code: 'zh-CN', label: 'Chinese (Simplified) IME', shortCode: '中', flag: '🇨🇳' },
];

export const Taskbar: React.FC<TaskbarProps> = ({ onStartClick, windows, onWindowClick }) => {
    const { t, i18n } = useTranslation();
    const [time, setTime] = useState(new Date());
    const [showLangMenu, setShowLangMenu] = useState(false);
    const langMenuRef = useRef<HTMLDivElement>(null);
    const { agentStatus, cancelAgent } = useStore();

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (langMenuRef.current && !langMenuRef.current.contains(e.target as Node)) {
                setShowLangMenu(false);
            }
        };
        if (showLangMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showLangMenu]);

    const currentLang = LANGUAGES.find(l => l.code === i18n.language) || LANGUAGES[0];

    const handleLanguageSelect = (code: string) => {
        changeLanguage(code);
        setShowLangMenu(false);
    };

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
                {t('taskbar.start')}
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
                padding: '0 4px',
                border: '1px solid #808080',
                borderBottomColor: '#fff',
                borderRightColor: '#fff',
                height: 22,
                backgroundColor: '#c0c0c0',
                gap: '4px'
            }}>
                {/* Stop Agent Icon - only shows when agent is running */}
                {agentStatus !== 'idle' && (
                    <button
                        onClick={cancelAgent}
                        title="Stop Agent"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '16px',
                            height: '16px',
                            backgroundColor: '#c00000',
                            border: '1px solid #000',
                            cursor: 'pointer',
                            padding: 0,
                            borderRadius: '2px',
                        }}
                    >
                        <span style={{ color: '#fff', fontSize: '10px', fontWeight: 'bold', lineHeight: 1 }}>■</span>
                    </button>
                )}
                <img src="/img/audio.ico" alt="" style={{ height: 16 }} />

                {/* Language Indicator */}
                <div ref={langMenuRef} style={{ position: 'relative' }}>
                    <button
                        onClick={() => setShowLangMenu(!showLangMenu)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '16px',
                            height: '16px',
                            backgroundColor: '#000080',
                            color: '#fff',
                            border: '1px solid #000',
                            fontSize: '9px',
                            fontWeight: 'bold',
                            fontFamily: '"MS Sans Serif", Tahoma, sans-serif',
                            cursor: 'pointer',
                            padding: 0,
                        }}
                        title={currentLang.label}
                    >
                        {currentLang.shortCode}
                    </button>

                    {/* Language Menu Popup */}
                    {showLangMenu && (
                        <div style={{
                            position: 'absolute',
                            bottom: '100%',
                            right: 0,
                            marginBottom: '4px',
                            backgroundColor: '#c0c0c0',
                            border: '2px solid #fff',
                            borderRightColor: '#404040',
                            borderBottomColor: '#404040',
                            boxShadow: 'inset -1px -1px 0 #808080, inset 1px 1px 0 #dfdfdf, 2px 2px 4px rgba(0,0,0,0.3)',
                            minWidth: '180px',
                            zIndex: 10001,
                        }}>
                            {LANGUAGES.map((lang) => {
                                const isSelected = lang.code === i18n.language;
                                return (
                                    <div
                                        key={lang.code}
                                        onClick={() => handleLanguageSelect(lang.code)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            padding: '4px 8px',
                                            cursor: 'pointer',
                                            backgroundColor: isSelected ? '#000080' : 'transparent',
                                            color: isSelected ? '#fff' : '#000',
                                            fontSize: '12px',
                                            fontFamily: '"MS Sans Serif", Tahoma, sans-serif',
                                            gap: '8px',
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!isSelected) {
                                                e.currentTarget.style.backgroundColor = '#000080';
                                                e.currentTarget.style.color = '#fff';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!isSelected) {
                                                e.currentTarget.style.backgroundColor = 'transparent';
                                                e.currentTarget.style.color = '#000';
                                            }
                                        }}
                                    >
                                        <span style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            width: '18px',
                                            height: '12px',
                                            backgroundColor: lang.code === 'zh-CN' ? '#de2910' : '#002868',
                                            color: '#fff',
                                            fontSize: '8px',
                                            fontWeight: 'bold',
                                        }}>
                                            {lang.shortCode}
                                        </span>
                                        {lang.label}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <span style={{ fontSize: 13 }}>{formatTime(time)}</span>
            </div>
        </div>
    );
};
