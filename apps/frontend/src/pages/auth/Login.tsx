import { Form, Button, Alert, Card, Spinner } from 'react-bootstrap';
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@hooks/useAuth';
import { useToastManager } from '@components/ui/Toast';
import { Leaf, Eye, EyeOff, Loader2 } from 'lucide-react';

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading: authLoading } = useAuth();
  const { danger, warning } = useToastManager();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const from = (location.state as { from?: Location })?.from?.pathname || '/dashboard';

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!username.trim()) newErrors.username = 'Nome de usuário é obrigatório';
    if (!password) newErrors.password = 'Senha é obrigatória';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await login({ identifier: username, password });
      navigate(from, { replace: true });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao fazer login';
      if (message.includes('Credenciais inválidas') || message.includes('401')) {
        setErrors({ password: 'Nome de usuário ou senha incorretos' });
        danger('Erro', 'Nome de usuário ou senha incorretos');
      } else {
        danger('Erro', message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light px-3" style={{ background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)' }}>
      <div className="w-100" style={{ maxWidth: '420px' }}>
        <div className="text-center mb-4">
          <div className="d-inline-flex align-items-center justify-content-center bg-primary rounded-3 p-3 mb-3" style={{ width: '80px', height: '80px' }}>
            <Leaf className="text-white" size={36} aria-hidden="true" />
          </div>
          <h1 className="h3 fw-bold text-dark mb-1">Sistema de Estoque</h1>
          <p className="text-muted">Entre para acessar sua conta</p>
        </div>

        <Card className="shadow-sm border-0 rounded-4">
          <Card.Body className="p-4 p-md-5">
            <Form onSubmit={handleSubmit} noValidate>
              <div className="mb-3">
                <Form.Label className="fw-medium">Nome de usuário ou E-mail</Form.Label>
                <div className="position-relative">
                  <input
                    type="text"
                    className={`form-control form-control-lg ${errors.username ? 'is-invalid' : ''}`}
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      if (errors.username) setErrors((prev) => ({ ...prev, username: '' }));
                    }}
                    placeholder="Digite seu nome de usuário"
                    autoComplete="username"
                    autoFocus
                    disabled={isSubmitting || authLoading}
                    aria-invalid={errors.username ? 'true' : 'false'}
                    aria-describedby={errors.username ? 'username-error' : undefined}
                  />
                  {errors.username && (
                    <div id="username-error" className="invalid-feedback d-block" role="alert">
                      {errors.username}
                    </div>
                  )}
                </div>
              </div>

              <div className="mb-3">
                <Form.Label className="fw-medium">Senha</Form.Label>
                <div className="position-relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className={`form-control form-control-lg ${errors.password ? 'is-invalid' : ''}`}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) setErrors((prev) => ({ ...prev, password: '' }));
                    }}
                    placeholder="Digite sua senha"
                    autoComplete="current-password"
                    disabled={isSubmitting || authLoading}
                    aria-invalid={errors.password ? 'true' : 'false'}
                    aria-describedby={errors.password ? 'password-error' : undefined}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(e); }}
                  />
                  <button
                    type="button"
                    className="position-absolute end-0 top-50 translate-middle-y me-3 text-muted border-0 bg-transparent p-0"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    aria-pressed={showPassword}
                    disabled={isSubmitting || authLoading}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                  {errors.password && (
                    <div id="password-error" className="invalid-feedback d-block" role="alert">
                      {errors.password}
                    </div>
                  )}
                </div>
              </div>

              <div className="mb-4 d-flex align-items-center justify-content-between">
                <div className="form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="remember"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    disabled={isSubmitting || authLoading}
                  />
                  <label className="form-check-label small text-muted" htmlFor="remember">Lembrar-me</label>
                </div>
                <a href="/forgot-password" className="small text-decoration-none">Esqueci a senha</a>
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
                    Entrando...
                  </>
                ) : (
                  'Entrar'
                )}
              </Button>
            </Form>

            <div className="mt-4 text-center">
              <p className="text-muted small mb-0">
                Não tem conta?{' '}
                <a href="/register" className="fw-medium text-decoration-none">Registrar</a>
              </p>
            </div>
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

export default Login;