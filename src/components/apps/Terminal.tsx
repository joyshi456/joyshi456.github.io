import React, { useState, useEffect, useRef } from 'react';

interface TerminalProps {
    onExecute: (command: string) => void;
    onCancel?: () => void;
}

const HEADER_TEXT = `Microsoft(R) Windows 98
(C) Copyright 1985-1998 Microsoft Corp.`;

export const Terminal: React.FC<TerminalProps> = ({ onExecute }) => {
    const [text, setText] = useState("");
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.focus();
        }
    }, []);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();

            const lines = text.split('\n');
            const lastLine = lines[lines.length - 1];
            const command = lastLine.trim();

            let newText = text + "\n";

            if (command) {
                onExecute(command);
                if (command.toLowerCase() === 'ver') {
                    newText += "Windows 98 [Version 4.10.1998]\n";
                } else if (command.toLowerCase() === 'cls') {
                    setText("");
                    return;
                } else if (command.toLowerCase() === 'help') {
                    newText += "Supported commands: ver, cls, exit, help\n";
                }
            }
            setText(newText);

            setTimeout(() => {
                if (textareaRef.current) {
                    textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
                }
            }, 0);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setText(e.target.value);
    };

    return (
        // Container fills the Window Body (which now has standard margins)
        <div style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            boxSizing: 'border-box'
        }}>
            {/* Black Box Grid - removed white wrapper */}
            <div style={{
                flex: 1,
                backgroundColor: 'black',
                color: 'white',
                fontFamily: '"font98", "Pixelated MS Sans Serif", monospace',
                fontSize: '17px',
                display: 'flex',
                flexDirection: 'column',
                padding: 4,
                overflow: 'hidden',
                cursor: 'text'
            }}
                onClick={() => textareaRef.current?.focus()}
            >
                <div style={{ whiteSpace: 'pre-wrap', marginBottom: 0, lineHeight: 1.2 }}>
                    {HEADER_TEXT}
                </div>

                <textarea
                    ref={textareaRef}
                    value={text}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    spellCheck={false}
                    style={{
                        flex: 1,
                        width: '100%',
                        backgroundColor: 'black',
                        color: 'white',
                        fontFamily: 'inherit',
                        fontSize: 'inherit',
                        border: 'none',
                        outline: 'none',
                        resize: 'none',
                        padding: 0,
                        margin: 0,
                        boxSizing: 'border-box',
                        lineHeight: '1.2',
                        cursor: 'text'
                    }}
                    data-agent-id="terminal-input"
                />
            </div>
        </div>
    );
};
