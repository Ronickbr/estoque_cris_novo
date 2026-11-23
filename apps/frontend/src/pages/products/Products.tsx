import { Row, Col, Card, Button, Form, InputGroup, Modal, Badge, Spinner, DropdownButton, Dropdown, Alert } from 'react-bootstrap';
import { useState, useCallback } from 'react';
import { useProducts, useCreateProduct, useUpdateProduct, useDeleteProduct, useCategories, useManufacturers } from '@hooks/useProducts';
import DataTable, { Column } from '@components/tables/DataTable';
import { useToastManager } from '@components/ui/Toast';
import { Product, ProductFormData, Category, Manufacturer } from '@types';
import { cn, formatCurrency, formatNumber, getStockStatus, getStockStatusLabel, getStockStatusColor } from '@utils';
import {
  Plus, Search, Filter, ChevronDown, ChevronUp, Edit, Trash2, Eye, Box, Tag, Building, AlertTriangle, FileText,
} from 'lucide-react';

const STOCK_STATUS_LABELS = {
  normal: 'Normal',
  low: 'Baixo',
  critical: 'Crítico',
  out_of_stock: 'Esgotado',
  overstock: 'Excedente',
};

const COLUMNS: Column<Product>[] = [
  { field: 'sku', label: 'Código', type: 'text', width: '120px' },
  { field: 'name', label: 'Produto', type: 'text', minWidth: '200px' },
  { field: 'category?.name', label: 'Categoria', type: 'text', width: '150px' },
  { field: 'manufacturer?.name', label: 'Fabricante', type: 'text', width: '150px' },
  { field: 'currentStock', label: 'Estoque', type: 'custom', width: '120px', sortable: false },
  { field: 'minStock', label: 'Mínimo', type: 'number', width: '90px' },
  { field: 'costPrice', label: 'Custo', type: 'currency', width: '120px' },
  { field: 'unitPrice', label: 'Venda', type: 'currency', width: '120px' },
  { field: 'status', label: 'Status', type: 'custom', width: '110px', sortable: false },
];

export function Products() {
  const productsQuery = useProducts();
  const createProductMutation = useCreateProduct();
  const updateProductMutation = useUpdateProduct();
  const deleteProductMutation = useDeleteProduct();
  const categoriesQuery = useCategories();
  const manufacturersQuery = useManufacturers();

  const { success, danger, warning } = useToastManager();

  const products = Array.isArray(productsQuery.data) ? productsQuery.data : (productsQuery.data?.data || []);
  const categories = Array.isArray(categoriesQuery.data) ? categoriesQuery.data : (categoriesQuery.data?.data || []);
  const manufacturers = Array.isArray(manufacturersQuery.data) ? manufacturersQuery.data : (manufacturersQuery.data?.data || []);

  const isLoading = productsQuery.isLoading;
  const error = productsQuery.isError ? productsQuery.error : null;

  const isCreating = createProductMutation.isPending;
  const isUpdating = updateProductMutation.isPending;
  const isDeleting = deleteProductMutation.isPending;

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'low' | 'critical' | 'out' | 'over'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [manufacturerFilter, setManufacturerFilter] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);

  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    sku: '',
    description: '',
    categoryId: 0,
    manufacturerId: 0,
    costPrice: 0,
    unitPrice: 0,
    minStock: 0,
    maxStock: 0,
    unit: 'UN',
    barcode: '',
    active: true,
  });

  const [formErrors, setFormErrors] = useState<Partial<Record<keyof ProductFormData, string>>>({});

  const filteredProducts = useCallback(() => {
    let result = [...products];

    if (searchTerm) {
      const term = searchTerm.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.sku.toLowerCase().includes(term) ||
          p.barcode?.toLowerCase().includes(term) ||
          p.category?.name.toLowerCase().includes(term) ||
          p.manufacturer?.name.toLowerCase().includes(term)
      );
    }

    if (statusFilter !== 'all') {
      result = result.filter((p) => getStockStatus(p.currentStock, p.minStock) === statusFilter);
    }

    if (categoryFilter) {
      result = result.filter((p) => p.categoryId === parseInt(categoryFilter, 10));
    }

    if (manufacturerFilter) {
      result = result.filter((p) => p.manufacturerId === parseInt(manufacturerFilter, 10));
    }

    return result;
  }, [products, searchTerm, statusFilter, categoryFilter, manufacturerFilter]);

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      sku: '',
      description: '',
      categoryId: 0,
      manufacturerId: 0,
      costPrice: 0,
      unitPrice: 0,
      minStock: 0,
      maxStock: 0,
      unit: 'UN',
      barcode: '',
      active: true,
    });
    setFormErrors({});
    setShowModal(true);
  };

  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      sku: product.sku,
      description: product.description || '',
      categoryId: product.categoryId,
      manufacturerId: product.manufacturerId,
      costPrice: product.costPrice,
      unitPrice: product.unitPrice,
      minStock: product.minStock,
      maxStock: product.maxStock || 0,
      unit: product.unit,
      barcode: product.barcode || '',
      active: product.active,
    });
    setFormErrors({});
    setShowModal(true);
  };

  const handleOpenDelete = (product: Product) => {
    setDeletingProduct(product);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingProduct(null);
    setFormErrors({});
  };

  const validateForm = () => {
    const errors: Partial<Record<keyof ProductFormData, string>> = {};

    if (!formData.name.trim()) errors.name = 'Nome é obrigatório';
    if (!formData.categoryId) errors.categoryId = 'Categoria é obrigatória';
    if (!formData.manufacturerId) errors.manufacturerId = 'Fabricante é obrigatório';
    if (formData.costPrice < 0) errors.costPrice = 'Preço de custo não pode ser negativo';
    if (formData.unitPrice < 0) errors.unitPrice = 'Preço de venda não pode ser negativo';
    if (formData.minStock < 0) errors.minStock = 'Estoque mínimo não pode ser negativo';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      if (editingProduct) {
        await updateProductMutation.mutateAsync({ id: editingProduct.id, data: formData });
        success('Sucesso', 'Produto atualizado com sucesso');
      } else {
        await createProductMutation.mutateAsync(formData);
        success('Sucesso', 'Produto criado com sucesso');
      }
      handleCloseModal();
      productsQuery.refetch();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao salvar produto';
      danger('Erro', message);
    }
  };

  const handleDelete = async () => {
    if (!deletingProduct) return;
    try {
      await deleteProductMutation.mutateAsync(deletingProduct.id);
      success('Sucesso', 'Produto excluído com sucesso');
      setDeletingProduct(null);
      productsQuery.refetch();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao excluir produto';
      danger('Erro', message);
      setDeletingProduct(null);
    }
  };

  const renderStockCell = (value: unknown, row: Record<string, unknown>) => {
    const status = getStockStatus((row as unknown as Product).currentStock, (row as unknown as Product).minStock);
    const label = getStockStatusLabel(status);
    const color = getStockStatusColor(status);

    return (
      <div className="d-flex align-items-center gap-2">
        <span className={cn('fw-bold', color === 'danger' && 'text-danger', color === 'warning' && 'text-warning')}>
          {(row as unknown as Product).currentStock}
        </span>
        <Badge bg={color} className="text-capitalize">{label}</Badge>
      </div>
    );
  };

  const renderStatusCell = (value: unknown, row: Record<string, unknown>) => {
    return (
      <Badge className={cn('fw-medium', (row as unknown as Product).active ? 'bg-success' : 'bg-secondary')}>
        {(row as unknown as Product).active ? 'Ativo' : 'Inativo'}
      </Badge>
    );
  };


  const actions = [
    {
      name: 'view',
      label: 'Ver detalhes',
      icon: <Eye size={16} />,
      variant: 'ghost' as const,
      handler: (row: Product) => console.log('view', row),
    },
    {
      name: 'edit',
      label: 'Editar',
      icon: <Edit size={16} />,
      variant: 'ghost' as const,
      handler: handleOpenEdit,
    },
    {
      name: 'delete',
      label: 'Excluir',
      icon: <Trash2 size={16} />,
      variant: 'ghost' as const,
      className: 'text-danger',
      handler: handleOpenDelete,
    },
  ];

  const renderCategoryOptions = categories.map((cat: Category) => (
    <option key={cat.id} value={cat.id}>{cat.name}</option>
  ));

  const renderManufacturerOptions = manufacturers.map((mfg: Manufacturer) => (
    <option key={mfg.id} value={mfg.id}>{mfg.name}</option>
  ));

  return (
    <div className="p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-1">Produtos</h1>
          <p className="text-muted mb-0">Gerencie o catálogo de produtos do estoque</p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus size={16} className="me-1" aria-hidden="true" /> Novo Produto
        </Button>
      </div>

      {error && (
        <Alert variant="danger" className="mb-4" onClose={() => productsQuery.refetch()} dismissible>
          Erro ao carregar produtos: {(error as Error).message}
        </Alert>
      )}

      <Card className="mb-4">
        <Card.Body>
          <Form className="row g-3 align-items-end">
            <div className="col-md-4">
              <Form.Label>Buscar</Form.Label>
              <InputGroup>
                <InputGroup.Text><Search size={16} className="text-muted" aria-hidden="true" /></InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Nome, código, barras, categoria, fabricante..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </div>

            <div className="col-md-2">
              <Form.Label>Status</Form.Label>
              <Form.Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              >
                <option value="all">Todos</option>
                <option value="normal">Normal</option>
                <option value="low">Estoque Baixo</option>
                <option value="critical">Crítico</option>
                <option value="out">Esgotado</option>
                <option value="over">Excedente</option>
              </Form.Select>
            </div>

            <div className="col-md-2">
              <Form.Label>Categoria</Form.Label>
              <Form.Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                <option value="">Todas</option>
                {renderCategoryOptions}
              </Form.Select>
            </div>

            <div className="col-md-2">
              <Form.Label>Fabricante</Form.Label>
              <Form.Select value={manufacturerFilter} onChange={(e) => setManufacturerFilter(e.target.value)}>
                <option value="">Todos</option>
                {renderManufacturerOptions}
              </Form.Select>
            </div>

            <div className="col-md-2 d-flex">
              <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="w-100">
                <Filter size={16} className="me-1" aria-hidden="true" /> Filtros
              </Button>
            </div>
          </Form>

          {showFilters && (
            <div className="mt-3 pt-3 border-top">
              <Button variant="outline" size="sm" onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setCategoryFilter('');
                setManufacturerFilter('');
              }}>
                Limpar Filtros
              </Button>
            </div>
          )}
        </Card.Body>
      </Card>

      <DataTable
        columns={COLUMNS.map((col) => ({
          ...col,
          render:
            col.field === 'currentStock' ? renderStockCell :
            col.field === 'status' ? renderStatusCell :
            undefined,
        }))}
        data={filteredProducts() as unknown as Record<string, unknown>[]}
        keyField="id"
        pagination
        pageSize={15}
        pageSizes={[10, 15, 25, 50]}
        searchable={false}
        actions={actions as unknown as import('@components/tables/DataTable').Action<Record<string, unknown>>[]}
        loading={isLoading}
        emptyMessage="Nenhum produto encontrado"
        emptyIcon="box"
      />

      <Modal show={showModal} onHide={handleCloseModal} size="xl" centered scrollable title={editingProduct ? 'Editar Produto' : 'Novo Produto'}>
        <Form onSubmit={handleSubmit} noValidate>
          <Modal.Body className="p-4">
            <div className="row g-3">
              <div className="col-md-6">
                <Form.Label>Nome *</Form.Label>
                <input
                  type="text"
                  className={`form-control ${formErrors.name ? 'is-invalid' : ''}`}
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  maxLength={255}
                  required
                />
                {formErrors.name && <div className="invalid-feedback">{formErrors.name}</div>}
              </div>

              <div className="col-md-4">
                <Form.Label>Código (SKU)</Form.Label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.sku}
                  onChange={(e) => setFormData((prev) => ({ ...prev, sku: e.target.value }))}
                  maxLength={50}
                />
              </div>

              <div className="col-md-2">
                <Form.Label>Unidade</Form.Label>
                <select
                  className="form-select"
                  value={formData.unit}
                  onChange={(e) => setFormData((prev) => ({ ...prev, unit: e.target.value }))}
                >
                  <option value="UN">UN</option>
                  <option value="KG">KG</option>
                  <option value="L">L</option>
                  <option value="M">M</option>
                  <option value="M2">M²</option>
                  <option value="M3">M³</option>
                  <option value="CX">CX</option>
                  <option value="PC">PC</option>
                  <option value="PAR">PAR</option>
                </select>
              </div>

              <div className="col-12">
                <Form.Label>Descrição</Form.Label>
                <textarea
                  className="form-control"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  maxLength={1000}
                />
              </div>

              <div className="col-md-6">
                <Form.Label>Categoria *</Form.Label>
                <select
                  className={`form-select ${formErrors.categoryId ? 'is-invalid' : ''}`}
                  value={formData.categoryId}
                  onChange={(e) => setFormData((prev) => ({ ...prev, categoryId: parseInt(e.target.value, 10) || 0 }))}
                  required
                >
                  <option value="">Selecione...</option>
                  {renderCategoryOptions}
                </select>
                {formErrors.categoryId && <div className="invalid-feedback">{formErrors.categoryId}</div>}
              </div>

              <div className="col-md-6">
                <Form.Label>Fabricante *</Form.Label>
                <select
                  className={`form-select ${formErrors.manufacturerId ? 'is-invalid' : ''}`}
                  value={formData.manufacturerId}
                  onChange={(e) => setFormData((prev) => ({ ...prev, manufacturerId: parseInt(e.target.value, 10) || 0 }))}
                  required
                >
                  <option value="">Selecione...</option>
                  {renderManufacturerOptions}
                </select>
                {formErrors.manufacturerId && <div className="invalid-feedback">{formErrors.manufacturerId}</div>}
              </div>

              <div className="col-md-4">
                <Form.Label>Preço de Custo *</Form.Label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className={`form-control ${formErrors.costPrice ? 'is-invalid' : ''}`}
                  value={formData.costPrice}
                  onChange={(e) => setFormData((prev) => ({ ...prev, costPrice: parseFloat(e.target.value) || 0 }))}
                  required
                />
                {formErrors.costPrice && <div className="invalid-feedback">{formErrors.costPrice}</div>}
              </div>

              <div className="col-md-4">
                <Form.Label>Preço de Venda *</Form.Label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className={`form-control ${formErrors.unitPrice ? 'is-invalid' : ''}`}
                  value={formData.unitPrice}
                  onChange={(e) => setFormData((prev) => ({ ...prev, unitPrice: parseFloat(e.target.value) || 0 }))}
                  required
                />
                {formErrors.unitPrice && <div className="invalid-feedback">{formErrors.unitPrice}</div>}
              </div>

              <div className="col-md-4">
                <Form.Label>Estoque Mínimo *</Form.Label>
                <input
                  type="number"
                  min="0"
                  className={`form-control ${formErrors.minStock ? 'is-invalid' : ''}`}
                  value={formData.minStock}
                  onChange={(e) => setFormData((prev) => ({ ...prev, minStock: parseInt(e.target.value, 10) || 0 }))}
                  required
                />
                {formErrors.minStock && <div className="invalid-feedback">{formErrors.minStock}</div>}
              </div>

              <div className="col-md-4">
                <Form.Label>Estoque Máximo</Form.Label>
                <input
                  type="number"
                  min="0"
                  className="form-control"
                  value={formData.maxStock}
                  onChange={(e) => setFormData((prev) => ({ ...prev, maxStock: parseInt(e.target.value, 10) || 0 }))}
                />
              </div>

              <div className="col-md-6">
                <Form.Label>Código de Barras</Form.Label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.barcode}
                  onChange={(e) => setFormData((prev) => ({ ...prev, barcode: e.target.value }))}
                  maxLength={100}
                />
              </div>

              <div className="col-md-6">
                <Form.Label>Status</Form.Label>
                <div className="form-check form-switch mt-3">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    role="switch"
                    checked={formData.active}
                    onChange={(e) => setFormData((prev) => ({ ...prev, active: e.target.checked }))}
                    id="activeSwitch"
                  />
                  <label className="form-check-label" htmlFor="activeSwitch">Ativo</label>
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
                  <Spinner animation="border" size="sm" role="status" aria-hidden="true" />
                  <span className="ms-2">Salvando...</span>
                </>
              ) : (
                'Salvar'
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      <Modal show={!!deletingProduct} onHide={() => setDeletingProduct(null)} centered title="Confirmar Exclusão">
        <Modal.Body className="p-4">
          <p className="text-muted">
            Tem certeza que deseja excluir <strong>{deletingProduct?.name}</strong>?
            Esta ação não pode ser desfeita.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setDeletingProduct(null)} disabled={isDeleting}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? (
              <>
                <Spinner animation="border" size="sm" role="status" aria-hidden="true" />
                <span className="ms-2">Excluindo...</span>
              </>
            ) : (
              'Excluir'
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default Products;