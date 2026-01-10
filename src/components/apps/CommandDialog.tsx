import React, { useState } from 'react';
import { Button } from '../ui/Button';

interface CommandDialogProps {
    onExecute?: (query: string) => void;
    onCancel?: () => void;
}

export const CommandDialog: React.FC<CommandDialogProps> = ({ onExecute, onCancel }) => {
    const [query, setQuery] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleExecute();
    };

    const handleExecute = () => {
        if (query.trim() && onExecute) {
            onExecute(query);
        }
    };

    return (
        <div style={{ padding: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
                <img src="/img/run_icon.png" alt="" style={{ width: 32, marginRight: 10 }} onError={(e) => e.currentTarget.style.display = 'none'} />
                <p style={{ margin: 0 }}>Type the name of a program, folder, document, or Internet resource, and Windows will open it for you.</p>
            </div>
            <form onSubmit={handleSubmit}>
                <div className="command-input-row" style={{ display: 'flex', alignItems: 'center', marginBottom: 15 }}>
                    <label style={{ marginRight: 10 }}>Open:</label>
                    <input
                        type="text"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' ? handleExecute() : null}
                        autoFocus
                        data-agent-id="cmd-input"
                        data-agent-type="input"
                        style={{ flex: 1 }}
                    />
                </div>
                <div className="command-buttons" style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                    <Button type="submit" onClick={handleExecute} data-agent-id="cmd-btn-ok" data-agent-type="button">OK</Button>
                    <Button type="button" onClick={onCancel} data-agent-id="cmd-btn-cancel" data-agent-type="button">Cancel</Button>
                    <Button type="button" disabled>Browse...</Button>
                </div>
            </form>
        </div>
    );
};
