import { Button as BsButton, ButtonProps } from 'react-bootstrap';
import { cn } from '@utils';
import { forwardRef, ReactNode } from 'react';

interface CustomButtonProps extends Omit<ButtonProps, 'variant' | 'size'> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'dark' | 'light' | 'outline-primary' | 'outline-secondary' | 'outline-success' | 'outline-danger' | 'outline-warning' | 'outline-info' | 'outline-dark' | 'outline-light' | 'ghost' | 'link';
  size?: 'sm' | 'lg';
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, CustomButtonProps>(
  (
    {
      variant = 'primary',
      size,
      loading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      children,
      className,
      ...props
    },
    ref
  ) => {
    const isOutline = variant.startsWith('outline-');
    const isGhost = variant === 'ghost';
    const isLink = variant === 'link';
    const bsVariant = isOutline
      ? variant.replace('outline-', '') as ButtonProps['variant']
      : isGhost || isLink
      ? 'light'
      : variant;

    return (
      <BsButton
        ref={ref}
        variant={bsVariant}
        size={size}
        disabled={disabled || loading}
        className={cn(
          'fw-medium',
          'rounded-3',
          'transition-all',
          'duration-150',
          fullWidth && 'w-100',
          isGhost && 'bg-transparent border-0 shadow-none text-primary hover:bg-primary-100',
          isLink && 'bg-transparent border-0 shadow-none p-0 text-decoration-none',
          loading && 'cursor-wait',
          className
        )}
        {...props}
      >
        {loading ? (
          <span className="d-inline-flex align-items-center gap-2">
            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
            <span>Carregando...</span>
          </span>
        ) : (
          <>
            {leftIcon && <span className="me-1" aria-hidden="true">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="ms-1" aria-hidden="true">{rightIcon}</span>}
          </>
        )}
      </BsButton>
    );
  }
);

Button.displayName = 'Button';

export default Button;