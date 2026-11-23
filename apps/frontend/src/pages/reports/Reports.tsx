import { Row, Col, Card, Button, Form, Modal, Badge, Spinner, DropdownButton, Dropdown, Table, Alert } from 'react-bootstrap';
import { useState, useCallback, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  useDashboardStats,
  useSalesReport,
  useStockReport,
  useInventoryValuation,
  useMovementSummary,
  useExportSalesReport,
  useExportStockReport,
  useInventoryReport,
  useExportInventoryReport,
} from '@hooks/useReports';
import inventoryService from '@services/inventory';
import { MovementType } from '@types';
import { useToastManager } from '@components/ui/Toast';
import { cn, formatCurrency, formatNumber, formatDate } from '@utils';
import {
  FileBarChart,
  Calendar,
  Download,
  Upload,
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  Package,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  SlidersHorizontal,
  Layers,
  Search,
  Plus,
} from 'lucide-react';

const REPORT_TYPES = [
  { id: 'sales', label: 'Vendas', icon: DollarSign, color: 'success' },
  { id: 'stock', label: 'Estoque', icon: Package, color: 'primary' },
  { id: 'movements', label: 'Movimentações', icon: FileBarChart, color: 'info' },
  { id: 'valuation', label: 'Valoração', icon: TrendingUp, color: 'warning' },
  { id: 'inventory', label: 'Inventário', icon: AlertTriangle, color: 'danger' },
];

function StatCard({ title, value, icon: Icon, color }: { title: string; value: string | number; icon: any; color: string }) {
  return (
    <Col xs={12} md={6} lg={3}>
      <Card className="h-100 border-0 shadow-sm">
        <Card.Body className="d-flex align-items-center p-3">
          <div className={cn('stat-icon', `bg-${color}-subtle`, `text-${color}`)} style={{ width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon size={24} aria-hidden="true" />
          </div>
          <div className="ms-3">
            <div className="text-muted small">{title}</div>
            <div className="fw-bold fs-5">{value}</div>
          </div>
        </Card.Body>
      </Card>
    </Col>
  );
}

export function Reports() {
  const { success, danger } = useToastManager();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'sales' | 'stock' | 'movements' | 'valuation' | 'inventory'>('dashboard');
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>({
    start: new Date(new Date().setDate(1)),
    end: new Date(),
  });
  const [exportFormat, setExportFormat] = useState<'csv' | 'pdf'>('csv');
  const [showExportModal, setShowExportModal] = useState(false);
  const [exporting, setExporting] = useState(false);

  const statsQuery = useDashboardStats();
  const salesReportQuery = useSalesReport({ startDate: dateRange.start.toISOString().split('T')[0], endDate: dateRange.end.toISOString().split('T')[0] });
  const stockReportQuery = useStockReport();
  const valuationQuery = useInventoryValuation();
  const movementsQuery = useMovementSummary({ startDate: dateRange.start.toISOString().split('T')[0], endDate: dateRange.end.toISOString().split('T')[0] });
  const exportSalesMutation = useExportSalesReport();
  const exportStockMutation = useExportStockReport();

  const stats = statsQuery.data;
  const salesReport = salesReportQuery.data;
  const stockReport = stockReportQuery.data;
  const valuationReport = valuationQuery.data;
  const movementsReport = movementsQuery.data;
  const statsLoading = statsQuery.isLoading || salesReportQuery.isLoading || stockReportQuery.isLoading || valuationQuery.isLoading || movementsQuery.isLoading;

  const handleExport = async () => {
    setExporting(true);
    try {
      if (activeTab === 'sales') {
        await exportSalesMutation.mutateAsync({ query: { startDate: dateRange.start.toISOString().split('T')[0], endDate: dateRange.end.toISOString().split('T')[0] }, format: 'csv' });
      } else if (activeTab === 'stock') {
        await exportStockMutation.mutateAsync('csv');
      }
      success('Sucesso', `Relatório exportado em ${exportFormat.toUpperCase()}`);
      setShowExportModal(false);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao exportar relatório';
      danger('Erro', message);
    } finally {
      setExporting(false);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardTab stats={stats} loading={statsLoading} />;
      case 'sales':
        return <SalesTab report={salesReport} loading={salesReportQuery.isLoading} />;
      case 'stock':
        return <StockTab report={stockReport} loading={stockReportQuery.isLoading} />;
      case 'movements':
        return <MovementsTab report={movementsReport} loading={movementsQuery.isLoading} />;
      case 'valuation':
        return <ValuationTab report={valuationReport} loading={valuationQuery.isLoading} />;
      case 'inventory':
        return <InventoryTab />;
      default:
        return <DashboardTab stats={stats} loading={statsLoading} />;
    }
  };

  return (
    <div className="reports-page">
      <div className="page-header d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h1 className="h2 fw-bold mb-1">Relatórios</h1>
          <p className="text-muted mb-0">Análises e exportações de dados do estoque</p>
        </div>
        <div className="d-flex gap-2">
          <DropdownButton
            variant="outline-secondary"
            title={<><Download size={16} className="me-1" aria-hidden="true" /> Exportar</>}
            id="export-dropdown"
            align="end"
          >
            <Dropdown.Item onClick={() => { setExportFormat('csv'); setShowExportModal(true); }}>CSV</Dropdown.Item>
            <Dropdown.Item onClick={() => { setExportFormat('pdf'); setShowExportModal(true); }}>PDF</Dropdown.Item>
          </DropdownButton>
          <Button variant="outline-secondary" onClick={() => statsQuery.refetch()} disabled={statsLoading}>
            <ArrowUp size={16} className="me-1" aria-hidden="true" /> Atualizar
          </Button>
        </div>
      </div>

      <div className="report-tabs bg-white p-1.5 rounded-pill border shadow-sm d-inline-flex flex-wrap gap-1 mb-4" role="tablist" aria-label="Tipos de relatório">
        {REPORT_TYPES.map((type) => {
          const isActive = activeTab === type.id;
          return (
            <button
              key={type.id}
              type="button"
              onClick={() => setActiveTab(type.id as typeof activeTab)}
              className={cn(
                'btn btn-sm d-inline-flex align-items-center gap-1.5 px-3 py-2 rounded-pill transition-all border-0',
                isActive
                  ? 'bg-primary text-white shadow-sm fw-semibold'
                  : 'bg-transparent text-secondary hover:bg-light fw-medium'
              )}
              role="tab"
              aria-selected={isActive}
              id={`tab-${type.id}`}
              aria-controls={`panel-${type.id}`}
            >
              <type.icon size={16} aria-hidden="true" />
              <span>{type.label}</span>
            </button>
          );
        })}
      </div>

      <div className="date-range-selector mb-4 d-flex flex-wrap gap-3 align-items-center">
        <Form>
          <Row className="g-2 align-items-end">
            <Col xs={12} md="auto">
              <Form.Label className="mb-1">Início</Form.Label>
              <Form.Control
                type="date"
                value={dateRange.start.toISOString().split('T')[0]}
                onChange={(e) => setDateRange((prev) => ({ ...prev, start: new Date(e.target.value) }))}
                max={dateRange.end.toISOString().split('T')[0]}
              />
            </Col>
            <Col xs={12} md="auto">
              <Form.Label className="mb-1">Fim</Form.Label>
              <Form.Control
                type="date"
                value={dateRange.end.toISOString().split('T')[0]}
                onChange={(e) => setDateRange((prev) => ({ ...prev, end: new Date(e.target.value) }))}
                min={dateRange.start.toISOString().split('T')[0]}
                max={new Date().toISOString().split('T')[0]}
              />
            </Col>
          </Row>
        </Form>
      </div>

      {renderTabContent()}

      <Modal show={showExportModal} onHide={() => setShowExportModal(false)} centered title="Exportar Relatório">
        <Modal.Body className="p-4">
          <p className="mb-4">Confirmar exportação do relatório <strong>{REPORT_TYPES.find(t => t.id === activeTab)?.label}</strong> no formato <strong>{exportFormat.toUpperCase()}</strong>?</p>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Formato</Form.Label>
              <Form.Select value={exportFormat} onChange={(e) => setExportFormat(e.target.value as 'csv' | 'pdf')}>
                <option value="csv">CSV</option>
                <option value="pdf">PDF</option>
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowExportModal(false)} disabled={exporting}>Cancelar</Button>
          <Button variant="primary" onClick={handleExport} disabled={exporting}>
            {exporting ? (
              <>
                <Spinner animation="border" size="sm" role="status" aria-hidden="true" />
                <span className="ms-2">Exportando...</span>
              </>
            ) : (
              <>
                <Download size={16} className="me-1" aria-hidden="true" />
                Exportar
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

function DashboardTab({ stats, loading }: { stats: any; loading: boolean }) {
  if (loading) {
    return (
      <div className="d-flex justify-content-center py-5">
        <Spinner animation="border" variant="primary" role="status" aria-label="Carregando" />
      </div>
    );
  }

  return (
    <div>
      <Row className="g-3 mb-4">
        <StatCard title="Vendas Hoje" value={formatCurrency(stats?.vendasHoje || 0)} icon={DollarSign} color="success" />
        <StatCard title="Estoque Baixo" value={stats?.estoqueBaixo || 0} icon={AlertTriangle} color="warning" />
        <StatCard title="Produtos Críticos" value={stats?.produtosCriticos || 0} icon={Package} color="danger" />
        <StatCard title="Valor Total Estoque" value={formatCurrency(stats?.valorTotalEstoque || 0)} icon={TrendingUp} color="primary" />
      </Row>
      <Card className="mt-4">
        <Card.Header className="fw-bold">Últimas Movimentações</Card.Header>
        <Card.Body>
          {stats?.ultimasMovimentacoes?.length > 0 ? (
            <Table responsive className="mb-0">
              <thead>
                <tr>
                  <th>Produto</th>
                  <th>Tipo</th>
                  <th>Quantidade</th>
                  <th>Data</th>
                </tr>
              </thead>
              <tbody>
                {stats.ultimasMovimentacoes.slice(0, 5).map((mov: any, idx: number) => (
                  <tr key={idx}>
                    <td>{mov.produto}</td>
                    <td><Badge bg={mov.tipo === 'entrada' ? 'success' : 'danger'}>{mov.tipo}</Badge></td>
                    <td>{mov.quantidade}</td>
                    <td>{formatDate(mov.data)}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <p className="text-muted text-center py-4 mb-0">Nenhuma movimentação recente</p>
          )}
        </Card.Body>
      </Card>
    </div>
  );
}

function SalesTab({ report, loading }: { report: any; loading: boolean }) {
  if (loading) {
    return (
      <div className="d-flex justify-content-center py-5">
        <Spinner animation="border" variant="primary" role="status" aria-label="Carregando" />
      </div>
    );
  }

  return (
    <div>
      <Row className="g-3 mb-4">
        <StatCard title="Total Vendas" value={formatCurrency(report?.totalVendas || 0)} icon={DollarSign} color="success" />
        <StatCard title="Pedidos" value={report?.totalPedidos || 0} icon={Package} color="primary" />
        <StatCard title="Ticket Médio" value={formatCurrency(report?.ticketMedio || 0)} icon={TrendingUp} color="info" />
      </Row>
      <Card className="mt-4">
        <Card.Header className="fw-bold">Top Produtos Vendidos</Card.Header>
        <Card.Body>
          {report?.topProdutos?.length > 0 ? (
            <Table responsive className="mb-0">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Produto</th>
                  <th>Quantidade</th>
                  <th>Receita</th>
                </tr>
              </thead>
              <tbody>
                {report.topProdutos.slice(0, 10).map((prod: any, idx: number) => (
                  <tr key={idx}>
                    <td>{idx + 1}</td>
                    <td>{prod.nome}</td>
                    <td>{prod.quantidade}</td>
                    <td>{formatCurrency(prod.receita)}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <p className="text-muted text-center py-4 mb-0">Nenhum dado de vendas no período</p>
          )}
        </Card.Body>
      </Card>
    </div>
  );
}

function StockTab({ report, loading }: { report: any; loading: boolean }) {
  if (loading) {
    return (
      <div className="d-flex justify-content-center py-5">
        <Spinner animation="border" variant="primary" role="status" aria-label="Carregando" />
      </div>
    );
  }

  return (
    <div>
      <Row className="g-3 mb-4">
        <StatCard title="Total Produtos" value={report?.totalProdutos || 0} icon={Package} color="primary" />
        <StatCard title="Estoque Baixo" value={report?.estoqueBaixo || 0} icon={AlertTriangle} color="warning" />
        <StatCard title="Produtos Esgotados" value={report?.esgotados || 0} icon={AlertTriangle} color="danger" />
        <StatCard title="Valor Estoque" value={formatCurrency(report?.valorTotal || 0)} icon={DollarSign} color="success" />
      </Row>
      <Card className="mt-4">
        <Card.Header className="fw-bold">Produtos com Estoque Baixo</Card.Header>
        <Card.Body>
          {report?.produtosBaixoEstoque?.length > 0 ? (
            <Table responsive className="mb-0">
              <thead>
                <tr>
                  <th>Produto</th>
                  <th>Estoque Atual</th>
                  <th>Estoque Mínimo</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {report.produtosBaixoEstoque.slice(0, 10).map((prod: any, idx: number) => (
                  <tr key={idx}>
                    <td>{prod.nome}</td>
                    <td>{prod.estoqueAtual}</td>
                    <td>{prod.estoqueMinimo}</td>
                    <td><Badge bg={prod.estoqueAtual === 0 ? 'danger' : 'warning'}>{prod.estoqueAtual === 0 ? 'Esgotado' : 'Baixo'}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <p className="text-muted text-center py-4 mb-0">Nenhum produto com estoque baixo</p>
          )}
        </Card.Body>
      </Card>
    </div>
  );
}

function MovementsTab({ report, loading }: { report: any; loading: boolean }) {
  if (loading) {
    return (
      <div className="d-flex justify-content-center py-5">
        <Spinner animation="border" variant="primary" role="status" aria-label="Carregando" />
      </div>
    );
  }

  return (
    <div>
      <Row className="g-3 mb-4">
        <StatCard title="Total Movimentações" value={report?.totalMovimentacoes || 0} icon={FileBarChart} color="primary" />
        <StatCard title="Entradas" value={report?.entradas || 0} icon={ArrowUp} color="success" />
        <StatCard title="Saídas" value={report?.saidas || 0} icon={ArrowDown} color="danger" />
        <StatCard title="Valor Total" value={formatCurrency(report?.valorTotal || 0)} icon={DollarSign} color="info" />
      </Row>
      <Card className="mt-4">
        <Card.Header className="fw-bold">Movimentações Recentes</Card.Header>
        <Card.Body>
          {report?.movimentacoes?.length > 0 ? (
            <Table responsive className="mb-0">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Produto</th>
                  <th>Tipo</th>
                  <th>Quantidade</th>
                  <th>Origem/Destino</th>
                </tr>
              </thead>
              <tbody>
                {report.movimentacoes.slice(0, 10).map((mov: any, idx: number) => (
                  <tr key={idx}>
                    <td>{formatDate(mov.data)}</td>
                    <td>{mov.produto}</td>
                    <td><Badge bg={mov.tipo === 'entrada' ? 'success' : 'danger'}>{mov.tipo}</Badge></td>
                    <td>{mov.quantidade}</td>
                    <td>{mov.origemDestino}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <p className="text-muted text-center py-4 mb-0">Nenhuma movimentação no período</p>
          )}
        </Card.Body>
      </Card>
    </div>
  );
}

function ValuationTab({ report, loading }: { report: any; loading: boolean }) {
  if (loading) {
    return (
      <div className="d-flex justify-content-center py-5">
        <Spinner animation="border" variant="primary" role="status" aria-label="Carregando" />
      </div>
    );
  }

  return (
    <div>
      <Row className="g-3 mb-4">
        <StatCard title="Valor Total Estoque" value={formatCurrency(report?.valorTotal || 0)} icon={DollarSign} color="success" />
        <StatCard title="Produtos Avaliados" value={report?.totalProdutos || 0} icon={Package} color="primary" />
        <StatCard title="Custo Médio" value={formatCurrency(report?.custoMedio || 0)} icon={TrendingUp} color="info" />
        <StatCard title="Margem Potencial" value={formatCurrency(report?.margemPotencial || 0)} icon={DollarSign} color="warning" />
      </Row>
      <Card className="mt-4">
        <Card.Header className="fw-bold">Valoração por Categoria</Card.Header>
        <Card.Body>
          {report?.porCategoria?.length > 0 ? (
            <Table responsive className="mb-0">
              <thead>
                <tr>
                  <th>Categoria</th>
                  <th>Produtos</th>
                  <th>Quantidade Total</th>
                  <th>Valor Total</th>
                </tr>
              </thead>
              <tbody>
                {report.porCategoria.map((cat: any, idx: number) => (
                  <tr key={idx}>
                    <td>{cat.nome}</td>
                    <td>{cat.qtdProdutos}</td>
                    <td>{cat.qtdTotal}</td>
                    <td>{formatCurrency(cat.valorTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <p className="text-muted text-center py-4 mb-0">Nenhum dado de valoração</p>
          )}
        </Card.Body>
      </Card>
    </div>
  );
}

function InventoryTab() {
  const { data, isLoading, refetch } = useInventoryReport();
  const exportMutation = useExportInventoryReport();
  const queryClient = useQueryClient();
  const { success, danger } = useToastManager();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'ok' | 'baixo' | 'zerado'>('all');
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [physicalCount, setPhysicalCount] = useState<number>(0);
  const [adjustNotes, setAdjustNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const summary = data?.summary || {
    totalProducts: 0,
    totalStockUnits: 0,
    totalValuation: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    accuracyPercentage: 100,
  };

  const items = data?.items || [];

  const filteredItems = useMemo(() => {
    return items.filter((item: any) => {
      const matchSearch =
        (item.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.manufacturerName || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === 'all' || item.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [items, searchTerm, statusFilter]);

  const handleOpenAdjust = (product: any) => {
    setSelectedProduct(product);
    setPhysicalCount(product.stock);
    setAdjustNotes(`Inventário físico auditado em ${new Date().toLocaleDateString('pt-BR')}`);
    setShowAdjustModal(true);
  };

  const handleExportCSV = async () => {
    try {
      const blob = await exportMutation.mutateAsync('csv');
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `inventario_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      success('Exportação Concluída', 'Relatório de inventário baixado em CSV com sucesso');
    } catch {
      danger('Erro', 'Falha ao exportar relatório de inventário');
    }
  };

  const handleConfirmAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    const diff = physicalCount - selectedProduct.stock;
    if (diff === 0) {
      success('Estoque Conferido', 'Nenhuma divergência encontrada. O estoque já está acurado.');
      setShowAdjustModal(false);
      return;
    }

    setIsSubmitting(true);
    try {
      const movementType = diff > 0 ? MovementType.ENTRY : MovementType.EXIT;
      const quantity = Math.abs(diff);

      await inventoryService.createMovement({
        productId: selectedProduct.id,
        type: movementType,
        quantity,
        notes: adjustNotes || `Ajuste de inventário físico: ${diff > 0 ? 'sobra' : 'falta'} de ${quantity} un`,
      });

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['reports'] }),
        queryClient.invalidateQueries({ queryKey: ['products'] }),
      ]);

      success(
        'Ajuste Registrado',
        `Movimentação de ${movementType === MovementType.ENTRY ? 'entrada' : 'saída'} de ${quantity} un aplicada com sucesso.`
      );
      setShowAdjustModal(false);
      refetch();
    } catch (err: any) {
      danger('Erro no Ajuste', err?.message || 'Falha ao salvar ajuste de inventário');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2 text-muted">Carregando relatório de inventário...</p>
      </div>
    );
  }

  const divergence = selectedProduct ? physicalCount - selectedProduct.stock : 0;

  return (
    <div className="inventory-report-tab">
      {/* KPI Cards */}
      <Row className="g-3 mb-4">
        <StatCard title="Total de Itens" value={formatNumber(summary.totalProducts)} icon={Package} color="primary" />
        <StatCard title="Unidades em Estoque" value={formatNumber(summary.totalStockUnits)} icon={Layers} color="info" />
        <StatCard title="Valoração Estimada" value={formatCurrency(summary.totalValuation)} icon={DollarSign} color="success" />
        <Col xs={12} md={6} lg={3}>
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body className="d-flex align-items-center p-3">
              <div
                className="stat-icon bg-success-subtle text-success"
                style={{ width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <CheckCircle2 size={24} aria-hidden="true" />
              </div>
              <div className="ms-3 flex-1">
                <div className="text-muted small">Acurácia de Estoque</div>
                <div className="d-flex align-items-center gap-2">
                  <span className="fw-bold fs-5">{summary.accuracyPercentage}%</span>
                  {summary.outOfStockCount > 0 && (
                    <Badge bg="danger-subtle" className="text-danger border border-danger-subtle">
                      {summary.outOfStockCount} zerados
                    </Badge>
                  )}
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Filter and Action Bar */}
      <Card className="shadow-sm border-0 rounded-3 mb-4">
        <Card.Body className="p-3">
          <Row className="g-3 align-items-center justify-content-between">
            <Col xs={12} md={5}>
              <div className="position-relative">
                <Search size={16} className="position-absolute start-0 top-50 translate-middle-y ms-3 text-muted" />
                <Form.Control
                  type="search"
                  placeholder="Buscar por produto ou fabricante..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="ps-5 rounded-3"
                />
              </div>
            </Col>
            <Col xs={12} sm={6} md={3}>
              <Form.Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="rounded-3"
                aria-label="Filtrar por status"
              >
                <option value="all">Todos os Status ({items.length})</option>
                <option value="ok">Estoque Normal</option>
                <option value="baixo">Estoque Baixo ({summary.lowStockCount})</option>
                <option value="zerado">Esgotado / Ruptura ({summary.outOfStockCount})</option>
              </Form.Select>
            </Col>
            <Col xs={12} sm={6} md={4} className="d-flex justify-content-end gap-2">
              <Button variant="outline-secondary" onClick={handleExportCSV} className="d-flex align-items-center gap-1.5 shadow-sm">
                <Download size={16} />
                <span>Exportar CSV</span>
              </Button>
              <Button
                variant="primary"
                onClick={() => items.length > 0 && handleOpenAdjust(items[0])}
                className="d-flex align-items-center gap-1.5 shadow-sm"
              >
                <Plus size={16} />
                <span>Nova Contagem</span>
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Inventory Table */}
      <Card className="border-0 shadow-sm rounded-3 overflow-hidden">
        <Card.Header className="bg-white border-bottom p-3 d-flex justify-content-between align-items-center">
          <div>
            <h6 className="mb-0 fw-bold">Posição Físico-Financeira do Inventário</h6>
            <small className="text-muted">Exibindo {filteredItems.length} de {items.length} produtos registrados</small>
          </div>
          <Badge bg="light" className="text-dark border">
            {summary.lowStockCount + summary.outOfStockCount} itens requerem atenção
          </Badge>
        </Card.Header>
        <div
          tabIndex={0}
          role="region"
          aria-label="Tabela de inventário físico"
          className="table-responsive table-wrapper table-sticky-header"
        >
          <Table hover className="mb-0 align-middle">
            <thead className="bg-light">
              <tr>
                <th style={{ width: '40px' }}>#</th>
                <th>Produto</th>
                <th>Fabricante</th>
                <th className="text-center">Estoque Atual</th>
                <th className="text-center">Estoque Mínimo</th>
                <th className="text-end">Valor Unitário</th>
                <th className="text-end">Valoração Total</th>
                <th className="text-center">Status</th>
                <th className="text-end">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-5 text-muted">
                    <Package size={36} className="opacity-50 mb-2" />
                    <div>Nenhum produto encontrado com os filtros aplicados.</div>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item: any, idx: number) => {
                  let statusBadge = <Badge bg="success-subtle" className="text-success border border-success-subtle">Normal</Badge>;
                  if (item.status === 'zerado') {
                    statusBadge = <Badge bg="danger-subtle" className="text-danger border border-danger-subtle">Esgotado</Badge>;
                  } else if (item.status === 'baixo') {
                    statusBadge = <Badge bg="warning-subtle" className="text-warning-emphasis border border-warning-subtle">Baixo</Badge>;
                  }

                  return (
                    <tr key={item.id} className={item.status === 'zerado' ? 'table-danger-subtle' : ''}>
                      <td className="text-muted small">{idx + 1}</td>
                      <td>
                        <div className="fw-semibold text-dark">{item.name}</div>
                        <small className="text-muted font-monospace">{item.id.slice(0, 8)}</small>
                      </td>
                      <td>
                        <span className="badge bg-light text-secondary border">
                          {item.manufacturerName}
                        </span>
                      </td>
                      <td className="text-center">
                        <span className={cn('fw-bold fs-6', item.stock === 0 ? 'text-danger' : item.stock <= item.minStock ? 'text-warning-emphasis' : 'text-dark')}>
                          {formatNumber(item.stock)}
                        </span>
                      </td>
                      <td className="text-center text-muted">
                        {formatNumber(item.minStock)}
                      </td>
                      <td className="text-end">
                        {formatCurrency(item.estimatedUnitPrice)}
                      </td>
                      <td className="text-end fw-semibold text-dark">
                        {formatCurrency(item.totalValuation)}
                      </td>
                      <td className="text-center">
                        {statusBadge}
                      </td>
                      <td className="text-end">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          className="rounded-2 d-inline-flex align-items-center gap-1"
                          onClick={() => handleOpenAdjust(item)}
                          title="Conferir ou ajustar estoque"
                        >
                          <SlidersHorizontal size={14} />
                          <span>Ajustar</span>
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </Table>
        </div>
      </Card>

      {/* Modal de Ajuste de Inventário */}
      <Modal show={showAdjustModal} onHide={() => !isSubmitting && setShowAdjustModal(false)} centered>
        <Modal.Header closeButton={!isSubmitting} className="border-bottom">
          <Modal.Title className="fs-5 fw-bold d-flex align-items-center gap-2">
            <SlidersHorizontal size={20} className="text-primary" />
            <span>Auditoria e Ajuste de Estoque</span>
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleConfirmAdjust}>
          <Modal.Body className="p-4">
            {selectedProduct && (
              <>
                <div className="p-3 bg-light rounded-3 mb-3 border">
                  <div className="text-muted small">Produto Selecionado</div>
                  <div className="fw-bold fs-6 text-dark">{selectedProduct.name}</div>
                  <div className="d-flex align-items-center gap-3 mt-2 text-muted small">
                    <span>Fabricante: <strong>{selectedProduct.manufacturerName}</strong></span>
                    <span>Estoque Atual no Sistema: <strong>{selectedProduct.stock} un</strong></span>
                  </div>
                </div>

                <div className="mb-3">
                  <Form.Label className="fw-semibold">
                    Contagem Física Real (Estoque Auditado) <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    step="1"
                    value={physicalCount}
                    onChange={(e) => setPhysicalCount(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    required
                    className="form-control-lg fs-5 fw-bold"
                  />
                  <Form.Text className="text-muted">
                    Informe a quantidade real contada fisicamente na prateleira ou depósito.
                  </Form.Text>
                </div>

                {/* Calculation Feedback */}
                <div className="p-3 rounded-3 mb-3 border bg-white">
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="text-muted small">Divergência Calculada:</span>
                    <span className={cn('fw-bold fs-6', divergence > 0 ? 'text-primary' : divergence < 0 ? 'text-danger' : 'text-success')}>
                      {divergence > 0 ? `+${divergence} un (Sobra)` : divergence < 0 ? `${divergence} un (Falta)` : '0 un (Acurado)'}
                    </span>
                  </div>
                  {divergence !== 0 && (
                    <div className="small text-muted mt-1">
                      {divergence > 0 ? (
                        <span className="text-primary d-flex align-items-center gap-1">
                          <ArrowUp size={14} /> Será gerada uma movimentação de <strong>ENTRADA</strong> de {Math.abs(divergence)} unidades.
                        </span>
                      ) : (
                        <span className="text-danger d-flex align-items-center gap-1">
                          <ArrowDown size={14} /> Será gerada uma movimentação de <strong>SAÍDA</strong> de {Math.abs(divergence)} unidades.
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="mb-2">
                  <Form.Label className="fw-semibold">Justificativa / Observação</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    value={adjustNotes}
                    onChange={(e) => setAdjustNotes(e.target.value)}
                    placeholder="Ex: Auditoria periódica de inventário..."
                  />
                </div>
              </>
            )}
          </Modal.Body>
          <Modal.Footer className="border-top">
            <Button variant="outline-secondary" onClick={() => setShowAdjustModal(false)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit" disabled={isSubmitting} className="d-flex align-items-center gap-1.5 shadow-sm">
              {isSubmitting ? (
                <>
                  <Spinner size="sm" animation="border" />
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  <span>Confirmar Ajuste</span>
                </>
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}

export default Reports;