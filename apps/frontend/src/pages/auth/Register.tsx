import { Form, Button, Alert, Card } from 'react-bootstrap';
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@hooks/useAuth';
import { useToastManager } from '@components/ui/Toast';
import { Leaf, Eye, EyeOff, Loader2, User, Mail, Lock, Shield } from 'lucide-react';
import { UserRole } from '@types';

export function Register() {
  const navigate = useNavigate();
  const { register, isLoading: authLoading } = useAuth();
  const { danger, success } = useToastManager();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    confirmPassword: '',
    acceptTerms: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.nome.trim()) newErrors.nome = 'Nome completo é obrigatório';
    else if (formData.nome.trim().length < 3) newErrors.nome = 'Nome deve ter pelo menos 3 caracteres';

    if (!formData.email.trim()) newErrors.email = 'E-mail é obrigatório';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'E-mail inválido';

    if (!formData.senha) newErrors.senha = 'Senha é obrigatória';
    else if (formData.senha.length < 8) newErrors.senha = 'Senha deve ter pelo menos 8 caracteres';
    else if (!/[A-Z]/.test(formData.senha)) newErrors.senha = 'Senha deve conter pelo menos uma letra maiúscula';
    else if (!/[a-z]/.test(formData.senha)) newErrors.senha = 'Senha deve conter pelo menos uma letra minúscula';
    else if (!/[0-9]/.test(formData.senha)) newErrors.senha = 'Senha deve conter pelo menos um número';
    else if (!/[^A-Za-z0-9]/.test(formData.senha)) newErrors.senha = 'Senha deve conter pelo menos um símbolo';

    if (formData.senha !== formData.confirmPassword) newErrors.confirmPassword = 'As senhas não coincidem';

    if (!formData.acceptTerms) newErrors.acceptTerms = 'Você deve aceitar os termos de uso';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await register({
        nome: formData.nome.trim(),
        email: formData.email.trim().toLowerCase(),
        senha: formData.senha,
        nivel: UserRole.OPERATOR,
      });
      success('Conta criada!', 'Bem-vindo ao Sistema de Estoque');
      navigate('/dashboard', { replace: true });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao criar conta';
      if (message.includes('E-mail já cadastrado') || message.includes('409')) {
        setErrors({ email: 'Este e-mail já está cadastrado' });
        danger('Erro', 'Este e-mail já está cadastrado');
      } else {
        danger('Erro', message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const passwordStrength = getPasswordStrength(formData.senha);

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light px-3" style={{ background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)' }}>
      <div className="w-100" style={{ maxWidth: '480px' }}>
        <div className="text-center mb-4">
          <div className="d-inline-flex align-items-center justify-content-center bg-primary rounded-3 p-3 mb-3" style={{ width: '80px', height: '80px' }}>
            <Leaf className="text-white" size={36} aria-hidden="true" />
          </div>
          <h1 className="h3 fw-bold text-dark mb-1">Criar Conta</h1>
          <p className="text-muted">Cadastre-se para acessar o Sistema de Estoque</p>
        </div>

        <Card className="shadow-sm border-0 rounded-4">
          <Card.Body className="p-4 p-md-5">
            <Form onSubmit={handleSubmit} noValidate>
              <div className="mb-3">
                <Form.Label className="fw-medium">Nome Completo</Form.Label>
                <div className="position-relative">
                  <User className="position-absolute start-0 top-50 translate-middle-y text-muted ps-3" size={18} aria-hidden="true" />
                  <input
                    type="text"
                    className={`form-control form-control-lg ps-5 ${errors.name ? 'is-invalid' : ''}`}
                    value={formData.nome}
                    onChange={(e) => handleChange('nome', e.target.value)}
                    placeholder="Seu nome completo"
                    autoComplete="name"
                    autoFocus
                    disabled={isSubmitting || authLoading}
                    aria-invalid={errors.name ? 'true' : 'false'}
                    aria-describedby={errors.name ? 'name-error' : undefined}
                  />
                  {errors.nome && (
                    <div id="name-error" className="invalid-feedback d-block" role="alert">
                      {errors.nome}
                    </div>
                  )}
                </div>
              </div>

              <div className="mb-3">
                <Form.Label className="fw-medium">E-mail</Form.Label>
                <div className="position-relative">
                  <Mail className="position-absolute start-0 top-50 translate-middle-y text-muted ps-3" size={18} aria-hidden="true" />
                  <input
                    type="email"
                    className={`form-control form-control-lg ps-5 ${errors.email ? 'is-invalid' : ''}`}
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="seu@email.com"
                    autoComplete="email"
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

              <div className="mb-3">
                <Form.Label className="fw-medium">Senha</Form.Label>
                <div className="position-relative">
                  <Lock className="position-absolute start-0 top-50 translate-middle-y text-muted ps-3" size={18} aria-hidden="true" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className={`form-control form-control-lg ps-5 ${errors.password ? 'is-invalid' : ''}`}
                    value={formData.senha}
                    onChange={(e) => handleChange('senha', e.target.value)}
                    placeholder="Crie uma senha forte"
                    autoComplete="new-password"
                    disabled={isSubmitting || authLoading}
                    aria-invalid={errors.password ? 'true' : 'false'}
                    aria-describedby={errors.password ? 'password-error' : 'password-hint'}
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
                  {errors.senha && (
                    <div id="password-error" className="invalid-feedback d-block" role="alert">
                      {errors.senha}
                    </div>
                  )}
                  <div id="password-hint" className="form-text">
                    <div className="d-flex gap-1 mb-1" role="progressbar" aria-valuenow={passwordStrength.score} aria-valuemin={0} aria-valuemax={4} aria-label="Força da senha">
                      {[0, 1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="flex-1 h-4 rounded"
                          style={{
                            backgroundColor: i < passwordStrength.score ? passwordStrength.color : '#e9ecef',
                            transition: 'background-color 0.3s',
                          }}
                        />
                      ))}
                    </div>
                    <small className="text-muted">{passwordStrength.label}</small>
                  </div>
                </div>
              </div>

              <div className="mb-3">
                <Form.Label className="fw-medium">Confirmar Senha</Form.Label>
                <div className="position-relative">
                  <Shield className="position-absolute start-0 top-50 translate-middle-y text-muted ps-3" size={18} aria-hidden="true" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    className={`form-control form-control-lg ps-5 ${errors.confirmPassword ? 'is-invalid' : ''}`}
                    value={formData.confirmPassword}
                    onChange={(e) => handleChange('confirmPassword', e.target.value)}
                    placeholder="Confirme sua senha"
                    autoComplete="new-password"
                    disabled={isSubmitting || authLoading}
                    aria-invalid={errors.confirmPassword ? 'true' : 'false'}
                    aria-describedby={errors.confirmPassword ? 'confirm-error' : undefined}
                  />
                  <button
                    type="button"
                    className="position-absolute end-0 top-50 translate-middle-y me-3 text-muted border-0 bg-transparent p-0"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    aria-pressed={showConfirmPassword}
                    disabled={isSubmitting || authLoading}
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                  {errors.confirmPassword && (
                    <div id="confirm-error" className="invalid-feedback d-block" role="alert">
                      {errors.confirmPassword}
                    </div>
                  )}
                </div>
              </div>

              <div className="mb-4">
                <div className="form-check">
                  <input
                    type="checkbox"
                    className={`form-check-input ${errors.acceptTerms ? 'is-invalid' : ''}`}
                    id="acceptTerms"
                    checked={formData.acceptTerms}
                    onChange={(e) => handleChange('acceptTerms', e.target.checked)}
                    disabled={isSubmitting || authLoading}
                    aria-invalid={errors.acceptTerms ? 'true' : 'false'}
                  />
                  <label className="form-check-label small" htmlFor="acceptTerms">
                    Aceito os <a href="/terms" className="text-decoration-none">Termos de Uso</a> e a <a href="/privacy" className="text-decoration-none">Política de Privacidade</a>
                  </label>
                  {errors.acceptTerms && (
                    <div className="invalid-feedback d-block">{errors.acceptTerms}</div>
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
                    Criando conta...
                  </>
                ) : (
                  'Criar Conta'
                )}
              </Button>
            </Form>

            <div className="mt-4 text-center">
              <p className="text-muted small mb-0">
                Já tem conta?{' '}
                <Link to="/login" className="fw-medium text-decoration-none">Entrar</Link>
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

function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  if (!password) return { score: 0, label: '', color: '#e9ecef' };

  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const labels = ['Muito fraca', 'Fraca', 'Média', 'Forte', 'Muito forte'];
  const colors = ['#dc3545', '#fd7e14', '#ffc107', '#198754', '#0d6efd'];

  return { score: Math.min(score, 4), label: labels[score] || '', color: colors[score] || '#e9ecef' };
}

export default Register;