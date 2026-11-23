import { Toast as BsToast, ToastContainer } from 'react-bootstrap';
import { useState, useCallback, ReactNode } from 'react';
import { cn } from '@utils';

export type ToastType = 'success' | 'danger' | 'warning' | 'info';

interface ToastOptions {
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  dismissible?: boolean;
  onClose?: () => void;
}

const TOAST_ICONS: Record<ToastType, string> = {
  success: 'check-circle-fill',
  danger: 'exclamation-triangle-fill',
  warning: 'exclamation-triangle-fill',
  info: 'info-circle-fill',
};

const TOAST_LABELS: Record<ToastType, string> = {
  success: 'Sucesso',
  danger: 'Erro',
  warning: 'Atenção',
  info: 'Informação',
};

const TOAST_COLORS: Record<ToastType, string> = {
  success: 'success',
  danger: 'danger',
  warning: 'warning',
  info: 'info',
};

export function useToastManager() {
  const [toasts, setToasts] = useState<Array<ToastOptions & { id: string }>>([]);

  const show = useCallback((options: ToastOptions) => {
    const id = Math.random().toString(36).slice(2, 9);
    const toast = { ...options, id, duration: options.duration ?? 5000 };
    
    setToasts((prev) => {
      const updated = [...prev, toast];
      if (updated.length > 5) {
        return updated.slice(-5);
      }
      return updated;
    });

    if (toast.duration > 0) {
      setTimeout(() => {
        hide(id);
      }, toast.duration);
    }

    return id;
  }, []);

  const hide = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const hideAll = useCallback(() => {
    setToasts([]);
  }, []);

  const success = useCallback((title: string, message?: string, options?: Partial<ToastOptions>) => {
    return show({ type: 'success', title, message, ...options });
  }, [show]);

  const danger = useCallback((title: string, message?: string, options?: Partial<ToastOptions>) => {
    return show({ type: 'danger', title, message, ...options });
  }, [show]);

  const warning = useCallback((title: string, message?: string, options?: Partial<ToastOptions>) => {
    return show({ type: 'warning', title, message, ...options });
  }, [show]);

  const info = useCallback((title: string, message?: string, options?: Partial<ToastOptions>) => {
    return show({ type: 'info', title, message, ...options });
  }, [show]);

  return {
    toasts,
    show,
    hide,
    hideAll,
    success,
    danger,
    warning,
    info,
  };
}

interface ToastProps {
  toast: ToastOptions & { id: string };
  onClose: (id: string) => void;
}

export function Toast({ toast, onClose }: ToastProps) {
  const { type, title, message, dismissible = true } = toast;
  const color = TOAST_COLORS[type];
  const icon = TOAST_ICONS[type];
  const label = TOAST_LABELS[type];
  const duration = toast.duration ?? 5000;
  const showProgress = duration > 0;

  return (
    <BsToast
      show={true}
      onClose={() => onClose(toast.id)}
      delay={duration}
      autohide={showProgress}
      className={cn('toast', `toast--${type}`, 'border-0', 'shadow-lg', 'rounded-3')}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      <BsToast.Header className={cn('bg-transparent', `border-${color}`, 'border-start', 'border-3', 'rounded-start-3', 'px-3', 'py-2')}>
        <i className={cn(`bi bi-${icon}`, `text-${color}`, 'me-2', 'fs-5')} aria-hidden="true" />
        <strong className="me-auto">{title}</strong>
        {dismissible && (
          <button
            type="button"
            className="btn-close btn-close-white"
            aria-label="Fechar notificação"
            onClick={() => onClose(toast.id)}
          />
        )}
      </BsToast.Header>
      {message && (
        <BsToast.Body className="px-3 pb-3 pt-0">
          {message}
        </BsToast.Body>
      )}
      {showProgress && (
        <div className="toast-progress" role="progressbar" aria-valuenow={100} aria-valuemin={0} aria-valuemax={100} />
      )}
    </BsToast>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const { toasts, hide } = useToastManager();

  return (
    <>
      {children}
      <ToastContainer
        position="top-end"
        className="toast-container-custom z-1080"
      >
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onClose={hide} />
        ))}
      </ToastContainer>
    </>
  );
}

export default useToastManager;