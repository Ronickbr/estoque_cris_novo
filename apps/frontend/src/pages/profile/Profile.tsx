import { useState } from 'react';
import { Row, Col, Card, Form, Button, Badge, Spinner, Alert, InputGroup } from 'react-bootstrap';
import { useAuth, useChangePassword } from '@hooks/useAuth';
import { useToastManager } from '@components/ui/Toast';
import { getInitials } from '@utils';
import {
  User as UserIcon,
  Mail,
  Shield,
  Key,
  Eye,
  EyeOff,
  CheckCircle2,
  Lock,
  Calendar,
  Sparkles,
} from 'lucide-react';

export function Profile() {
  const { user } = useAuth();
  const { success, danger, warning } = useToastManager();
  const changePasswordMutation = useChangePassword();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});

  const validatePasswordForm = () => {
    const errors: Record<string, string> = {};
    if (!currentPassword) {
      errors.currentPassword = 'A senha atual é obrigatória';
    }
    if (!newPassword) {
      errors.newPassword = 'A nova senha é obrigatória';
    } else if (newPassword.length < 8) {
      errors.newPassword = 'A senha deve conter no mínimo 8 caracteres';
    }
    if (newPassword !== confirmPassword) {
      errors.confirmPassword = 'As senhas não coincidem';
    }
    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePasswordForm()) return;

    try {
      await changePasswordMutation.mutateAsync({
        senhaAtual: currentPassword,
        novaSenha: newPassword,
        confirmarNovaSenha: confirmPassword,
      });

      success('Sucesso', 'Senha alterada com sucesso!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordErrors({});
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao alterar senha. Verifique a senha atual.';
      danger('Erro', msg);
    }
  };

  const roleLabel = user?.nivel === 'admin' ? 'Administrador' : 'Usuário';
  const roleBadgeBg = user?.nivel === 'admin' ? 'danger' : 'primary';

  return (
    <div className="container-fluid px-0">
      {/* Header */}
      <div className="mb-4">
        <h2 className="fw-bold mb-1 d-flex align-items-center gap-2">
          <UserIcon className="text-primary" size={28} />
          Meu Perfil
        </h2>
        <p className="text-muted mb-0">Gerencie suas informações pessoais e configurações de segurança.</p>
      </div>

      <Row className="g-4">
        {/* Left Column: User Profile Card */}
        <Col xs={12} lg={4}>
          <Card className="border-0 shadow-sm rounded-3 text-center p-4">
            <Card.Body>
              <div
                className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center mx-auto mb-3 shadow-sm"
                style={{ width: '88px', height: '88px', fontSize: '32px', fontWeight: 'bold' }}
              >
                {user ? getInitials(user.nome) : 'U'}
              </div>

              <h4 className="fw-bold mb-1">{user?.nome || 'Usuário'}</h4>
              <p className="text-muted small mb-3">{user?.email || 'email@exemplo.com'}</p>

              <div>
                <Badge bg={roleBadgeBg} className="px-3 py-2 rounded-pill fs-7 fw-semibold">
                  <Shield size={14} className="me-1" />
                  {roleLabel}
                </Badge>
              </div>

              <hr className="my-4 opacity-25" />

              <div className="text-start">
                <div className="mb-3">
                  <div className="text-muted small fw-semibold">Nome Completo</div>
                  <div className="fw-medium text-dark">{user?.nome || '-'}</div>
                </div>

                <div className="mb-3">
                  <div className="text-muted small fw-semibold">E-mail Cadastrado</div>
                  <div className="fw-medium text-dark">{user?.email || '-'}</div>
                </div>

                <div className="mb-3">
                  <div className="text-muted small fw-semibold">Nível de Permissão</div>
                  <div className="fw-medium text-dark text-capitalize">{user?.nivel || '-'}</div>
                </div>

                <div>
                  <div className="text-muted small fw-semibold">Identificador (ID)</div>
                  <div className="text-muted font-monospace small">#{user?.id || '-'}</div>
                </div>
              </div>
            </Card.Body>
          </Card>

          {/* Security Card Tip */}
          <Card className="border-0 shadow-sm rounded-3 mt-4 bg-light">
            <Card.Body className="p-3">
              <div className="d-flex align-items-start gap-2">
                <Sparkles size={20} className="text-warning flex-shrink-0 mt-1" />
                <div>
                  <h6 className="fw-bold mb-1">Dica de Segurança</h6>
                  <p className="text-muted small mb-0">
                    Utilize uma senha com pelo menos 8 caracteres, combinando letras maiúsculas, minúsculas, números e símbolos especiais.
                  </p>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Right Column: Change Password & Account Settings */}
        <Col xs={12} lg={8}>
          <Card className="border-0 shadow-sm rounded-3 mb-4">
            <Card.Header className="bg-white border-bottom py-3">
              <h5 className="fw-bold mb-0 d-flex align-items-center gap-2">
                <Lock size={20} className="text-primary" />
                Alterar Senha de Acesso
              </h5>
            </Card.Header>
            <Card.Body className="p-4">
              <Form onSubmit={handlePasswordSubmit}>
                {/* Current Password */}
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold small">Senha Atual *</Form.Label>
                  <InputGroup>
                    <Form.Control
                      type={showCurrentPassword ? 'text' : 'password'}
                      placeholder="Digite sua senha atual"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      isInvalid={!!passwordErrors.currentPassword}
                    />
                    <Button
                      variant="outline-secondary"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      tabIndex={-1}
                    >
                      {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </Button>
                    <Form.Control.Feedback type="invalid">
                      {passwordErrors.currentPassword}
                    </Form.Control.Feedback>
                  </InputGroup>
                </Form.Group>

                {/* New Password */}
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold small">Nova Senha *</Form.Label>
                  <InputGroup>
                    <Form.Control
                      type={showNewPassword ? 'text' : 'password'}
                      placeholder="Mínimo de 8 caracteres"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      isInvalid={!!passwordErrors.newPassword}
                    />
                    <Button
                      variant="outline-secondary"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      tabIndex={-1}
                    >
                      {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </Button>
                    <Form.Control.Feedback type="invalid">
                      {passwordErrors.newPassword}
                    </Form.Control.Feedback>
                  </InputGroup>
                </Form.Group>

                {/* Confirm New Password */}
                <Form.Group className="mb-4">
                  <Form.Label className="fw-semibold small">Confirmar Nova Senha *</Form.Label>
                  <InputGroup>
                    <Form.Control
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Repita a nova senha"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      isInvalid={!!passwordErrors.confirmPassword}
                    />
                    <Button
                      variant="outline-secondary"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </Button>
                    <Form.Control.Feedback type="invalid">
                      {passwordErrors.confirmPassword}
                    </Form.Control.Feedback>
                  </InputGroup>
                </Form.Group>

                <div className="d-flex justify-content-end">
                  <Button
                    variant="primary"
                    type="submit"
                    className="d-flex align-items-center gap-2 px-4 shadow-sm"
                    disabled={changePasswordMutation.isPending}
                  >
                    {changePasswordMutation.isPending && <Spinner size="sm" animation="border" />}
                    <Key size={16} />
                    Atualizar Senha
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>

          {/* Account Details Card */}
          <Card className="border-0 shadow-sm rounded-3">
            <Card.Header className="bg-white border-bottom py-3">
              <h5 className="fw-bold mb-0 d-flex align-items-center gap-2">
                <CheckCircle2 size={20} className="text-success" />
                Status da Conta
              </h5>
            </Card.Header>
            <Card.Body className="p-4">
              <Row className="g-3">
                <Col xs={12} sm={6}>
                  <div className="p-3 bg-light rounded-3">
                    <div className="text-muted small fw-semibold">Status de Autenticação</div>
                    <div className="fw-bold text-success d-flex align-items-center gap-2 mt-1">
                      <span className="badge bg-success rounded-circle p-1"> </span>
                      Conectado e Ativo
                    </div>
                  </div>
                </Col>
                <Col xs={12} sm={6}>
                  <div className="p-3 bg-light rounded-3">
                    <div className="text-muted small fw-semibold">Armazenamento de Sessão</div>
                    <div className="fw-bold text-dark mt-1">JWT Seguro (Bearer)</div>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default Profile;
