import { Modal as BsModal, Button } from 'react-bootstrap';
import { useEffect, useRef, ReactNode } from 'react';
import { cn } from '@utils';

interface ModalProps {
  show: boolean;
  onHide: (confirmed: boolean) => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'lg' | 'xl';
  centered?: boolean;
  scrollable?: boolean;
  closable?: boolean;
  backdrop?: true | 'static';
  keyboard?: boolean;
  footer?: ReactNode;
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info';
  loading?: boolean;
}

export function Modal({
  show,
  onHide,
  title,
  children,
  size = 'lg',
  centered = false,
  scrollable = false,
  closable = true,
  backdrop = true,
  keyboard = true,
  footer,
  onConfirm,
  onCancel,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  confirmVariant = 'primary',
  loading = false,
}: ModalProps) {
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (show) {
      previousActiveElement.current = document.activeElement as HTMLElement;
      document.body.style.overflow = 'hidden';
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    } else {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
      previousActiveElement.current?.focus();
    }

    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [show]);

  const handleConfirm = () => {
    onConfirm?.();
    onHide(true);
  };

  const handleCancel = () => {
    onCancel?.();
    onHide(false);
  };

  const defaultFooter = (
    <>
      {closable && (
        <Button variant="secondary" onClick={handleCancel} disabled={loading}>
          {cancelText}
        </Button>
      )}
      <Button variant={confirmVariant} onClick={handleConfirm} disabled={loading}>
        {loading ? (
          <>
            <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true" />
            Salvando...
          </>
        ) : (
          confirmText
        )}
      </Button>
    </>
  );

  return (
    <BsModal
      show={show}
      onHide={handleCancel}
      size={size}
      centered={centered}
      scrollable={scrollable}
      backdrop={backdrop}
      keyboard={keyboard}
      dialogClassName={cn('modal-dialog-centered', centered && 'modal-dialog-centered')}
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      <BsModal.Header closeButton={closable}>
        {title && <BsModal.Title id="modal-title">{title}</BsModal.Title>}
      </BsModal.Header>
      <BsModal.Body>{children}</BsModal.Body>
      {footer !== undefined ? (
        <BsModal.Footer>{footer}</BsModal.Footer>
      ) : (
        <BsModal.Footer>{defaultFooter}</BsModal.Footer>
      )}
    </BsModal>
  );
}

export interface ConfirmModalProps {
  show: boolean;
  onHide: (confirmed: boolean) => void;
  title?: string;
  message: string;
  type?: 'danger' | 'warning' | 'info' | 'success';
  confirmText?: string;
  cancelText?: string;
  size?: 'sm' | 'lg';
  loading?: boolean;
}

export function ConfirmModal({
  show,
  onHide,
  title = 'Confirmar',
  message,
  type = 'danger',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  size = 'sm',
  loading = false,
}: ConfirmModalProps) {
  const icons = {
    danger: 'exclamation-triangle-fill',
    warning: 'exclamation-circle-fill',
    info: 'info-circle-fill',
    success: 'check-circle-fill',
  };

  const colors: Record<'danger' | 'warning' | 'info' | 'success', 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info'> = {
    danger: 'danger',
    warning: 'warning',
    info: 'info',
    success: 'success',
  };

  return (
    <Modal
      show={show}
      onHide={onHide}
      title={title}
      size={size}
      centered
      confirmText={confirmText}
      cancelText={cancelText}
      confirmVariant={colors[type]}
      loading={loading}
    >
      <div className="confirm-modal text-center">
        <div className={`confirm-modal__icon confirm-modal__icon--${type} mb-3 mx-auto`}>
          <i className={`bi bi-${icons[type]} display-4`} aria-hidden="true" />
        </div>
        <h6 className="confirm-modal__title">{title}</h6>
        <p className="confirm-modal__message">{message}</p>
      </div>
    </Modal>
  );
}

export interface FormModalProps {
  show: boolean;
  onHide: (confirmed: boolean) => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'lg' | 'xl';
  submitText?: string;
  cancelText?: string;
  loading?: boolean;
}

export function FormModal({
  show,
  onHide,
  title,
  children,
  size = 'lg',
  submitText = 'Salvar',
  cancelText = 'Cancelar',
  loading = false,
}: FormModalProps) {
  return (
    <Modal
      show={show}
      onHide={onHide}
      title={title}
      size={size}
      confirmText={submitText}
      cancelText={cancelText}
      loading={loading}
    >
      {children}
    </Modal>
  );
}

export default Modal;