import { useState, useEffect } from 'react';
import { Row, Col, Card, Form, Button, Spinner } from 'react-bootstrap';
import { useAuth } from '@hooks/useAuth';
import { useToastManager } from '@components/ui/Toast';
import {
  Palette,
  Globe,
  Bell,
  Shield,
  Sliders,
  Save,
  RefreshCw,
  Sun,
  Moon,
  Laptop,
} from 'lucide-react';

export function Settings() {
  const { user } = useAuth();
  const { success, warning } = useToastManager();

  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'notifications' | 'display'>('general');

  const [settings, setSettings] = useState({
    theme: 'light' as 'light' | 'dark' | 'system',
    language: 'pt-BR',
    dateFormat: 'DD/MM/YYYY',
    itemsPerPage: 20,
    emailAlerts: true,
    lowStockAlerts: true,
    movementAlerts: true,
    compactTables: false,
  });

  useEffect(() => {
    const saved = localStorage.getItem('app-settings');
    if (saved) {
      try {
        setSettings((prev) => ({ ...prev, ...JSON.parse(saved) }));
      } catch {
        // Ignore parsing error
      }
    }
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      localStorage.setItem('app-settings', JSON.stringify(settings));
      await new Promise((resolve) => setTimeout(resolve, 300));
      success('Sucesso', 'Configurações salvas com sucesso!');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    const defaults = {
      theme: 'light' as const,
      language: 'pt-BR',
      dateFormat: 'DD/MM/YYYY',
      itemsPerPage: 20,
      emailAlerts: true,
      lowStockAlerts: true,
      movementAlerts: true,
      compactTables: false,
    };
    setSettings(defaults);
    localStorage.removeItem('app-settings');
    warning('Configurações', 'Configurações restauradas para o padrão.');
  };

  return (
    <div className="container-fluid px-0">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h2 className="fw-bold mb-1 d-flex align-items-center gap-2">
            <Sliders className="text-primary" size={28} />
            Configurações do Sistema
          </h2>
          <p className="text-muted mb-0">Personalize preferências de exibição, alertas e notificações.</p>
        </div>
        <div className="d-flex gap-2">
          <Button variant="outline-secondary" onClick={handleReset} disabled={isSaving}>
            <RefreshCw size={16} className="me-1" />
            Restaurar
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={isSaving} className="d-flex align-items-center gap-2">
            {isSaving && <Spinner size="sm" animation="border" />}
            <Save size={16} />
            Salvar Alterações
          </Button>
        </div>
      </div>

      <Row className="g-4">
        {/* Navigation Tabs */}
        <Col xs={12} md={3}>
          <Card className="border-0 shadow-sm rounded-3 overflow-hidden">
            <div className="list-group list-group-flush">
              <button
                type="button"
                className={`list-group-item list-group-item-action d-flex align-items-center gap-2 py-3 px-3 fw-medium border-0 ${
                  activeTab === 'general' ? 'bg-primary text-white' : 'text-dark'
                }`}
                onClick={() => setActiveTab('general')}
              >
                <Globe size={18} />
                Geral e Regional
              </button>
              <button
                type="button"
                className={`list-group-item list-group-item-action d-flex align-items-center gap-2 py-3 px-3 fw-medium border-0 ${
                  activeTab === 'display' ? 'bg-primary text-white' : 'text-dark'
                }`}
                onClick={() => setActiveTab('display')}
              >
                <Palette size={18} />
                Aparência e Exibição
              </button>
              <button
                type="button"
                className={`list-group-item list-group-item-action d-flex align-items-center gap-2 py-3 px-3 fw-medium border-0 ${
                  activeTab === 'notifications' ? 'bg-primary text-white' : 'text-dark'
                }`}
                onClick={() => setActiveTab('notifications')}
              >
                <Bell size={18} />
                Alertas e Notificações
              </button>
            </div>
          </Card>
        </Col>

        {/* Tab Content */}
        <Col xs={12} md={9}>
          <Card className="border-0 shadow-sm rounded-3">
            <Card.Body className="p-4">
              {activeTab === 'general' && (
                <div>
                  <h5 className="fw-bold mb-3 d-flex align-items-center gap-2">
                    <Globe size={20} className="text-primary" />
                    Preferências Gerais
                  </h5>
                  <Row className="g-3">
                    <Col xs={12} md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold small">Idioma</Form.Label>
                        <Form.Select
                          value={settings.language}
                          onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                        >
                          <option value="pt-BR">Português (Brasil)</option>
                          <option value="en-US">English (US)</option>
                          <option value="es-ES">Español</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col xs={12} md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold small">Formato de Data</Form.Label>
                        <Form.Select
                          value={settings.dateFormat}
                          onChange={(e) => setSettings({ ...settings, dateFormat: e.target.value })}
                        >
                          <option value="DD/MM/YYYY">DD/MM/YYYY (Brasil)</option>
                          <option value="YYYY-MM-DD">YYYY-MM-DD (ISO)</option>
                          <option value="MM/DD/YYYY">MM/DD/YYYY (US)</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col xs={12} md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold small">Itens por Página (Tabelas)</Form.Label>
                        <Form.Select
                          value={settings.itemsPerPage}
                          onChange={(e) => setSettings({ ...settings, itemsPerPage: Number(e.target.value) })}
                        >
                          <option value={10}>10 itens</option>
                          <option value={20}>20 itens</option>
                          <option value={50}>50 itens</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>
                </div>
              )}

              {activeTab === 'display' && (
                <div>
                  <h5 className="fw-bold mb-3 d-flex align-items-center gap-2">
                    <Palette size={20} className="text-primary" />
                    Aparência
                  </h5>
                  <Row className="g-3 mb-4">
                    <Col xs={12} sm={4}>
                      <div
                        className={`p-3 border rounded-3 text-center cursor-pointer ${
                          settings.theme === 'light' ? 'border-primary bg-primary-subtle' : 'bg-white'
                        }`}
                        onClick={() => setSettings({ ...settings, theme: 'light' })}
                        style={{ cursor: 'pointer' }}
                      >
                        <Sun size={28} className="text-warning mb-2" />
                        <div className="fw-bold">Claro</div>
                        <div className="text-muted small">Padrão limpo</div>
                      </div>
                    </Col>
                    <Col xs={12} sm={4}>
                      <div
                        className={`p-3 border rounded-3 text-center cursor-pointer ${
                          settings.theme === 'dark' ? 'border-primary bg-primary-subtle' : 'bg-white'
                        }`}
                        onClick={() => setSettings({ ...settings, theme: 'dark' })}
                        style={{ cursor: 'pointer' }}
                      >
                        <Moon size={28} className="text-primary mb-2" />
                        <div className="fw-bold">Escuro</div>
                        <div className="text-muted small">Descanso visual</div>
                      </div>
                    </Col>
                    <Col xs={12} sm={4}>
                      <div
                        className={`p-3 border rounded-3 text-center cursor-pointer ${
                          settings.theme === 'system' ? 'border-primary bg-primary-subtle' : 'bg-white'
                        }`}
                        onClick={() => setSettings({ ...settings, theme: 'system' })}
                        style={{ cursor: 'pointer' }}
                      >
                        <Laptop size={28} className="text-secondary mb-2" />
                        <div className="fw-bold">Automático</div>
                        <div className="text-muted small">Segue o sistema</div>
                      </div>
                    </Col>
                  </Row>

                  <Form.Check
                    type="switch"
                    id="compact-tables"
                    label="Modo de tabela compacto (maior densidade de linhas)"
                    checked={settings.compactTables}
                    onChange={(e) => setSettings({ ...settings, compactTables: e.target.checked })}
                    className="fw-medium mb-3"
                  />
                </div>
              )}

              {activeTab === 'notifications' && (
                <div>
                  <h5 className="fw-bold mb-3 d-flex align-items-center gap-2">
                    <Bell size={20} className="text-primary" />
                    Notificações e Avisos
                  </h5>
                  <div className="d-flex flex-column gap-3">
                    <Form.Check
                      type="switch"
                      id="low-stock-alert"
                      label="Alertar quando produtos atingirem estoque crítico"
                      checked={settings.lowStockAlerts}
                      onChange={(e) => setSettings({ ...settings, lowStockAlerts: e.target.checked })}
                      className="fw-medium"
                    />
                    <Form.Check
                      type="switch"
                      id="movement-alert"
                      label="Notificar sobre novas movimentações de saída de produtos"
                      checked={settings.movementAlerts}
                      onChange={(e) => setSettings({ ...settings, movementAlerts: e.target.checked })}
                      className="fw-medium"
                    />
                    <Form.Check
                      type="switch"
                      id="email-alert"
                      label="Receber relatórios semanais de desempenho no e-mail"
                      checked={settings.emailAlerts}
                      onChange={(e) => setSettings({ ...settings, emailAlerts: e.target.checked })}
                      className="fw-medium"
                    />
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default Settings;
