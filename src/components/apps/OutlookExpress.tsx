import React, { useState } from 'react';

export const OutlookExpress: React.FC = () => {
    const [senderName, setSenderName] = useState('');
    const [senderEmail, setSenderEmail] = useState('');
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

    const handleSend = () => {
        if (!senderName || !senderEmail || !subject || !body) {
            // Simple validation feedback (could be better UI, but alert works for Win98 feel)
            // Or just don't send? Let's use early return and maybe user notices button does nothing.
            // Better: strictly enforce it.
            if (window.confirm("Please fill in Name, Email, Subject, and Message to send.")) {
                return;
            }
            return;
        }
        setStatus('sending');

        const formspreeUrl = import.meta.env.VITE_FORMSPREE;

        if (!formspreeUrl) {
            console.error("Formspree URL not configured");
            setTimeout(() => {
                setStatus('success');
                setBody('');
                setSubject('');
                setSenderName('');
                setSenderEmail('');
            }, 1000);
            return;
        }

        fetch(formspreeUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify({
                name: senderName,
                email: senderEmail,
                subject: subject,
                message: body,
            })
        })
            .then(response => {
                if (response.ok) {
                    setStatus('success');
                    setBody('');
                    setSubject('');
                    setSenderName('');
                    setSenderEmail('');
                } else {
                    setStatus('error');
                    console.error("Formspree submission failed");
                }
            })
            .catch(error => {
                console.error(error);
                setStatus('error');
            });
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#c0c0c0', fontFamily: 'Arial, sans-serif', fontSize: 15 }}>
            {/* Toolbar */}
            <div style={{ borderBottom: '1px solid #808080', padding: '2px 4px', display: 'flex', gap: 2 }}>
                <button
                    onClick={handleSend}
                    disabled={status === 'sending' || status === 'success'}
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        padding: '2px 8px',
                        minWidth: 50,
                        opacity: status === 'sending' ? 0.5 : 1
                    }}
                    data-agent-id="oe-btn-send"
                    data-agent-type="button"
                >
                    <img src="/img/outlook_express.png" alt="" style={{ width: 20, height: 20, marginBottom: 2 }} />
                    <span>{status === 'sending' ? 'Sending...' : 'Send'}</span>
                </button>
            </div>

            {/* Headers */}
            <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 8, backgroundColor: '#c0c0c0' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <label style={{ width: 60 }}>Name:</label>
                    <input
                        type="text"
                        value={senderName}
                        onChange={e => setSenderName(e.target.value)}
                        placeholder="Your Name"
                        style={{ flex: 1, border: '1px solid #808080', padding: 2 }}
                        data-agent-id="oe-input-name"
                        data-agent-type="input"
                    />
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <label style={{ width: 60 }}>Email:</label>
                    <input
                        type="email"
                        value={senderEmail}
                        onChange={e => setSenderEmail(e.target.value)}
                        placeholder="your@email.com"
                        style={{ flex: 1, border: '1px solid #808080', padding: 2 }}
                        data-agent-id="oe-input-email"
                        data-agent-type="input"
                    />
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <label style={{ width: 60 }}>Subject:</label>
                    <input
                        type="text"
                        value={subject}
                        onChange={e => setSubject(e.target.value)}
                        style={{ flex: 1, border: '1px solid #808080', padding: 2 }}
                        data-agent-id="oe-input-subject"
                        data-agent-type="input"
                    />
                </div>
            </div>

            {/* Body */}
            <textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                placeholder="Type your message here..."
                style={{
                    flex: 1,
                    resize: 'none',
                    border: '1px solid #808080',
                    padding: 8,
                    fontFamily: 'Courier New, monospace',
                    fontSize: 16,
                    outline: 'none',
                    margin: 2
                }}
                data-agent-id="oe-input-body"
                data-agent-type="textarea"
            />

            {/* Status Modal Overlay */}
            {status === 'success' && (
                <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div className="window" style={{ width: 250 }}>
                        <div className="title-bar">
                            <div className="title-bar-text">Outlook Express</div>
                            <div className="title-bar-controls">
                                <button aria-label="Close" onClick={() => setStatus('idle')}></button>
                            </div>
                        </div>
                        <div className="window-body" style={{ textAlign: 'center', padding: 20 }}>
                            <p>Message Sent Successfully!</p>
                            <button onClick={() => setStatus('idle')}>OK</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
