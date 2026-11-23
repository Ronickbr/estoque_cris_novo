import { Form, Button, Alert, Card } from 'react-bootstrap';
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@hooks/useAuth';
import { useToastManager } from '@components/ui/Toast';
import { Leaf, Loader2, Mail, ArrowLeft, CheckCircle } from 'lucide-react';

export function ForgotPassword() {
  const navigate = useNavigate();
  const { forgotPassword, resetPassword, isLoading: authLoading } = useAuth();
  const { success, danger, info } = useToastManager();

  const [step, setStep] = useState<'request' | 'reset' | 'success'>('request');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [email, setEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateRequest = () => {
    const newErrors: Record<string, string> = {};
    if (!email.trim()) newErrors.email = 'E-mail é obrigatório';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'E-mail inválido';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateReset = () => {
    const newErrors: Record<string, string> = {};
    if (!resetToken.trim()) newErrors.resetToken = 'Token é obrigatório';
    if (!newPassword) newErrors.newPassword = 'Nova senha é obrigatória';
    else if (newPassword.length < 8) newErrors.newPassword = 'Senha deve ter pelo menos 8 caracteres';
    else if (!/[A-Z]/.test(newPassword)) newErrors.newPassword = 'Senha deve conter pelo menos uma letra maiúscula';
    else if (!/[a-z]/.test(newPassword)) newErrors.newPassword = 'Senha deve conter pelo menos uma letra minúscula';
    else if (!/[0-9]/.test(newPassword)) newErrors.newPassword = 'Senha deve conter pelo menos um número';
    else if (!/[^A-Za-z0-9]/.test(newPassword)) newErrors.newPassword = 'Senha deve conter pelo menos um símbolo';
    if (newPassword !== confirmPassword) newErrors.confirmPassword = 'As senhas não coincidem';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateRequest()) return;

    setIsSubmitting(true);
    try {
      await forgotPassword(email.trim().toLowerCase());
      info('E-mail enviado', 'Verifique sua caixa de entrada para redefinir a senha');
      setStep('reset');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao solicitar redefinição';
      danger('Erro', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateReset()) return;

    setIsSubmitting(true);
    try {
      await resetPassword({ token: resetToken.trim(), novaSenha: newPassword, confirmarNovaSenha: newPassword });
      success('Senha alterada!', 'Sua senha foi redefinida com sucesso');
      setStep('success');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao redefinir senha';
      if (message.includes('Token inválido') || message.includes('expirado')) {
        setErrors({ resetToken: 'Token inválido ou expirado. Solicite um novo e-mail.' });
        danger('Erro', 'Token inválido ou expirado');
      } else {
        danger('Erro', message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackToLogin = () => {
    navigate('/login', { replace: true });
  };

  if (step === 'success') {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light px-3" style={{ background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)' }}>
        <div className="w-100" style={{ maxWidth: '420px' }}>
          <Card className="shadow-sm border-0 rounded-4">
            <Card.Body className="p-4 p-md-5 text-center">
              <div className="d-inline-flex align-items-center justify-content-center bg-success rounded-circle mb-3" style={{ width: '80px', height: '80px' }}>
                <CheckCircle className="text-white" size={40} aria-hidden="true" />
              </div>
              <h1 className="h3 fw-bold text-dark mb-2">Senha Redefinida!</h1>
              <p className="text-muted mb-4">Sua senha foi alterada com sucesso. Agora você pode fazer login com a nova senha.</p>
              <Button variant="primary" size="lg" onClick={handleBackToLogin} className="w-100 fw-medium rounded-3 py-3">
                <ArrowLeft size={16} className="me-1" aria-hidden="true" />
                Voltar para Login
              </Button>
            </Card.Body>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light px-3" style={{ background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)' }}>
      <div className="w-100" style={{ maxWidth: '420px' }}>
        <div className="text-center mb-4">
          <div className="d-inline-flex align-items-center justify-content-center bg-primary rounded-3 p-3 mb-3" style={{ width: '80px', height: '80px' }}>
            <Leaf className="text-white" size={36} aria-hidden="true" />
          </div>
          <h1 className="h3 fw-bold text-dark mb-1">
            {step === 'request' ? 'Esqueci a Senha' : 'Redefinir Senha'}
          </h1>
          <p className="text-muted">
            {step === 'request'
              ? 'Digite seu e-mail para receber instruções de redefinição'
              : 'Digite o token recebido por e-mail e a nova senha'}
          </p>
        </div>

        <Card className="shadow-sm border-0 rounded-4">
          <Card.Body className="p-4 p-md-5">
            <Form onSubmit={step === 'request' ? handleRequestSubmit : handleResetSubmit} noValidate>
              {step === 'request' && (
                <>
                  <div className="mb-4">
                    <Form.Label className="fw-medium">E-mail</Form.Label>
                    <div className="position-relative">
                      <Mail className="position-absolute start-0 top-50 translate-middle-y text-muted ps-3" size={18} aria-hidden="true" />
                      <input
                        type="email"
                        className={`form-control form-control-lg ps-5 ${errors.email ? 'is-invalid' : ''}`}
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors((p) => ({ ...p, email: '' })); }}
                        placeholder="seu@email.com"
                        autoComplete="email"
                        autoFocus
                        disabled={isSubmitting || authLoading}
                        aria-invalid={errors.email ? 'true' : 'false'}
                        aria-describedby={errors.email ? 'email-error' : undefined}
                      />
                      {errors.email && (
                        <div id="email-error" className="invalid-feedback d-block" role="alert">
                          {errors.email}
                        </div>
                      )}
                    </div>
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    className="w-100 fw-medium rounded-3 py-3"
                    disabled={isSubmitting || authLoading}
                  >
                    {isSubmitting || authLoading ? (
                      <>
                        <Loader2 className="me-2 animate-spin" size={20} aria-hidden="true" />
                        Enviando...
                      </>
                    ) : (
                      'Enviar Instruções'
                    )}
                  </Button>
                </>
              )}

              {step === 'reset' && (
                <>
                  <Alert variant="info" className="mb-4">
                    Verifique seu e-mail e digite o token de 6 dígitos recebido.
                  </Alert>

                  <div className="mb-3">
                    <Form.Label className="fw-medium">Token de Redefinição</Form.Label>
                    <input
                      type="text"
                      className={`form-control form-control-lg ${errors.resetToken ? 'is-invalid' : ''}`}
                      value={resetToken}
                      onChange={(e) => { setResetToken(e.target.value); if (errors.resetToken) setErrors((p) => ({ ...p, resetToken: '' })); }}
                      placeholder="000000"
                      autoComplete="one-time-code"
                      maxLength={6}
                      disabled={isSubmitting || authLoading}
                      aria-invalid={errors.resetToken ? 'true' : 'false'}
                      aria-describedby={errors.resetToken ? 'token-error' : undefined}
                    />
                    {errors.resetToken && (
                      <div id="token-error" className="invalid-feedback d-block" role="alert">
                        {errors.resetToken}
                      </div>
                    )}
                  </div>

                  <div className="mb-3">
                    <Form.Label className="fw-medium">Nova Senha</Form.Label>
                    <input
                      type="password"
                      className={`form-control form-control-lg ${errors.newPassword ? 'is-invalid' : ''}`}
                      value={newPassword}
                      onChange={(e) => { setNewPassword(e.target.value); if (errors.newPassword) setErrors((p) => ({ ...p, newPassword: '' })); }}
                      placeholder="Crie uma senha forte"
                      autoComplete="new-password"
                      disabled={isSubmitting || authLoading}
                      aria-invalid={errors.newPassword ? 'true' : 'false'}
                      aria-describedby={errors.newPassword ? 'new-password-error' : 'password-hint'}
                    />
                    {errors.newPassword && (
                      <div id="new-password-error" className="invalid-feedback d-block" role="alert">
                        {errors.newPassword}
                      </div>
                    )}
                    <div id="password-hint" className="form-text">
                      Mínimo 8 caracteres, com maiúscula, minúscula, número e símbolo
                    </div>
                  </div>

                  <div className="mb-4">
                    <Form.Label className="fw-medium">Confirmar Nova Senha</Form.Label>
                    <input
                      type="password"
                      className={`form-control form-control-lg ${errors.confirmPassword ? 'is-invalid' : ''}`}
                      value={confirmPassword}
                      onChange={(e) => { setConfirmPassword(e.target.value); if (errors.confirmPassword) setErrors((p) => ({ ...p, confirmPassword: '' })); }}
                      placeholder="Confirme a nova senha"
                      autoComplete="new-password"
                      disabled={isSubmitting || authLoading}
                      aria-invalid={errors.confirmPassword ? 'true' : 'false'}
                      aria-describedby={errors.confirmPassword ? 'confirm-error' : undefined}
                    />
                    {errors.confirmPassword && (
                      <div id="confirm-error" className="invalid-feedback d-block" role="alert">
                        {errors.confirmPassword}
                      </div>
                    )}
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    className="w-100 fw-medium rounded-3 py-3"
                    disabled={isSubmitting || authLoading}
                  >
                    {isSubmitting || authLoading ? (
                      <>
                        <Loader2 className="me-2 animate-spin" size={20} aria-hidden="true" />
                        Redefinindo...
                      </>
                    ) : (
                      'Redefinir Senha'
                    )}
                  </Button>
                </>
              )}

              <div className="mt-3 text-center">
                <Link to="/login" className="text-decoration-none" onClick={handleBackToLogin}>
                  <ArrowLeft size={16} className="me-1" aria-hidden="true" />
                  Voltar para Login
                </Link>
              </div>
            </Form>
          </Card.Body>
        </Card>

        <div className="mt-4 text-center">
          <p className="text-muted small">
            Estoque Cris &copy; {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;