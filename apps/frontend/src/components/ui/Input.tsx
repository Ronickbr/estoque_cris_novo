import { Form, InputGroup } from 'react-bootstrap';
import { cn } from '@utils';
import { forwardRef, InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes } from 'react';

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  help?: string;
  floating?: boolean;
  size?: 'sm' | 'md' | 'lg';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      help,
      floating = true,
      size = 'md',
      leftIcon,
      rightIcon,
      fullWidth = true,
      className,
      id,
      type = 'text',
      disabled,
      readOnly,
      required,
      ...props
    },
    ref
  ) => {
    const inputId = id || `input-${generateId()}`;
    const errorId = `${inputId}-error`;
    const helpId = `${inputId}-help`;
    const describedBy = [error && errorId, help && helpId].filter(Boolean).join(' ') || undefined;

    const sizeClasses = {
      sm: 'form-control-sm py-1 px-2',
      md: '',
      lg: 'form-control-lg py-2 px-3',
    };

    return (
      <div className={cn('form-field', `form-field--${size}`, error && 'form-field--error', disabled && 'form-field--disabled', readOnly && 'form-field--readonly', fullWidth && 'w-100')}>
        {floating && label && (
          <label htmlFor={inputId} className="form-label">
            {label}
            {required && <span className="text-danger ms-1" aria-hidden="true">*</span>}
          </label>
        )}
        <div className="position-relative">
          {leftIcon && (
            <span className="position-absolute start-0 top-50 translate-middle-y ps-3 text-secondary" aria-hidden="true">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            type={type}
            className={cn(
              'form-control',
              sizeClasses[size],
              leftIcon && 'ps-5',
              rightIcon && 'pe-5',
              error && 'is-invalid',
              className
            )}
            disabled={disabled}
            readOnly={readOnly}
            required={required}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={describedBy}
            aria-required={required ? 'true' : 'false'}
            {...props}
          />
          {rightIcon && (
            <span className="position-absolute end-0 top-50 translate-middle-y pe-3 text-secondary" aria-hidden="true">
              {rightIcon}
            </span>
          )}
        </div>
        {!floating && label && (
          <label htmlFor={inputId} className="form-label mt-2">
            {label}
            {required && <span className="text-danger ms-1" aria-hidden="true">*</span>}
          </label>
        )}
        {error && (
          <div id={errorId} className="form-error" role="alert" aria-live="polite">
            <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm-3.5-6.5a.5.5 0 0 1-1 0V5.707L5.354 7.854a.5.5 0 1 1-.708-.708l3-3a.5.5 0 0 1 .708 0l3 3a.5.5 0 1 1-.708.708L8.5 5.707V9.5a.5.5 0 0 1-1 0V5.707L5.354 7.854a.5.5 0 1 1-.708-.708l3-3a.5.5 0 0 1 .708 0l3 3a.5.5 0 1 1-.708.708L8.5 5.707V9.5a.5.5 0 0 1-1 0V5.707z" />
            </svg>
            {error}
          </div>
        )}
        {help && !error && (
          <div id={helpId} className="form-help">
            {help}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

interface TextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'> {
  label?: string;
  error?: string;
  help?: string;
  floating?: boolean;
  size?: 'sm' | 'md' | 'lg';
  rows?: number;
  fullWidth?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      error,
      help,
      floating = true,
      size = 'md',
      rows = 3,
      fullWidth = true,
      className,
      id,
      disabled,
      readOnly,
      required,
      ...props
    },
    ref
  ) => {
    const inputId = id || `textarea-${generateId()}`;
    const errorId = `${inputId}-error`;
    const helpId = `${inputId}-help`;
    const describedBy = [error && errorId, help && helpId].filter(Boolean).join(' ') || undefined;

    const sizeClasses = {
      sm: 'form-control-sm py-1 px-2',
      md: '',
      lg: 'form-control-lg py-2 px-3',
    };

    return (
      <div className={cn('form-field', `form-field--${size}`, error && 'form-field--error', disabled && 'form-field--disabled', readOnly && 'form-field--readonly', fullWidth && 'w-100')}>
        {floating && label && (
          <label htmlFor={inputId} className="form-label">
            {label}
            {required && <span className="text-danger ms-1" aria-hidden="true">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={cn('form-control', sizeClasses[size], error && 'is-invalid', className)}
          rows={rows}
          disabled={disabled}
          readOnly={readOnly}
          required={required}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={describedBy}
          aria-required={required ? 'true' : 'false'}
          {...props}
        />
        {!floating && label && (
          <label htmlFor={inputId} className="form-label mt-2">
            {label}
            {required && <span className="text-danger ms-1" aria-hidden="true">*</span>}
          </label>
        )}
        {error && (
          <div id={errorId} className="form-error" role="alert" aria-live="polite">
            <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm-3.5-6.5a.5.5 0 0 1-1 0V5.707L5.354 7.854a.5.5 0 1 1-.708-.708l3-3a.5.5 0 0 1 .708 0l3 3a.5.5 0 1 1-.708.708L8.5 5.707V9.5a.5.5 0 0 1-1 0V5.707L5.354 7.854a.5.5 0 1 1-.708.708l3-3a.5.5 0 0 1 .708 0l3 3a.5.5 0 1 1-.708.708L8.5 5.707V9.5a.5.5 0 0 1-1 0V5.707z" />
            </svg>
            {error}
          </div>
        )}
        {help && !error && (
          <div id={helpId} className="form-help">
            {help}
          </div>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string;
  error?: string;
  help?: string;
  floating?: boolean;
  size?: 'sm' | 'md' | 'lg';
  options: { value: string | number; label: string; disabled?: boolean }[];
  placeholder?: string;
  fullWidth?: boolean;
  multiple?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      help,
      floating = true,
      size = 'md',
      options,
      placeholder,
      fullWidth = true,
      multiple,
      className,
      id,
      disabled,
      required,
      ...props
    },
    ref
  ) => {
    const selectId = id || `select-${generateId()}`;
    const errorId = `${selectId}-error`;
    const helpId = `${selectId}-help`;
    const describedBy = [error && errorId, help && helpId].filter(Boolean).join(' ') || undefined;

    const sizeClasses = {
      sm: 'form-select-sm py-1 px-2',
      md: '',
      lg: 'form-select-lg py-2 px-3',
    };

    return (
      <div className={cn('form-field', `form-field--${size}`, error && 'form-field--error', disabled && 'form-field--disabled', fullWidth && 'w-100')}>
        {floating && label && (
          <label htmlFor={selectId} className="form-label">
            {label}
            {required && <span className="text-danger ms-1" aria-hidden="true">*</span>}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={cn('form-select', sizeClasses[size], error && 'is-invalid', className)}
          disabled={disabled}
          required={required}
          multiple={multiple}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={describedBy}
          aria-required={required ? 'true' : 'false'}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>
        {!floating && label && (
          <label htmlFor={selectId} className="form-label mt-2">
            {label}
            {required && <span className="text-danger ms-1" aria-hidden="true">*</span>}
          </label>
        )}
        {error && (
          <div id={errorId} className="form-error" role="alert" aria-live="polite">
            <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm-3.5-6.5a.5.5 0 0 1-1 0V5.707L5.354 7.854a.5.5 0 1 1-.708-.708l3-3a.5.5 0 0 1 .708 0l3 3a.5.5 0 1 1-.708.708L8.5 5.707V9.5a.5.5 0 0 1-1 0V5.707L5.354 7.854a.5.5 0 1 1-.708.708l3-3a.5.5 0 0 1 .708 0l3 3a.5.5 0 1 1-.708.708L8.5 5.707V9.5a.5.5 0 0 1-1 0V5.707z" />
            </svg>
            {error}
          </div>
        )}
        {help && !error && (
          <div id={helpId} className="form-help">
            {help}
          </div>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

function generateId(): string {
  return Math.random().toString(36).slice(2, 9);
}

export default Input;