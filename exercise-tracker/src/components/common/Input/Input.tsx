import { type InputHTMLAttributes, forwardRef } from 'react';
import styles from './Input.module.css';

type InputSize = 'sm' | 'md' | 'lg';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    helperText?: string;
    inputSize?: InputSize;
    isRequired?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    (
        {
            label,
            error,
            helperText,
            inputSize = 'md',
            isRequired = false,
            className = '',
            type = 'text',
            ...props
        },
        ref
    ) => {
        const inputClassNames = [
            styles.input,
            inputSize !== 'md' && styles[`input--${inputSize}`],
            error && styles['input--error'],
            type === 'number' && styles['input--number'],
            className,
        ]
            .filter(Boolean)
            .join(' ');

        const labelClassNames = [
            styles.label,
            isRequired && styles['label--required'],
        ]
            .filter(Boolean)
            .join(' ');

        return (
            <div className={styles.inputWrapper}>
                {label && (
                    <label className={labelClassNames}>
                        {label}
                    </label>
                )}
                <input
                    ref={ref}
                    type={type}
                    className={inputClassNames}
                    aria-invalid={!!error}
                    {...props}
                />
                {error && <span className={styles.errorText}>{error}</span>}
                {!error && helperText && (
                    <span className={styles.helperText}>{helperText}</span>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';

// Search Input with icon
interface SearchInputProps extends Omit<InputProps, 'type'> {
    onClear?: () => void;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
    ({ className = '', ...props }, ref) => {
        return (
            <div className={styles.searchWrapper}>
                <svg
                    className={styles.searchIcon}
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                >
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" />
                </svg>
                <Input
                    ref={ref}
                    type="search"
                    className={`${styles['input--search']} ${className}`}
                    {...props}
                />
            </div>
        );
    }
);

SearchInput.displayName = 'SearchInput';
