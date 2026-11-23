import { Row, Col, Card, Button, Form, Modal, ProgressBar, Spinner, Alert, Badge, DropdownButton, Dropdown } from 'react-bootstrap';
import { useState, useCallback, useEffect } from 'react';
import { useBackups } from '@hooks/useBackup';
import { useToastManager } from '@components/ui/Toast';
import { cn, formatDate, formatRelativeTime } from '@utils';
import {
  Database, Download, Upload, RotateCcw, Trash2, Clock, CheckCircle, XCircle, AlertTriangle, FileText, ChevronDown,
} from 'lucide-react';

const BACKUP_TYPES = [
  { id: 'full', label: 'Backup Completo', description: 'Todos os dados do sistema', icon: Database, color: 'primary' },
  { id: 'products', label: 'Apenas Produtos', description: 'Produtos, categorias e fabricantes', icon: FileText, color: 'info' },
  { id: 'movements', label: 'Movimentações', description: 'Histórico de entradas e saídas', icon: RotateCcw, color: 'warning' },
  { id: 'reports', label: 'Relatórios', description: 'Dados consolidados para análise', icon: FileText, color: 'success' },
];

export function Backup() {
  const { success, danger, warning } = useToastManager();
  const { backups, isLoading: backupsLoading, createBackup, restoreBackup, deleteBackup } = useBackups();

  const [isCreating, setIsCreating] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<any>(null);
  const [deletingBackup, setDeletingBackup] = useState<any>(null);
  const [createType, setCreateType] = useState<'full' | 'products' | 'movements' | 'reports'>('full');
  const [createDescription, setCreateDescription] = useState('');
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [restoreProgress, setRestoreProgress] = useState(0);

  const handleCreateBackup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      await createBackup.mutateAsync({ type: createType, description: createDescription });
      success('Sucesso', 'Backup criado com sucesso');
      setShowCreateModal(false);
      setCreateDescription('');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao criar backup';
      danger('Erro', message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleRestoreBackup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restoreFile || !selectedBackup) return;

    setIsRestoring(true);
    setRestoreProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setRestoreProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      await restoreBackup.mutateAsync({ id: selectedBackup.id, file: restoreFile });
      clearInterval(progressInterval);
      setRestoreProgress(100);

      success('Sucesso', 'Backup restaurado com sucesso');
      setShowRestoreModal(false);
      setRestoreFile(null);
      setSelectedBackup(null);
      setRestoreProgress(0);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao restaurar backup';
      danger('Erro', message);
    } finally {
      setIsRestoring(false);
      setRestoreProgress(0);
    }
  };

  const handleDeleteBackup = async () => {
    if (!deletingBackup) return;
    setIsDeleting(deletingBackup.id);
    try {
      await deleteBackup.mutateAsync(deletingBackup.id);
      success('Sucesso', 'Backup excluído com sucesso');
      setDeletingBackup(null);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao excluir backup';
      danger('Erro', message);
      setDeletingBackup(null);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setRestoreFile(file);
      // Auto-select matching backup by description
      const matching = backups.find((b) => b.description.includes(file.name));
      if (matching) setSelectedBackup(matching);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return <Badge className="bg-success">Concluído</Badge>;
      case 'pending': return <Badge className="bg-warning text-dark">Pendente</Badge>;
      case 'failed': return <Badge className="bg-danger">Falhou</Badge>;
      case 'restoring': return <Badge className="bg-info">Restaurando</Badge>;
      default: return <Badge className="bg-secondary">{status}</Badge>;
    }
  };

  const getTypeLabel = (type: string) => {
    const found = BACKUP_TYPES.find((t) => t.id === type);
    return found?.label || type;
  };

  return (
    <div className="backup-page">
      <div className="page-header d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h1 className="h2 fw-bold mb-1">Backup e Restauração</h1>
          <p className="text-muted mb-0">Gerencie backups do sistema e restaure dados quando necessário</p>
        </div>
        <Button variant="primary" onClick={() => setShowCreateModal(true)} disabled={isCreating}>
          <Database className="me-1" size={16} aria-hidden="true" />
          Novo Backup
        </Button>
      </div>

      <Row className="g-4 mb-4">
        {BACKUP_TYPES.map((type) => (
          <Col key={type.id} md={6} lg={3}>
            <Card className="h-100 shadow-sm border-0 text-center p-4">
              <div className="backup-type-icon mb-3" style={{ color: `var(--color-${type.color}-600)` }}>
                <type.icon size={32} aria-hidden="true" />
              </div>
              <h6 className="fw-semibold mb-1">{type.label}</h6>
              <p className="text-muted small mb-3">{type.description}</p>
              <Button
                variant="outline-primary"
                size="sm"
                onClick={() => { setCreateType(type.id as typeof createType); setShowCreateModal(true); }}
                disabled={isCreating}
              >
                Criar
              </Button>
            </Card>
          </Col>
        ))}
      </Row>

      <Card className="shadow-sm border-0">
        <Card.Header className="bg-white border-0 pb-0">
          <h5 className="mb-0 fw-semibold">Backups Recentes</h5>
        </Card.Header>
        <Card.Body className="p-0">
          {backupsLoading ? (
            <div className="d-flex justify-content-center py-5">
              <Spinner animation="border" variant="primary" role="status" aria-label="Carregando backups" />
              <span className="visually-hidden">Carregando backups...</span>
            </div>
          ) : backups.length === 0 ? (
            <div className="empty-state text-center py-5">
              <Database className="text-muted" size={48} aria-hidden="true" />
              <h6 className="mt-3 text-muted">Nenhum backup encontrado</h6>
              <p className="text-muted small">Clique em "Novo Backup" para criar seu primeiro backup</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th scope="col">Nome do Arquivo</th>
                    <th scope="col">Tipo</th>
                    <th scope="col">Tamanho</th>
                    <th scope="col">Status</th>
                    <th scope="col">Criado em</th>
                    <th scope="col" className="text-end">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {backups.map((backup) => (
                    <tr key={backup.id}>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <FileText className="text-muted" size={20} aria-hidden="true" />
                          <span className="fw-medium text-truncate" style={{ maxWidth: '300px' }}>{backup.description}</span>
                        </div>
                      </td>
                      <td>
                        <Badge className="bg-light text-dark">{getTypeLabel(backup.type)}</Badge>
                      </td>
                      <td className="text-muted">{backup.size ? `${(backup.size / 1024).toFixed(1)} KB` : '—'}</td>
                      <td>{getStatusBadge(backup.status)}</td>
                      <td className="text-nowrap">{formatDate(backup.createdAt, { hour: '2-digit', minute: '2-digit' })}</td>
                      <td className="text-end">
                        <DropdownButton
                          variant="ghost"
                          size="sm"
                          title={
                            <>
                              <span className="visually-hidden">Ações</span>
                              <ChevronDown size={16} aria-hidden="true" />
                            </>
                          }
                          id={`backup-actions-${backup.id}`}
                          align="end"
                        >
                          <Dropdown.Item onClick={() => downloadBackup(backup.id)}>
                            <Download className="me-2" size={14} aria-hidden="true" />
                            Baixar
                          </Dropdown.Item>
                          <Dropdown.Item onClick={() => { setSelectedBackup(backup); setShowRestoreModal(true); }}>
                            <RotateCcw className="me-2" size={14} aria-hidden="true" />
                            Restaurar
                          </Dropdown.Item>
                          <Dropdown.Divider />
                          <Dropdown.Item
                            className="text-danger"
                            onClick={() => setDeletingBackup(backup)}
                          >
                            <Trash2 className="me-2" size={14} aria-hidden="true" />
                            Excluir
                          </Dropdown.Item>
                        </DropdownButton>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card.Body>
      </Card>

      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} size="lg" centered title="Criar Backup">
        <Form onSubmit={handleCreateBackup}>
          <Modal.Body>
            <div className="mb-3">
              <Form.Label>Tipo de Backup</Form.Label>
              <div className="row g-2">
                {BACKUP_TYPES.map((type) => (
                  <Col key={type.id} md={6}>
                    <div
                      className={cn(
                        'backup-type-option p-3 border rounded-3 text-center cursor-pointer transition-all',
                        createType === type.id ? `border-${type.color} bg-${type.color}-50` : 'border-secondary hover:border-primary'
                      )}
                      onClick={() => setCreateType(type.id as typeof createType)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setCreateType(type.id as typeof createType); }}
                    >
                      <div className="mb-2" style={{ color: `var(--color-${type.color}-600)` }}>
                        <type.icon size={24} aria-hidden="true" />
                      </div>
                      <div className="fw-medium">{type.label}</div>
                      <div className="text-muted small">{type.description}</div>
                    </div>
                  </Col>
                ))}
              </div>
            </div>
            <div className="mb-3">
              <Form.Label>Descrição (opcional)</Form.Label>
              <textarea
                className="form-control"
                rows={3}
                value={createDescription}
                onChange={(e) => setCreateDescription(e.target.value)}
                placeholder="Descreva o propósito deste backup..."
              />
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowCreateModal(false)} disabled={isCreating}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit" disabled={isCreating}>
              {isCreating ? (
                <>
                  <Spinner as="span" size="sm" className="me-1" aria-hidden="true" />
                  Criando...
                </>
              ) : (
                <>
                  <Database className="me-1" size={16} aria-hidden="true" />
                  Criar Backup
                </>
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <Modal show={showRestoreModal} onHide={() => { setShowRestoreModal(false); setSelectedBackup(null); setRestoreFile(null); }} size="lg" centered title="Restaurar Backup">
        <Form onSubmit={handleRestoreBackup}>
          <Modal.Body>
            {selectedBackup && (
              <Alert variant="warning" className="mb-3">
                <AlertTriangle className="me-2" size={16} aria-hidden="true" />
                <strong>Atenção:</strong> A restauração sobrescreverá os dados atuais. Esta ação não pode ser desfeita.
              </Alert>
            )}

            <div className="mb-3">
              <Form.Label>Selecione o arquivo de backup</Form.Label>
              <input
                type="file"
                className="form-control"
                accept=".json,.sql,.zip"
                onChange={handleFileSelect}
                required
                disabled={isRestoring}
              />
              <Form.Text>Formatos aceitos: .json, .sql, .zip</Form.Text>
            </div>

            {selectedBackup && (
              <div className="mb-3 p-3 bg-light rounded-3">
                <div className="fw-medium">Backup selecionado: {selectedBackup.description}</div>
                <div className="text-muted small">
                  Tipo: {getTypeLabel(selectedBackup.type)} • {formatRelativeTime(selectedBackup.createdAt)}
                </div>
              </div>
            )}

            {restoreProgress > 0 && (
              <div className="mb-3">
                <div className="d-flex justify-content-between mb-1">
                  <span>Restaurando...</span>
                  <span>{restoreProgress}%</span>
                </div>
                <ProgressBar variant="primary" now={restoreProgress} animated />
              </div>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => { setShowRestoreModal(false); setSelectedBackup(null); setRestoreFile(null); }} disabled={isRestoring}>
              Cancelar
            </Button>
            <Button variant="danger" type="submit" disabled={isRestoring || !restoreFile || !selectedBackup}>
              {isRestoring ? (
                <>
                  <Spinner as="span" size="sm" className="me-1" aria-hidden="true" />
                  Restaurando...
                </>
              ) : (
                <>
                  <RotateCcw className="me-1" size={16} aria-hidden="true" />
                  Restaurar
                </>
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <Modal
        show={!!deletingBackup}
        onHide={() => setDeletingBackup(null)}
        size="sm"
        centered
        title="Confirmar exclusão"
        confirmText="Excluir"
        confirmVariant="danger"
        loading={isDeleting === deletingBackup?.id}
      >
        <div className="text-center">
          <Trash2 className="text-danger mb-3" size={48} aria-hidden="true" />
          <h5>Excluir backup?</h5>
          <p className="text-muted">
            Tem certeza que deseja excluir <strong>{deletingBackup?.description}</strong>?
            Esta ação não pode ser desfeita.
          </p>
        </div>
      </Modal>
    </div>
  );
}

function downloadBackup(id: string) {
  // Trigger download via API
  window.open(`/api/v1/backups/${id}/download`, '_blank');
}

export default Backup;