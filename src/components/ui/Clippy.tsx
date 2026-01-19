import React from 'react';

interface ClippyProps {
    message: string;
    buttons?: Array<{
        label: string;
        onClick: () => void;
    }>;
    position?: { x: number; y: number };
    onClose?: () => void;
}

export const Clippy: React.FC<ClippyProps> = ({
    message,
    buttons = [],
    position = { x: 100, y: 100 },
    onClose
}) => {
    return (
        <div
            style={{
                position: 'fixed',
                left: position.x,
                top: position.y,
                zIndex: 10000,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                pointerEvents: 'auto',
            }}
        >
            {/* Speech Bubble */}
            <div
                style={{
                    position: 'relative',
                    backgroundColor: '#ffffcc',
                    border: '1px solid #000',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    maxWidth: '220px',
                    marginBottom: '8px',
                    boxShadow: '2px 2px 4px rgba(0,0,0,0.3)',
                    fontFamily: '"MS Sans Serif", Tahoma, sans-serif',
                    fontSize: '13px',
                    lineHeight: '1.4',
                }}
            >
                {/* Close button */}
                {onClose && (
                    <button
                        onClick={onClose}
                        style={{
                            position: 'absolute',
                            top: '2px',
                            right: '4px',
                            background: 'none',
                            border: 'none',
                            fontSize: '14px',
                            cursor: 'pointer',
                            color: '#666',
                            padding: '0 4px',
                        }}
                    >
                        ×
                    </button>
                )}

                {/* Message */}
                <div style={{ marginBottom: buttons.length > 0 ? '12px' : 0 }}>
                    {message}
                </div>

                {/* Buttons */}
                {buttons.length > 0 && (
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        {buttons.map((btn, i) => (
                            <button
                                key={i}
                                onClick={btn.onClick}
                                style={{
                                    padding: '4px 16px',
                                    backgroundColor: '#c0c0c0',
                                    border: '2px outset #fff',
                                    fontFamily: '"MS Sans Serif", Tahoma, sans-serif',
                                    fontSize: '12px',
                                    cursor: 'pointer',
                                }}
                                onMouseDown={(e) => {
                                    e.currentTarget.style.border = '2px inset #fff';
                                }}
                                onMouseUp={(e) => {
                                    e.currentTarget.style.border = '2px outset #fff';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.border = '2px outset #fff';
                                }}
                            >
                                {btn.label}
                            </button>
                        ))}
                    </div>
                )}

                {/* Speech bubble tail */}
                <div
                    style={{
                        position: 'absolute',
                        bottom: '-10px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: 0,
                        height: 0,
                        borderLeft: '10px solid transparent',
                        borderRight: '10px solid transparent',
                        borderTop: '10px solid #000',
                    }}
                />
                <div
                    style={{
                        position: 'absolute',
                        bottom: '-8px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: 0,
                        height: 0,
                        borderLeft: '9px solid transparent',
                        borderRight: '9px solid transparent',
                        borderTop: '9px solid #ffffcc',
                    }}
                />
            </div>

            {/* Clippy Image */}
            <img
                src="/img/Clippy.png"
                alt="Clippy"
                style={{
                    width: '80px',
                    height: 'auto',
                    imageRendering: 'pixelated',
                }}
                draggable={false}
            />
        </div>
    );
};
