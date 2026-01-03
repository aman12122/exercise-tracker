import { type HTMLAttributes, type ReactNode } from 'react';
import styles from './Card.module.css';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
    isElevated?: boolean;
    isInteractive?: boolean;
    isSelected?: boolean;
    children: ReactNode;
}

interface CardHeaderProps {
    title: string;
    subtitle?: string;
    action?: ReactNode;
}

interface CardBodyProps {
    isCompact?: boolean;
    children: ReactNode;
}

interface CardFooterProps {
    children: ReactNode;
}

export function Card({
    isElevated = false,
    isInteractive = false,
    isSelected = false,
    children,
    className = '',
    ...props
}: CardProps) {
    const classNames = [
        styles.card,
        isElevated && styles['card--elevated'],
        isInteractive && styles['card--interactive'],
        isSelected && styles['card--selected'],
        className,
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <div className={classNames} {...props}>
            {children}
        </div>
    );
}

export function CardHeader({ title, subtitle, action }: CardHeaderProps) {
    return (
        <div className={styles.card__header}>
            <div>
                <h3 className={styles.card__title}>{title}</h3>
                {subtitle && <p className={styles.card__subtitle}>{subtitle}</p>}
            </div>
            {action}
        </div>
    );
}

export function CardBody({ isCompact = false, children }: CardBodyProps) {
    const classNames = [
        styles.card__body,
        isCompact && styles['card__body--compact'],
    ]
        .filter(Boolean)
        .join(' ');

    return <div className={classNames}>{children}</div>;
}

export function CardFooter({ children }: CardFooterProps) {
    return <div className={styles.card__footer}>{children}</div>;
}
