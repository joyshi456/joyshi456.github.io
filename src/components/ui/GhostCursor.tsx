import React from 'react';
import { motion } from 'framer-motion';
import { MousePointer2 } from 'lucide-react';

interface GhostCursorProps {
    x: number;
    y: number;
    label?: string | null;
    isClicking?: boolean;
}

export const GhostCursor: React.FC<GhostCursorProps> = ({ x, y, label, isClicking }) => {
    return (
        <motion.div
            initial={{ x: 0, y: 0 }}
            animate={{ x, y }}
            transition={{
                type: "tween",
                ease: [0.25, 0.1, 0.25, 1.0], // "The Human Bezier"
                duration: 1.5
            }}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                pointerEvents: 'none',
                zIndex: 10000,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start'
            }}
        >
            <motion.div
                animate={{ scale: isClicking ? 0.8 : 1 }}
                transition={{ duration: 0.1 }}
            >
                {/* Use a filled mouse pointer for better visibility */}
                <MousePointer2
                    size={24}
                    color="black"
                    fill="white"
                    style={{
                        filter: 'drop-shadow(1px 1px 1px rgba(0,0,0,0.3))'
                    }}
                />
            </motion.div>

            {label && (
                <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 5 }}
                    exit={{ opacity: 0 }}
                    style={{
                        backgroundColor: '#ffffe0', // Tooltip yellow
                        border: '1px solid #000',
                        padding: '2px 6px',
                        borderRadius: '0px', // Win98 style
                        fontSize: '14px',
                        fontFamily: 'ms_sans_serif',
                        boxShadow: '2px 2px 0px rgba(0,0,0,0.2)',
                        marginLeft: '12px',
                        marginTop: '0px'
                    }}
                >
                    {label}
                </motion.div>
            )}
        </motion.div>
    );
};
