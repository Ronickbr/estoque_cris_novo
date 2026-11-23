import { Row, Col, Card, Button, Form, InputGroup, Modal, Badge, Spinner, DropdownButton, Dropdown, Alert } from 'react-bootstrap';
import { useState, useCallback } from 'react';
import { useManufacturers, useCreateManufacturer, useUpdateManufacturer, useDeleteManufacturer } from '@hooks/useManufacturers';
import DataTable, { Column, Action } from '@components/tables/DataTable';
import { useToastManager } from '@components/ui/Toast';
import { Manufacturer, ManufacturerFormData } from '@types';
import { cn, formatCurrency, formatNumber } from '@utils';
import {
  Plus, Search, Filter, ChevronDown, ChevronUp, Edit, Trash2, Eye, Building, AlertTriangle, FileText,
} from 'lucide-react';

const COLUMNS: Column<Manufacturer>[] = [
  { field: 'name', label: 'Fabricante', type: 'text' as const, minWidth: '200px' },
  { field: 'contactName', label: 'Contato', type: 'text' as const, width: '150px' },
  { field: 'email', label: 'E-mail', type: 'text' as const, width: '200px' },
  { field: 'phone', label: 'Telefone', type: 'text' as const, width: '140px' },
  { field: 'city', label: 'Cidade/UF', type: 'custom' as const, width: '150px', sortable: false },
  { field: 'productCount', label: 'Produtos', type: 'number' as const, width: '100px' },
  { field: 'totalStock', label: 'Estoque Total', type: 'number' as const, width: '120px' },
  { field: 'status', label: 'Status', type: 'custom' as const, width: '100px', sortable: false },
];

export function Manufacturers() {
  const { data: manufacturersData, isLoading, error, refetch } = useManufacturers();
  const createManufacturerMutation = useCreateManufacturer();
  const updateManufacturerMutation = useUpdateManufacturer();
  const deleteManufacturerMutation = useDeleteManufacturer();
  
  const manufacturers = manufacturersData?.data || [];
  const isCreating = createManufacturerMutation.isPending;
  const isUpdating = updateManufacturerMutation.isPending;
  const isDeleting = deleteManufacturerMutation.isPending;

  const { success, danger, warning } = useToastManager();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingManufacturer, setEditingManufacturer] = useState<Manufacturer | null>(null);
  const [deletingManufacturer, setDeletingManufacturer] = useState<Manufacturer | null>(null);

  const [formData, setFormData] = useState<ManufacturerFormData>({
    name: '',
    cnpj: '',
    contactName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    active: true,
  });

  const [formErrors, setFormErrors] = useState<Partial<Record<keyof ManufacturerFormData, string>>>({});

  const filteredManufacturers = useCallback(() => {
    let result = [...manufacturers];

    if (searchTerm) {
      const term = searchTerm.toLowerCase().trim();
      result = result.filter(
        (m) =>
          m.name.toLowerCase().includes(term) ||
          m.contactName?.toLowerCase().includes(term) ||
          m.email?.toLowerCase().includes(term) ||
          m.cnpj?.includes(term)
      );
    }

    if (statusFilter !== 'all') {
      result = result.filter((m) => (statusFilter === 'active') === m.active);
    }

    return result;
  }, [manufacturers, searchTerm, statusFilter]);

  const handleOpenCreate = () => {
    setEditingManufacturer(null);
    resetForm();
    setShowModal(true);
  };

  const handleOpenEdit = (manufacturer: Manufacturer) => {
    setEditingManufacturer(manufacturer);
    setFormData({
      name: manufacturer.name,
      cnpj: manufacturer.cnpj || '',
      contactName: manufacturer.contactName || '',
      email: manufacturer.email || '',
      phone: manufacturer.phone || '',
      address: manufacturer.address || '',
      city: manufacturer.city || '',
      state: manufacturer.state || '',
      zipCode: manufacturer.zipCode || '',
      active: manufacturer.active,
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingManufacturer(null);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      cnpj: '',
      contactName: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      active: true,
    });
    setFormErrors({});
  };

  const validateForm = () => {
    const errors: Partial<Record<keyof ManufacturerFormData, string>> = {};
    if (!formData.name.trim()) errors.name = 'Nome é obrigatório';
    if (formData.cnpj && !validateCNPJ(formData.cnpj)) errors.cnpj = 'CNPJ inválido';
    if (formData.email && !validateEmail(formData.email)) errors.email = 'E-mail inválido';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateCNPJ = (cnpj: string): boolean => {
    const clean = cnpj.replace(/\D/g, '');
    if (clean.length !== 14) return false;
    if (/^(\d)\1+$/.test(clean)) return false;

    let sum = 0;
    let weight = 2;
    for (let i = 11; i >= 0; i--) {
      sum += parseInt(clean[i]) * weight;
      weight = weight === 9 ? 2 : weight + 1;
    }
    let digit1 = sum % 11 < 2 ? 0 : 11 - (sum % 11);

    sum = 0;
    weight = 2;
    for (let i = 12; i >= 0; i--) {
      sum += parseInt(clean[i]) * weight;
      weight = weight === 9 ? 2 : weight + 1;
    }
    let digit2 = sum % 11 < 2 ? 0 : 11 - (sum % 11);

    return parseInt(clean[12]) === digit1 && parseInt(clean[13]) === digit2;
  };

  const validateEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      if (editingManufacturer) {
        await updateManufacturerMutation.mutateAsync({ id: editingManufacturer.id, data: formData });
        success('Sucesso', 'Fabricante atualizado com sucesso');
      } else {
        await createManufacturerMutation.mutateAsync(formData);
        success('Sucesso', 'Fabricante criado com sucesso');
      }
      handleCloseModal();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao salvar fabricante';
      danger('Erro', message);
    }
  };

  const handleDelete = async () => {
    if (!deletingManufacturer) return;
    try {
      await deleteManufacturerMutation.mutateAsync(deletingManufacturer.id);
      success('Sucesso', 'Fabricante excluído com sucesso');
      setDeletingManufacturer(null);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao excluir fabricante';
      danger('Erro', message);
      setDeletingManufacturer(null);
    }
  };

  const renderCityCell = (value: unknown, row: Record<string, unknown>) => {
    const manufacturer = row as unknown as Manufacturer;
    if (!manufacturer.city && !manufacturer.state) return '—';
    return `${manufacturer.city || ''}${manufacturer.city && manufacturer.state ? '/' : ''}${manufacturer.state || ''}`;
  };

  const renderStatusCell = (value: unknown, row: Record<string, unknown>) => {
    const manufacturer = row as unknown as Manufacturer;
    return (
      <Badge className={cn('fw-medium', manufacturer.active ? 'bg-success' : 'bg-secondary')}>
        {manufacturer.active ? 'Ativo' : 'Inativo'}
      </Badge>
    );
  };

  const actions: Action<Manufacturer>[] = [
    {
      name: 'view',
      label: 'Ver detalhes',
      icon: <Eye size={16} />,
      variant: 'ghost' as const,
      handler: (row: Manufacturer) => console.log('view', row),
    },
    {
      name: 'edit',
      label: 'Editar',
      icon: <Edit size={16} />,
      variant: 'ghost' as const,
      handler: handleOpenEdit,
    },
    {
      name: 'products',
      label: 'Ver produtos',
      icon: <FileText size={16} />,
      variant: 'ghost' as const,
      handler: (row: Manufacturer) => console.log('products', row),
    },
    {
      name: 'delete',
      label: 'Excluir',
      icon: <Trash2 size={16} />,
      variant: 'ghost' as const,
      handler: (row: Manufacturer) => setDeletingManufacturer(row),
      visible: (row: Manufacturer) => row.productCount === 0,
    },
  ];

  return (
    <div className="manufacturers-page">
      <div className="page-header d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h1 className="h2 fw-bold mb-1">Fabricantes</h1>
          <p className="text-muted mb-0">Gerencie seus fornecedores e fabricantes</p>
        </div>
        <Button variant="primary" onClick={handleOpenCreate} disabled={isCreating || isUpdating}>
          <Plus size={16} className="me-1" aria-hidden="true" />
          Novo Fabricante
        </Button>
      </div>

      <Card className="shadow-sm border-0 mb-4">
        <Card.Body>
          <Form className="row g-3 align-items-end" onSubmit={(e) => e.preventDefault()}>
            <Col md={6} className="position-relative">
              <Form.Label className="visually-hidden">Buscar fabricante</Form.Label>
              <InputGroup>
                <Search className="position-absolute start-0 top-50 translate-middle-y text-muted ps-3" size={18} aria-hidden="true" />
                <input
                  type="search"
                  className="form-control ps-5"
                  placeholder="Buscar por nome, CNPJ, contato, e-mail..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  aria-label="Buscar fabricante"
                />
              </InputGroup>
            </Col>
            <Col md={3}>
              <Form.Label className="visually-hidden">Filtrar por status</Form.Label>
              <select
                className="form-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                aria-label="Filtrar por status"
              >
                <option value="all">Todos</option>
                <option value="active">Ativos</option>
                <option value="inactive">Inativos</option>
              </select>
            </Col>
          </Form>
        </Card.Body>
      </Card>

      <DataTable
        columns={COLUMNS.map((col) => ({
          ...col,
          render:
            col.field === 'city' ? renderCityCell : col.field === 'status' ? renderStatusCell : undefined,
        }))}
        data={filteredManufacturers() as unknown as Record<string, unknown>[]}
        keyField="id"
        pagination
        pageSize={15}
        pageSizes={[10, 15, 25, 50]}
        searchable={false}
        actions={actions as unknown as import('@components/tables/DataTable').Action<Record<string, unknown>>[]}
        loading={isLoading}
        emptyMessage="Nenhum fabricante encontrado"
        emptyIcon="building"
        onAction={(actionName, row) => {
          if (actionName === 'products') {
            console.log('View products for manufacturer', row);
          }
        }}
      />

      <Modal show={showModal} onHide={handleCloseModal} size="lg" centered scrollable title={editingManufacturer ? 'Editar Fabricante' : 'Novo Fabricante'}>
        <Form onSubmit={handleSubmit} noValidate>
          <Modal.Body className="p-4">
            <div className="row g-3">
              <div className="col-md-6">
                <Form.Label>Nome *</Form.Label>
                <input
                  type="text"
                  className={`form-control ${formErrors.name ? 'is-invalid' : ''}`}
                  value={formData.name}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, name: e.target.value }));
                    if (formErrors.name) setFormErrors((prev) => ({ ...prev, name: '' }));
                  }}
                  placeholder="Nome do fabricante"
                  required
                  aria-invalid={formErrors.name ? 'true' : 'false'}
                />
                {formErrors.name && <div className="invalid-feedback d-block">{formErrors.name}</div>}
              </div>
              <div className="col-md-6">
                <Form.Label>CNPJ</Form.Label>
                <input
                  type="text"
                  className={`form-control ${formErrors.cnpj ? 'is-invalid' : ''}`}
                  value={formData.cnpj}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, cnpj: e.target.value }));
                    if (formErrors.cnpj) setFormErrors((prev) => ({ ...prev, cnpj: '' }));
                  }}
                  placeholder="00.000.000/0000-00"
                  aria-invalid={formErrors.cnpj ? 'true' : 'false'}
                />
                {formErrors.cnpj && <div className="invalid-feedback d-block">{formErrors.cnpj}</div>}
              </div>
              <div className="col-md-6">
                <Form.Label>Nome do Contato</Form.Label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.contactName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, contactName: e.target.value }))}
                  placeholder="Nome do contato comercial"
                />
              </div>
              <div className="col-md-6">
                <Form.Label>E-mail</Form.Label>
                <input
                  type="email"
                  className={`form-control ${formErrors.email ? 'is-invalid' : ''}`}
                  value={formData.email}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, email: e.target.value }));
                    if (formErrors.email) setFormErrors((prev) => ({ ...prev, email: '' }));
                  }}
                  placeholder="contato@fabricante.com"
                  aria-invalid={formErrors.email ? 'true' : 'false'}
                />
                {formErrors.email && <div className="invalid-feedback d-block">{formErrors.email}</div>}
              </div>
              <div className="col-md-6">
                <Form.Label>Telefone</Form.Label>
                <input
                  type="tel"
                  className="form-control"
                  value={formData.phone}
                  onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                  placeholder="(00) 0000-0000"
                />
              </div>
              <div className="col-md-6">
                <Form.Label>CEP</Form.Label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.zipCode}
                  onChange={(e) => setFormData((prev) => ({ ...prev, zipCode: e.target.value }))}
                  placeholder="00000-000"
                />
              </div>
              <div className="col-12">
                <Form.Label>Endereço</Form.Label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.address}
                  onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
                  placeholder="Rua, número, complemento"
                />
              </div>
              <div className="col-md-6">
                <Form.Label>Cidade</Form.Label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.city}
                  onChange={(e) => setFormData((prev) => ({ ...prev, city: e.target.value }))}
                  placeholder="Cidade"
                />
              </div>
              <div className="col-md-6">
                <Form.Label>Estado</Form.Label>
                <select className="form-select" value={formData.state} onChange={(e) => setFormData((prev) => ({ ...prev, state: e.target.value }))}>
                  <option value="">Selecione</option>
                  <option value="AC">AC</option>
                  <option value="AL">AL</option>
                  <option value="AP">AP</option>
                  <option value="AM">AM</option>
                  <option value="BA">BA</option>
                  <option value="CE">CE</option>
                  <option value="DF">DF</option>
                  <option value="ES">ES</option>
                  <option value="GO">GO</option>
                  <option value="MA">MA</option>
                  <option value="MT">MT</option>
                  <option value="MS">MS</option>
                  <option value="MG">MG</option>
                  <option value="PA">PA</option>
                  <option value="PB">PB</option>
                  <option value="PR">PR</option>
                  <option value="PE">PE</option>
                  <option value="PI">PI</option>
                  <option value="RJ">RJ</option>
                  <option value="RN">RN</option>
                  <option value="RS">RS</option>
                  <option value="RO">RO</option>
                  <option value="RR">RR</option>
                  <option value="SC">SC</option>
                  <option value="SP">SP</option>
                  <option value="SE">SE</option>
                  <option value="TO">TO</option>
                </select>
              </div>
              <div className="col-12">
                <div className="form-check form-switch">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="active-mfg"
                    checked={formData.active}
                    onChange={(e) => setFormData((prev) => ({ ...prev, active: e.target.checked }))}
                  />
                  <label className="form-check-label" htmlFor="active-mfg">Fabricante ativo</label>
                </div>
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal} disabled={isCreating || isUpdating}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit" disabled={isCreating || isUpdating}>
              {isCreating || isUpdating ? (
                <>
                  <Spinner as="span" size="sm" className="me-1" aria-hidden="true" />
                  Salvando...
                </>
              ) : (
                'Salvar'
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <Modal
        show={!!deletingManufacturer}
        onHide={() => setDeletingManufacturer(null)}
        size="sm"
        centered
        title="Confirmar exclusão"
        confirmText="Excluir"
        confirmVariant="danger"
        loading={isDeleting}
      >
        <div className="text-center">
          <Trash2 className="text-danger mb-3" size={48} aria-hidden="true" />
          <h5>Excluir fabricante?</h5>
          <p className="text-muted">
            Tem certeza que deseja excluir <strong>{deletingManufacturer?.name}</strong>?
            Esta ação não pode ser desfeita.
          </p>
          {deletingManufacturer && (deletingManufacturer.productCount ?? 0) > 0 && (
            <Alert variant="warning" className="mt-3">
              <AlertTriangle size={16} className="me-1" aria-hidden="true" />
              Este fabricante possui {deletingManufacturer.productCount ?? 0} produto(s) vinculado(s).
              A exclusão só é permitida quando não há produtos associados.
            </Alert>
          )}
        </div>
      </Modal>
    </div>
  );
}

export default Manufacturers;