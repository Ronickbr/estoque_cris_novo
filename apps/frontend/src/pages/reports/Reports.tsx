import { Row, Col, Card, Button, Form, Modal, Badge, Spinner, DropdownButton, Dropdown, Table, Alert } from 'react-bootstrap';
import { useState, useCallback } from 'react';
import { useDashboardStats, useSalesReport, useStockReport, useInventoryValuation, useMovementSummary, useExportSalesReport, useExportStockReport } from '@hooks/useReports';
import { useToastManager } from '@components/ui/Toast';
import { cn, formatCurrency, formatNumber, formatDate } from '@utils';
import {
  FileBarChart, Calendar, Download, Upload, ChevronLeft, ChevronRight, ArrowUp, ArrowDown, Package, DollarSign, TrendingUp, AlertTriangle,
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
        return <InventoryTab loading={false} />;
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

      <div className="report-tabs mb-4" role="tablist" aria-label="Tipos de relatório">
        {REPORT_TYPES.map((type) => (
          <Button
            key={type.id}
            variant={activeTab === type.id ? 'primary' : 'outline-secondary'}
            onClick={() => setActiveTab(type.id as typeof activeTab)}
            className="me-2"
            role="tab"
            aria-selected={activeTab === type.id}
          >
            <type.icon size={16} className="me-1" aria-hidden="true" />
            {type.label}
          </Button>
        ))}
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

function InventoryTab({ loading }: { loading: boolean }) {
  return (
    <div>
      <Alert variant="info">
        <AlertTriangle size={20} className="me-2" aria-hidden="true" />
        <strong>Inventário:</strong> Funcionalidade de inventário físico será implementada em breve.
      </Alert>
    </div>
  );
}

export default Reports;