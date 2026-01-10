import React from 'react';
import clsx from 'clsx';

interface DesktopIconProps {
    label: string;
    iconSrc: string;
    onClick?: () => void;
    onDoubleClick?: () => void;
    selected?: boolean;
}

export const DesktopIcon: React.FC<DesktopIconProps> = ({
    label,
    iconSrc,
    onClick,
    onDoubleClick,
    selected = false,
}) => {
    return (
        <div
            className={clsx("desktop-icon", { selected })}
            data-agent-id={`icon-${label.replace(/\s+/g, '-').toLowerCase()}`}
            data-agent-type="icon"
            onClick={onClick}
            onDoubleClick={onDoubleClick}
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                width: 80,
                padding: 5,
                cursor: 'pointer',
                textAlign: 'center',
            }}
        >
            <img
                src={iconSrc}
                alt={label}
                style={{ width: 37, height: 37, marginBottom: 4 }}
                draggable={false}
            />
            <span
                style={{
                    color: 'white',
                    fontFamily: 'Pixelated MS Sans Serif',
                    fontSize: 14,
                    backgroundColor: selected ? '#000080' : 'transparent',
                    border: selected ? '1px dotted white' : 'none',
                    padding: '0 2px',
                    textShadow: '1px 1px 1px black',
                }}
            >
                {label}
            </span>
        </div>
    );
};
