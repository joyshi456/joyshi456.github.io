import React, { useRef, useEffect, useState } from 'react';

// Classic Windows 98 Paint Layout:
// Top: Menu Bar (File, Edit, View, Image, Colors, Help) - Simplified to just File/Edit for now or omitted if complex
// Left: Toolbar (16 icons usually)
// Bottom: Color Palette (28 colors usually)
// Center: Canvas Container (Scrollable)

// Colors from standard Win98 Palette
const COLORS = [
    '#000000', '#808080', '#800000', '#808000', '#008000', '#008080', '#000080', '#800080', '#808040', '#004040', '#0080ff', '#004080', '#8000ff', '#804000',
    '#ffffff', '#c0c0c0', '#ff0000', '#ffff00', '#00ff00', '#00ffff', '#0000ff', '#ff00ff', '#ffff80', '#00ff80', '#80ffff', '#8080ff', '#ff8000', '#ff8080',
];

interface PaintProps { }

export const Paint: React.FC<PaintProps> = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [selectedColor, setSelectedColor] = useState('#000000');
    const [secondaryColor, setSecondaryColor] = useState('#ffffff'); // Right click color
    const [isDrawing, setIsDrawing] = useState(false);
    const lastPos = useRef<{ x: number, y: number } | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Fill white background initial
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }, []);

    const startDrawing = (e: React.MouseEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        lastPos.current = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
        setIsDrawing(true);
    };

    const draw = (e: React.MouseEvent) => {
        if (!isDrawing || !lastPos.current) return;
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Use secondary color for right mouse button
        const color = e.buttons === 2 ? secondaryColor : selectedColor;

        ctx.strokeStyle = color;
        ctx.lineWidth = 2; // Slightly thicker for visibility
        ctx.lineCap = 'round'; // Smoother lines
        ctx.lineJoin = 'round';

        ctx.beginPath();
        ctx.moveTo(lastPos.current.x, lastPos.current.y);
        ctx.lineTo(x, y);
        ctx.stroke();

        lastPos.current = { x, y };
    };

    const stopDrawing = () => {
        setIsDrawing(false);
        lastPos.current = null;
    };

    // Tools Placeholder (just visual rectangles)
    const ToolsPanel = () => (
        <div style={{
            width: 52,
            backgroundColor: '#c0c0c0',
            borderRight: '1px solid #808080',
            borderBottom: '1px solid #808080',
            padding: 2,
            display: 'flex',
            flexWrap: 'wrap',
            alignContent: 'flex-start',
            gap: 2
        }}>
            {/* Fake Tools */}
            {Array.from({ length: 16 }).map((_, i) => (
                <div key={i} style={{
                    width: 22, height: 22,
                    borderTop: '1px solid #ffffff', borderLeft: '1px solid #ffffff',
                    borderRight: '1px solid #808080', borderBottom: '1px solid #808080',
                    display: 'flex', justifyContent: 'center', alignItems: 'center',
                    cursor: 'default'
                }}>
                    <div style={{ width: 12, height: 12, border: '1px dotted #808080' }} />
                </div>
            ))}
        </div>
    );

    const PalettePanel = () => (
        <div style={{
            height: 48,
            backgroundColor: '#c0c0c0',
            borderTop: '1px solid #ffffff',
            padding: 4,
            display: 'flex',
            gap: 10,
            alignItems: 'center'
        }}>
            {/* Current Colors Box */}
            <div style={{
                width: 32, height: 32,
                borderTop: '1px solid #808080', borderLeft: '1px solid #808080',
                borderRight: '1px solid #ffffff', borderBottom: '1px solid #ffffff',
                position: 'relative',
                backgroundColor: '#c0c0c0'
            }}>
                {/* Secondary Back */}
                <div style={{
                    position: 'absolute', top: 8, left: 8, width: 14, height: 14, backgroundColor: secondaryColor,
                    border: '1px inset'
                }} />
                {/* Primary Front */}
                <div style={{
                    position: 'absolute', top: 3, left: 3, width: 14, height: 14, backgroundColor: selectedColor,
                    border: '1px inset', zIndex: 2
                }} />
            </div>

            {/* Palette Grid */}
            <div style={{ display: 'flex', flexWrap: 'wrap', width: 300, height: 36, alignContent: 'space-between' }}>
                {COLORS.map(c => {
                    const isSelected = c === selectedColor;
                    const isSecondary = c === secondaryColor;
                    return (
                        <div
                            key={c}
                            onMouseDown={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (e.button === 0) {
                                    // Left click
                                    console.log('Color selected (left click):', c);
                                    setSelectedColor(c);
                                } else if (e.button === 2) {
                                    // Right click
                                    console.log('Secondary color selected (right click):', c);
                                    setSecondaryColor(c);
                                }
                            }}
                            onContextMenu={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                            }}
                            style={{
                                width: 18,
                                height: 16,
                                backgroundColor: c,
                                border: isSelected ? '2px solid #000000' : '1px solid #808080',
                                marginRight: 1,
                                marginBottom: 1,
                                cursor: 'pointer',
                                boxSizing: 'border-box',
                                position: 'relative',
                                outline: isSecondary && !isSelected ? '1px dashed #000' : 'none',
                                outlineOffset: '-2px',
                                userSelect: 'none'
                            }}
                            title={`Left click: drawing color, Right click: background color`}
                        />
                    );
                })}
            </div>
        </div>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#c0c0c0' }}>
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                {/* Left: Tools */}
                <ToolsPanel />

                {/* Center: Canvas Container */}
                <div style={{
                    flex: 1,
                    backgroundColor: '#808080',
                    padding: 3, // Inset look
                    borderTop: '1px solid #808080', borderLeft: '1px solid #808080',
                    borderRight: '1px solid #ffffff', borderBottom: '1px solid #ffffff',
                    margin: 2,
                    overflow: 'auto',
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'flex-start'
                }}>
                    <canvas
                        ref={canvasRef}
                        width={600}
                        height={400}
                        style={{
                            backgroundColor: '#ffffff',
                            cursor: 'crosshair',
                            boxShadow: '1px 1px 2px rgba(0,0,0,0.3)'
                        }}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onContextMenu={(e) => e.preventDefault()}
                        data-agent-id="canvas-paint"
                        data-agent-type="canvas"
                    />
                </div>
            </div>

            {/* Bottom: Palette */}
            <PalettePanel />
        </div>
    );
};
