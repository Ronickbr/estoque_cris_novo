import { useState, useMemo } from 'react';
import { Row, Col, Card, Button, Table, Badge, Modal, Form, InputGroup, Spinner, Alert } from 'react-bootstrap';
import { useMovements, useCreateMovement } from '@hooks/useInventory';
import { useProducts } from '@hooks/useProducts';
import { useToastManager } from '@components/ui/Toast';
import { MovementType, InventoryMovement } from '@types';
import { formatDate } from '@utils';
import {
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Search,
  Filter,
  Package,
  Calendar,
  User,
  FileText,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Layers,
} from 'lucide-react';

export function Inventory() {
  const { success, danger, warning } = useToastManager();

  // Queries
  const [page, setPage] = useState(1);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);

  const movementsQuery = useMovements({
    page,
    pageSize: 20,
    type: filterType === 'all' ? undefined : (filterType as MovementType),
  });

  const productsQuery = useProducts();
  const createMovementMutation = useCreateMovement();

  const movementsData = movementsQuery.data;
  const rawMovements: InventoryMovement[] = movementsData?.data || [];
  const products = productsQuery.data?.data || [];

  // Form state for new movement
  const [formData, setFormData] = useState({
    productId: '',
    type: MovementType.ENTRY,
    quantity: 1,
    notes: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Client-side search filtering by product name or notes
  const filteredMovements = useMemo(() => {
    if (!searchTerm.trim()) return rawMovements;
    const term = searchTerm.toLowerCase();
    return rawMovements.filter((m) => {
      const prodName = m.productName || m.product?.name || '';
      const notes = m.notes || '';
      return prodName.toLowerCase().includes(term) || notes.toLowerCase().includes(term);
    });
  }, [rawMovements, searchTerm]);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = rawMovements.length;
    const entries = rawMovements.filter((m) => m.type === MovementType.ENTRY || (m.type as string) === 'entry').length;
    const exits = rawMovements.filter((m) => m.type === MovementType.EXIT || (m.type as string) === 'exit').length;
    return { total, entries, exits };
  }, [rawMovements]);

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.productId) {
      errors.productId = 'Selecione um produto';
    }
    if (!formData.quantity || formData.quantity <= 0) {
      errors.quantity = 'A quantidade deve ser maior que zero';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleOpenModal = () => {
    setFormData({
      productId: products.length > 0 ? String(products[0].id) : '',
      type: MovementType.ENTRY,
      quantity: 1,
      notes: '',
    });
    setFormErrors({});
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setFormErrors({});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      await createMovementMutation.mutateAsync({
        productId: formData.productId,
        type: formData.type,
        quantity: Number(formData.quantity),
        notes: formData.notes.trim() || undefined,
      });

      success('Sucesso', 'Movimentação registrada com sucesso!');
      handleCloseModal();
      movementsQuery.refetch();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao registrar movimentação';
      danger('Erro', msg);
    }
  };

  const isEntryType = (type: string) => type === MovementType.ENTRY || type === 'entry';

  return (
    <div className="container-fluid px-0">
      {/* Page Title & Actions */}
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h2 className="fw-bold mb-1 d-flex align-items-center gap-2">
            <Layers className="text-primary" size={28} />
            Movimentações de Estoque
          </h2>
          <p className="text-muted mb-0">
            Histórico completo de entradas, saídas e transferências de mercadorias.
          </p>
        </div>
        <div className="d-flex gap-2">
          <Button
            variant="outline-secondary"
            className="d-flex align-items-center gap-2"
            onClick={() => movementsQuery.refetch()}
            disabled={movementsQuery.isFetching}
          >
            <RefreshCw size={16} className={movementsQuery.isFetching ? 'spin' : ''} />
            Atualizar
          </Button>
          <Button
            variant="primary"
            className="d-flex align-items-center gap-2 shadow-sm"
            onClick={handleOpenModal}
          >
            <Plus size={18} />
            Nova Movimentação
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <Row className="g-3 mb-4">
        <Col xs={12} md={4}>
          <Card className="border-0 shadow-sm rounded-3">
            <Card.Body className="d-flex align-items-center p-3">
              <div
                className="bg-primary-subtle text-primary rounded-3 p-3 d-flex align-items-center justify-content-center me-3"
                style={{ width: '52px', height: '52px' }}
              >
                <Layers size={26} />
              </div>
              <div>
                <div className="text-muted small fw-medium">Total de Registros</div>
                <div className="fs-4 fw-bold text-dark">{movementsData?.total ?? stats.total}</div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col xs={12} md={4}>
          <Card className="border-0 shadow-sm rounded-3">
            <Card.Body className="d-flex align-items-center p-3">
              <div
                className="bg-success-subtle text-success rounded-3 p-3 d-flex align-items-center justify-content-center me-3"
                style={{ width: '52px', height: '52px' }}
              >
                <TrendingUp size={26} />
              </div>
              <div>
                <div className="text-muted small fw-medium">Entradas Registradas</div>
                <div className="fs-4 fw-bold text-success">{stats.entries}</div>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col xs={12} md={4}>
          <Card className="border-0 shadow-sm rounded-3">
            <Card.Body className="d-flex align-items-center p-3">
              <div
                className="bg-danger-subtle text-danger rounded-3 p-3 d-flex align-items-center justify-content-center me-3"
                style={{ width: '52px', height: '52px' }}
              >
                <TrendingDown size={26} />
              </div>
              <div>
                <div className="text-muted small fw-medium">Saídas Registradas</div>
                <div className="fs-4 fw-bold text-danger">{stats.exits}</div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Filter and Search Bar */}
      <Card className="border-0 shadow-sm rounded-3 mb-4">
        <Card.Body className="p-3">
          <Row className="g-3 align-items-center">
            <Col xs={12} md={6} lg={4}>
              <InputGroup>
                <InputGroup.Text className="bg-white border-end-0">
                  <Search size={18} className="text-muted" />
                </InputGroup.Text>
                <Form.Control
                  className="border-start-0 ps-0"
                  placeholder="Buscar produto ou observação..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Col>

            <Col xs={12} sm={6} md={3} lg={3}>
              <div className="d-flex align-items-center gap-2">
                <Filter size={18} className="text-muted flex-shrink-0" />
                <Form.Select
                  value={filterType}
                  onChange={(e) => {
                    setFilterType(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="all">Todos os Tipos</option>
                  <option value={MovementType.ENTRY}>Apenas Entradas</option>
                  <option value={MovementType.EXIT}>Apenas Saídas</option>
                </Form.Select>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Movements Table */}
      <Card className="border-0 shadow-sm rounded-3 overflow-hidden">
        <Card.Body className="p-0">
          {movementsQuery.isLoading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="text-muted mt-2 mb-0">Carregando movimentações...</p>
            </div>
          ) : movementsQuery.isError ? (
            <div className="p-4 text-center">
              <Alert variant="danger">
                Ocorreu um erro ao carregar as movimentações.
                <div className="mt-2">
                  <Button variant="outline-danger" size="sm" onClick={() => movementsQuery.refetch()}>
                    Tentar novamente
                  </Button>
                </div>
              </Alert>
            </div>
          ) : filteredMovements.length === 0 ? (
            <div className="text-center py-5">
              <Package size={48} className="text-muted mb-3 opacity-50" />
              <h5 className="text-muted fw-semibold">Nenhuma movimentação encontrada</h5>
              <p className="text-muted small">
                {searchTerm || filterType !== 'all'
                  ? 'Tente ajustar os filtros ou o termo de busca.'
                  : 'Clique no botão acima para registrar a primeira movimentação de estoque.'}
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover className="align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th className="ps-4 py-3 text-secondary text-uppercase fs-7 fw-semibold">Data / Hora</th>
                    <th className="py-3 text-secondary text-uppercase fs-7 fw-semibold">Produto</th>
                    <th className="py-3 text-secondary text-uppercase fs-7 fw-semibold">Tipo</th>
                    <th className="py-3 text-secondary text-uppercase fs-7 fw-semibold text-end">Quantidade</th>
                    <th className="py-3 text-secondary text-uppercase fs-7 fw-semibold">Responsável</th>
                    <th className="pe-4 py-3 text-secondary text-uppercase fs-7 fw-semibold">Observações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMovements.map((movement) => {
                    const isEntry = isEntryType(movement.type);
                    const productName = movement.productName || movement.product?.name || `Produto #${movement.productId}`;
                    const userName = movement.createdByName || movement.user?.nome || 'Sistema';

                    return (
                      <tr key={movement.id}>
                        <td className="ps-4 py-3 text-muted small">
                          <div className="d-flex align-items-center gap-2">
                            <Calendar size={14} className="text-muted" />
                            {movement.createdAt ? formatDate(movement.createdAt) : '-'}
                          </div>
                        </td>
                        <td className="py-3 fw-medium text-dark">
                          <div className="d-flex align-items-center gap-2">
                            <Package size={16} className="text-primary flex-shrink-0" />
                            <span>{productName}</span>
                          </div>
                        </td>
                        <td className="py-3">
                          {isEntry ? (
                            <Badge bg="success-subtle" className="text-success border border-success-subtle d-inline-flex align-items-center gap-1 px-2.5 py-1.5 rounded-pill">
                              <ArrowUpRight size={14} />
                              Entrada
                            </Badge>
                          ) : (
                            <Badge bg="danger-subtle" className="text-danger border border-danger-subtle d-inline-flex align-items-center gap-1 px-2.5 py-1.5 rounded-pill">
                              <ArrowDownRight size={14} />
                              Saída
                            </Badge>
                          )}
                        </td>
                        <td className="py-3 text-end fw-bold">
                          <span className={isEntry ? 'text-success' : 'text-danger'}>
                            {isEntry ? `+${movement.quantity}` : `-${movement.quantity}`}
                          </span>
                        </td>
                        <td className="py-3 text-muted small">
                          <div className="d-flex align-items-center gap-1.5">
                            <User size={14} className="text-secondary" />
                            <span>{userName}</span>
                          </div>
                        </td>
                        <td className="pe-4 py-3 text-muted small">
                          {movement.notes ? (
                            <div className="d-flex align-items-center gap-1">
                              <FileText size={14} className="text-muted flex-shrink-0" />
                              <span className="text-truncate" style={{ maxWidth: '240px' }} title={movement.notes}>
                                {movement.notes}
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted opacity-50">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Modal Nova Movimentação */}
      <Modal show={showModal} onHide={handleCloseModal} centered>
        <Form onSubmit={handleSubmit}>
          <Modal.Header closeButton className="border-bottom-0 pb-0">
            <Modal.Title className="fw-bold fs-5 d-flex align-items-center gap-2">
              <Plus className="text-primary" size={22} />
              Nova Movimentação de Estoque
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="pt-3">
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold small">Produto *</Form.Label>
              <Form.Select
                value={formData.productId}
                onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                isInvalid={!!formErrors.productId}
                disabled={productsQuery.isLoading}
              >
                <option value="">Selecione um produto...</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (Atual: {p.currentStock ?? 0})
                  </option>
                ))}
              </Form.Select>
              <Form.Control.Feedback type="invalid">
                {formErrors.productId}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold small">Tipo de Movimentação *</Form.Label>
              <div className="d-flex gap-3">
                <Form.Check
                  type="radio"
                  id="type-entry"
                  name="movementType"
                  label="Entrada (+)"
                  checked={formData.type === MovementType.ENTRY}
                  onChange={() => setFormData({ ...formData, type: MovementType.ENTRY })}
                  className="fw-medium text-success"
                />
                <Form.Check
                  type="radio"
                  id="type-exit"
                  name="movementType"
                  label="Saída (-)"
                  checked={formData.type === MovementType.EXIT}
                  onChange={() => setFormData({ ...formData, type: MovementType.EXIT })}
                  className="fw-medium text-danger"
                />
              </div>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold small">Quantidade *</Form.Label>
              <Form.Control
                type="number"
                min="1"
                step="1"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value, 10) || 1 })}
                isInvalid={!!formErrors.quantity}
              />
              <Form.Control.Feedback type="invalid">
                {formErrors.quantity}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold small">Observações</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Ex: Compra NF 1234, Devolução de cliente, etc."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                maxLength={255}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className="border-top-0 pt-0">
            <Button variant="outline-secondary" onClick={handleCloseModal}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={createMovementMutation.isPending}
              className="d-flex align-items-center gap-2"
            >
              {createMovementMutation.isPending && <Spinner size="sm" animation="border" />}
              Registrar Movimentação
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}

export default Inventory;
