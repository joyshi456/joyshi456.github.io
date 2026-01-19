import React, { useRef, useEffect } from 'react';

interface WindowProps {
    title: string;
    children?: React.ReactNode;
    isActive?: boolean;
    onClose?: () => void;
    onMinimize?: () => void;
    onMaximize?: () => void;
    onMouseDown?: () => void;
    style?: React.CSSProperties;
    onDragEnd?: (x: number, y: number) => void;
    onResize?: (width: number, height: number) => void;
    noPadding?: boolean;
    icon?: string;
}

export const Window: React.FC<WindowProps> = ({
    title,
    children,
    isActive = false,
    onClose,
    onMinimize,
    onMaximize,
    onMouseDown,
    style,
    onDragEnd,
    onResize,
    noPadding = false,
    icon
}) => {
    const windowRef = useRef<HTMLDivElement>(null);
    const isDragging = useRef(false);
    const dragOffset = useRef({ x: 0, y: 0 });
    const isResizing = useRef(false);
    const resizeDirection = useRef<string>('');
    const resizeStart = useRef({ x: 0, y: 0, width: 0, height: 0, left: 0, top: 0 });

    const handleMouseDown = (e: React.MouseEvent) => {
        // Always focus the window on any click
        if (onMouseDown) onMouseDown();

        // Only start drag from title bar (not from controls)
        if ((e.target as HTMLElement).closest('.title-bar-controls')) return;
        if (!(e.target as HTMLElement).closest('.title-bar')) return;

        isDragging.current = true;
        const rect = windowRef.current?.getBoundingClientRect();
        if (rect) {
            dragOffset.current = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            };
        }
    };

    const handleResizeMouseDown = (e: React.MouseEvent, direction: string) => {
        e.stopPropagation();
        if (onMouseDown) onMouseDown();

        isResizing.current = true;
        resizeDirection.current = direction;

        const rect = windowRef.current?.getBoundingClientRect();
        if (rect) {
            resizeStart.current = {
                x: e.clientX,
                y: e.clientY,
                width: rect.width,
                height: rect.height,
                left: rect.left,
                top: rect.top
            };
        }
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isDragging.current && windowRef.current) {
                const newX = e.clientX - dragOffset.current.x;
                const newY = e.clientY - dragOffset.current.y;

                windowRef.current.style.left = `${newX}px`;
                windowRef.current.style.top = `${newY}px`;
            }

            if (isResizing.current && windowRef.current) {
                const deltaX = e.clientX - resizeStart.current.x;
                const deltaY = e.clientY - resizeStart.current.y;
                const direction = resizeDirection.current;

                let newWidth = resizeStart.current.width;
                let newHeight = resizeStart.current.height;
                let newLeft = resizeStart.current.left;
                let newTop = resizeStart.current.top;

                if (direction.includes('e')) {
                    newWidth = Math.max(200, resizeStart.current.width + deltaX);
                }
                if (direction.includes('s')) {
                    newHeight = Math.max(150, resizeStart.current.height + deltaY);
                }
                if (direction.includes('w')) {
                    const proposedWidth = resizeStart.current.width - deltaX;
                    if (proposedWidth >= 200) {
                        newWidth = proposedWidth;
                        newLeft = resizeStart.current.left + deltaX;
                    } else {
                        newWidth = 200;
                        newLeft = resizeStart.current.left + (resizeStart.current.width - 200);
                    }
                }
                if (direction.includes('n')) {
                    const proposedHeight = resizeStart.current.height - deltaY;
                    if (proposedHeight >= 150) {
                        newHeight = proposedHeight;
                        newTop = resizeStart.current.top + deltaY;
                    } else {
                        newHeight = 150;
                        newTop = resizeStart.current.top + (resizeStart.current.height - 150);
                    }
                }

                windowRef.current.style.width = `${newWidth}px`;
                windowRef.current.style.height = `${newHeight}px`;
                windowRef.current.style.left = `${newLeft}px`;
                windowRef.current.style.top = `${newTop}px`;
            }
        };

        const handleMouseUp = () => {
            if (isDragging.current) {
                isDragging.current = false;
                if (onDragEnd && windowRef.current) {
                    const rect = windowRef.current.getBoundingClientRect();
                    onDragEnd(rect.left, rect.top);
                }
            }

            if (isResizing.current) {
                isResizing.current = false;
                if (windowRef.current) {
                    const rect = windowRef.current.getBoundingClientRect();
                    if (onResize) {
                        onResize(rect.width, rect.height);
                    }
                    // Also update position in case north/west resize changed it
                    if (onDragEnd) {
                        onDragEnd(rect.left, rect.top);
                    }
                }
            }
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [onDragEnd, onResize]);

    return (
        <div
            ref={windowRef}
            className={`window ${isActive ? 'active' : ''}`}
            style={{
                ...style,
                // Enforce flex column layout so children can scale
                display: 'flex',
                flexDirection: 'column',
                // Needed for resize handles to position correctly
                position: style?.position || 'absolute'
            }}
            onMouseDown={handleMouseDown}
        >
            <div className="title-bar">
                <div className="title-bar-text">
                    {icon && <img src={icon} alt="" style={{ width: 16, height: 16, marginRight: 4, verticalAlign: 'bottom' }} />}
                    {title}
                </div>
                <div className="title-bar-controls">
                    {onMinimize && <button aria-label="Minimize" onClick={onMinimize} data-agent-id={`win-${title}-minimize`} data-agent-type="button" />}
                    {onMaximize && <button aria-label="Maximize" onClick={onMaximize} data-agent-id={`win-${title}-maximize`} data-agent-type="button" />}
                    {onClose && <button aria-label="Close" onClick={onClose} data-agent-id={`win-${title}-close`} data-agent-type="button" />}
                </div>
            </div>
            <div className="window-body" style={{
                // If noPadding is true, remove padding.
                // Otherwise let 98.css / user agent stylesheet handle margin (usually 8px).
                padding: noPadding ? 0 : undefined,

                // CRITICAL: Use flex: 1 to make the body fill the remaining vertical space
                flex: 1,

                // Make the window-body IS ALSO a flex container so ITS children can scale
                // IF noPadding is true. If normal, we usually just let flow.
                // But for scaling apps like Terminal, we need this.
                // Let's safe-guard: if noPadding, force flex. If normal, allow flow but still fill height?
                // Actually, for "normal" windows like Outlook, flex column won't hurt usually.
                display: 'flex',
                flexDirection: 'column',

                overflow: 'hidden',

                // If noPadding, we ALSO need to kill the implicit margin from 98.css
                margin: noPadding ? 0 : undefined
            }}>
                {children}
            </div>

            {/* Resize handles */}
            {onResize && (
                <>
                    {/* Corner handles */}
                    <div
                        onMouseDown={(e) => handleResizeMouseDown(e, 'se')}
                        style={{
                            position: 'absolute',
                            bottom: 0,
                            right: 0,
                            width: 8,
                            height: 8,
                            cursor: 'nwse-resize',
                            zIndex: 10
                        }}
                    />
                    <div
                        onMouseDown={(e) => handleResizeMouseDown(e, 'sw')}
                        style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            width: 8,
                            height: 8,
                            cursor: 'nesw-resize',
                            zIndex: 10
                        }}
                    />
                    <div
                        onMouseDown={(e) => handleResizeMouseDown(e, 'ne')}
                        style={{
                            position: 'absolute',
                            top: 0,
                            right: 0,
                            width: 8,
                            height: 8,
                            cursor: 'nesw-resize',
                            zIndex: 10
                        }}
                    />
                    <div
                        onMouseDown={(e) => handleResizeMouseDown(e, 'nw')}
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: 8,
                            height: 8,
                            cursor: 'nwse-resize',
                            zIndex: 10
                        }}
                    />

                    {/* Edge handles */}
                    <div
                        onMouseDown={(e) => handleResizeMouseDown(e, 'e')}
                        style={{
                            position: 'absolute',
                            top: 0,
                            right: 0,
                            width: 4,
                            height: '100%',
                            cursor: 'ew-resize',
                            zIndex: 9
                        }}
                    />
                    <div
                        onMouseDown={(e) => handleResizeMouseDown(e, 'w')}
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: 4,
                            height: '100%',
                            cursor: 'ew-resize',
                            zIndex: 9
                        }}
                    />
                    <div
                        onMouseDown={(e) => handleResizeMouseDown(e, 's')}
                        style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            width: '100%',
                            height: 4,
                            cursor: 'ns-resize',
                            zIndex: 9
                        }}
                    />
                    <div
                        onMouseDown={(e) => handleResizeMouseDown(e, 'n')}
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: 4,
                            cursor: 'ns-resize',
                            zIndex: 9
                        }}
                    />
                </>
            )}
        </div>
    );
};
