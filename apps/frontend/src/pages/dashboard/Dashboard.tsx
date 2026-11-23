import { Row, Col, Card, Badge, Button, DropdownButton, Dropdown } from 'react-bootstrap';
import { useDashboardStats } from '@hooks/useReports';
import { SummaryCard, SummaryCardGrid } from '@components/feedback/SummaryCard';
import { StockIndicator } from '@components/feedback/StockIndicator';
import { cn, formatCurrency, formatNumber, formatDate } from '@utils';
import {
  Box,
  Building,
  ArrowLeftRight,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Package,
  Activity,
} from 'lucide-react';

export function Dashboard() {
  const { data: stats, isLoading, error, refetch } = useDashboardStats();

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <span className="visually-hidden">Carregando dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-5">
        <div className="text-danger mb-3" aria-hidden="true">
          <AlertTriangle size={48} />
        </div>
        <h4>Erro ao carregar dashboard</h4>
        <p className="text-muted">{error instanceof Error ? error.message : String(error)}</p>
        <Button variant="primary" onClick={() => refetch()}>Tentar novamente</Button>
      </div>
    );
  }

  const statsData = stats || {
    vendasHoje: 0,
    vendasSemana: 0,
    vendasMes: 0,
    diaMaisVendas: null,
    produtosHoje: [],
    produtosSemana: [],
    produtosMes: [],
    estoqueBaixo: [],
  };

  const totalLowStockProducts = statsData.estoqueBaixo.reduce((sum, m) => sum + m.products.length, 0);
  const totalOutOfStockProducts = statsData.estoqueBaixo.reduce(
    (sum, m) => sum + m.products.filter(p => p.stock === 0).length,
    0
  );

  const summaryCards = [
    {
      value: statsData.vendasHoje,
      label: 'Vendas Hoje',
      icon: 'sales' as const,
      variant: 'primary' as const,
      suffix: 'unid',
    },
    {
      value: statsData.vendasSemana,
      label: 'Vendas na Semana',
      icon: 'sales' as const,
      variant: 'info' as const,
      suffix: 'unid',
    },
    {
      value: statsData.vendasMes,
      label: 'Vendas no Mês',
      icon: 'sales' as const,
      variant: 'success' as const,
      suffix: 'unid',
    },
    {
      value: totalLowStockProducts + totalOutOfStockProducts,
      label: 'Alertas de Estoque',
      icon: 'alerts' as const,
      variant: 'danger' as const,
      suffix: 'produtos',
      href: '/products?filter=low-stock',
    },
  ];

  const recentProducts = statsData.produtosHoje.slice(0, 5);
  const lowStockItems = statsData.estoqueBaixo.flatMap(m => m.products).slice(0, 8);

  return (
    <div className="dashboard">
      <div className="dashboard__header d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h1 className="h2 fw-bold mb-1">Dashboard</h1>
          <p className="text-muted mb-0">Visão geral do seu estoque</p>
        </div>
        <div className="d-flex gap-2">
          <Button variant="outline-primary" onClick={() => refetch()} disabled={isLoading} aria-label="Atualizar dados">
            <Activity size={16} className={isLoading ? 'animate-spin' : ''} aria-hidden="true" />
            <span className="ms-1 d-none d-sm-inline">Atualizar</span>
          </Button>
        </div>
      </div>

      <SummaryCardGrid cards={summaryCards} gap="md" />

      <Row className="g-4 mt-4">
        <Col lg={8} className="d-flex flex-column">
          <Card className="h-100 shadow-sm border-0">
            <Card.Header className="bg-white border-0 pb-0">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0 fw-semibold">Produtos Mais Vendidos (Hoje)</h5>
              </div>
            </Card.Header>
            <Card.Body className="p-0">
              {recentProducts.length === 0 ? (
                <div className="empty-state text-center py-5">
                  <Package className="text-muted" size={48} aria-hidden="true" />
                  <h6 className="mt-3 text-muted">Nenhuma venda hoje</h6>
                  <p className="text-muted small">As vendas aparecerão aqui</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead className="table-light">
                      <tr>
                        <th scope="col" className="ps-3">Produto</th>
                        <th scope="col">Quantidade</th>
                        <th scope="col">Receita</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentProducts.map((product) => (
                        <tr key={product.id}>
                          <td className="ps-3">
                            <div className="fw-medium">{product.name}</div>
                          </td>
                          <td>
                            <span className="fw-medium text-success">+{formatNumber(product.total)}</span>
                          </td>
                          <td className="pe-3 text-end fw-medium">{formatCurrency(product.revenue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card.Body>
            <Card.Footer className="bg-white border-0 pt-0">
              <Button variant="ghost" size="sm" href="/reports" className="w-100">
                Ver relatório completo de vendas
                <ArrowLeftRight size={14} className="ms-1" aria-hidden="true" />
              </Button>
            </Card.Footer>
          </Card>
        </Col>

        <Col lg={4} className="d-flex flex-column">
          <Card className="h-100 shadow-sm border-0">
            <Card.Header className="bg-white border-0 pb-0">
              <h5 className="mb-0 fw-semibold">Produtos com Estoque Baixo</h5>
            </Card.Header>
            <Card.Body className="p-0">
              {lowStockItems.length === 0 ? (
                <div className="empty-state text-center py-5">
                  <Activity className="text-success" size={48} aria-hidden="true" />
                  <h6 className="mt-3 text-success">Todos os produtos estão ok!</h6>
                  <p className="text-muted small">Nenhum produto com estoque abaixo do mínimo</p>
                </div>
              ) : (
                <ul className="list-unstyled mb-0" role="list">
                  {lowStockItems.map((product) => (
                    <li key={product.id} className="border-bottom px-3 py-2 last:border-0">
                      <div className="d-flex justify-content-between align-items-center">
                        <div className="flex-1 me-3 min-w-0">
                          <div className="fw-medium text-truncate">{product.name}</div>
                          <small className="text-muted">Sem fabricante</small>
                        </div>
                        <div className="text-end">
                          <StockIndicator
                            stock={product.stock}
                            minStock={product.minStock}
                            showLabel={false}
                            size="sm"
                            animate={false}
                          />
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card.Body>
            {lowStockItems.length > 0 && (
              <Card.Footer className="bg-white border-0 pt-0">
                <Button variant="ghost" size="sm" href="/products?filter=low-stock" className="w-100">
                  Ver todos os alertas ({totalLowStockProducts + totalOutOfStockProducts})
                  <AlertTriangle size={14} className="ms-1" aria-hidden="true" />
                </Button>
              </Card.Footer>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default Dashboard;