import type { ButtonHTMLAttributes } from 'react';
import clsx from 'clsx';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'default' | 'icon';
}

export const Button = ({ className, children, ...props }: ButtonProps) => {
    return (
        <button className={clsx(className)} {...props}>
            {children}
        </button>
    );
};
