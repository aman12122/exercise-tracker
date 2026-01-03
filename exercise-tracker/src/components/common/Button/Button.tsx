import { type ButtonHTMLAttributes, type ReactNode } from 'react';
import styles from './Button.module.css';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    isLoading?: boolean;
    isFullWidth?: boolean;
    isIconOnly?: boolean;
    leftIcon?: ReactNode;
    rightIcon?: ReactNode;
    children: ReactNode;
}

export function Button({
    variant = 'primary',
    size = 'md',
    isLoading = false,
    isFullWidth = false,
    isIconOnly = false,
    leftIcon,
    rightIcon,
    children,
    className = '',
    disabled,
    ...props
}: ButtonProps) {
    const classNames = [
        styles.button,
        styles[`button--${variant}`],
        size !== 'md' && styles[`button--${size}`],
        isFullWidth && styles['button--full'],
        isIconOnly && styles['button--icon'],
        className,
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <button
            className={classNames}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading ? (
                <span className={styles.button__spinner} aria-hidden="true" />
            ) : (
                leftIcon
            )}
            {!isIconOnly && children}
            {!isLoading && rightIcon}
        </button>
    );
}
