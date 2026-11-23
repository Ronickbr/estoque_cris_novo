import { Table, Pagination, Spinner, DropdownButton, Dropdown, Button, Card, Form } from 'react-bootstrap';
import { useState, useMemo, useCallback, useRef, useEffect, ReactNode, Fragment } from 'react';
import { cn, formatNumber, formatDate, escapeHtml } from '@utils';
import { ChevronUp, ChevronDown, Search, ChevronLeft, ChevronRight, Package, ArrowUpDown } from 'lucide-react';

export interface Column<T> {
  field: keyof T | string;
  label: string;
  type?: 'text' | 'number' | 'currency' | 'date' | 'datetime' | 'boolean' | 'badge' | 'image' | 'custom';
  sortable?: boolean;
  width?: string;
  minWidth?: string;
  align?: 'start' | 'center' | 'end';
  render?: (value: unknown, row: T, index: number) => ReactNode;
  className?: string;
  responsive?: boolean;
  badgeColor?: (value: unknown) => string;
}

export interface Action<T> {
  name: string;
  label: string;
  icon?: ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'ghost';
  handler?: (row: T) => void;
  className?: string;
  disabled?: (row: T) => boolean;
  visible?: (row: T) => boolean;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyField: keyof T | string;
  sortable?: boolean;
  pagination?: boolean;
  pageSize?: number;
  pageSizes?: number[];
  searchable?: boolean;
  searchFields?: string[];
  selectable?: boolean;
  actions?: Action<T>[];
  emptyMessage?: string;
  emptyIcon?: string;
  loading?: boolean;
  responsive?: boolean;
  rowClick?: (row: T) => void;
  onSort?: (field: string, direction: 'asc' | 'desc') => void;
  onPageChange?: (page: number) => void;
  onSelectionChange?: (selectedIds: (string | number)[], selectedRows: T[]) => void;
  onAction?: (actionName: string, row: T) => void;
  renderRow?: (row: T, index: number) => ReactNode;
  className?: string;
}

function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  keyField,
  sortable = true,
  pagination = true,
  pageSize: initialPageSize = 10,
  pageSizes = [10, 25, 50, 100],
  searchable = false,
  searchFields = [],
  selectable = false,
  actions = [],
  emptyMessage = 'Nenhum registro encontrado',
  emptyIcon = 'inbox',
  loading = false,
  responsive = true,
  rowClick,
  onSort,
  onPageChange,
  onSelectionChange,
  onAction,
  renderRow,
  className,
}: DataTableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedRows, setSelectedRows] = useState<Set<string | number>>(new Set());
  const selectAllRef = useRef<HTMLInputElement>(null);

  const keyFieldStr = String(keyField);

  const filteredData = useMemo(() => {
    let result = [...data];

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase().trim();
      const fields = searchFields.length > 0 ? searchFields : columns.map((c) => String(c.field));
      result = result.filter((row) =>
        fields.some((field) => {
          const value = row[field];
          return value !== null && value !== undefined && String(value).toLowerCase().includes(searchLower);
        })
      );
    }

    if (sortable && sortColumn) {
      result.sort((a, b) => {
        const aVal = a[sortColumn] as unknown;
        const bVal = b[sortColumn] as unknown;

        if (aVal === null || aVal === undefined) return 1;
        if (bVal === null || bVal === undefined) return -1;

        let comparison = 0;
        if (typeof aVal === 'string') {
          comparison = aVal.localeCompare(bVal as string, 'pt-BR', { numeric: true });
        } else if (typeof aVal === 'number') {
          comparison = aVal - (bVal as number);
        } else if (aVal instanceof Date) {
          comparison = aVal.getTime() - (bVal as Date).getTime();
        }

        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }

    return result;
  }, [data, searchTerm, sortColumn, sortDirection, sortable, searchFields, columns]);

  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;

  const pageData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  const handleSort = useCallback((field: string) => {
    if (!sortable) return;
    if (sortColumn === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(field);
      setSortDirection('asc');
    }
    onSort?.(field, sortColumn === field ? (sortDirection === 'asc' ? 'desc' : 'asc') : 'asc');
  }, [sortable, sortColumn, sortDirection, onSort]);

  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    onPageChange?.(page);
  }, [totalPages, onPageChange]);

  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  }, []);

  const toggleRowSelection = useCallback((id: string | number, selected: boolean) => {
    setSelectedRows((prev: Set<string | number>) => {
      const next = new Set<string | number>(prev);
      if (selected) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback((selected: boolean) => {
    if (selected) {
      const ids = pageData.map((row) => row[keyFieldStr] as string | number);
      setSelectedRows((prev: Set<string | number>) => new Set<string | number>([...prev, ...ids]));
    } else {
      const ids = pageData.map((row) => row[keyFieldStr] as string | number);
      setSelectedRows((prev: Set<string | number>) => {
        const next = new Set<string | number>(prev);
        ids.forEach((id) => next.delete(id));
        return next;
      });
    }
  }, [pageData, keyFieldStr]);

  const selectedInPage = pageData.filter((row) => selectedRows.has(row[keyFieldStr] as string | number)).length;

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = selectedInPage > 0 && selectedInPage < pageData.length;
    }
  }, [selectedInPage, pageData.length]);

  const formatCellValue = (value: unknown, column: Column<T>): ReactNode => {
    if (value === null || value === undefined || value === '') {
      return <span className="text-muted">—</span>;
    }

    switch (column.type) {
      case 'number':
        return formatNumber(value as number);
      case 'currency':
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value as number);
      case 'date':
        return formatDate(value as string | Date);
      case 'datetime':
        return formatDate(value as string | Date, { hour: '2-digit', minute: '2-digit' });
      case 'boolean':
        return (
          <span className={cn('badge', (value as boolean) ? 'bg-success' : 'bg-secondary')}>
            {value ? 'Sim' : 'Não'}
          </span>
        );
      case 'badge':
        return (
          <span className={cn('badge', column.badgeColor ? `bg-${column.badgeColor(value)}` : 'bg-primary')}>
            {String(value)}
          </span>
        );
      case 'image':
        return <img src={String(value)} alt="" className="data-table__image" loading="lazy" style={{ maxWidth: '50px', maxHeight: '50px', borderRadius: '4px' }} />;
      case 'custom':
        return column.render?.(value, value as T, 0) ?? String(value);
      default:
        return escapeHtml(String(value));
    }
  };

  const getCellValueForResponsive = (row: T, column: Column<T>): string => {
    const value = row[String(column.field)];
    if (value === null || value === undefined) return '';
    if (column.type === 'date') return formatDate(value as string | Date);
    if (column.type === 'currency') return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value as number);
    return String(value);
  };

  if (loading) {
    return (
      <div className={cn('data-table-wrapper', className)}>
        <div className="data-table__container table-responsive" style={{ minHeight: '300px' }}>
          <div className="loading-overlay">
            <Spinner animation="border" size="sm" variant="primary" />
            <p className="loading-overlay__text mt-2">Carregando...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card className={cn('border-0 shadow-sm rounded-3 overflow-hidden', className)}>
      {searchable && (
        <Card.Header className="bg-white border-bottom p-3">
          <div className="data-table__search-wrapper position-relative" style={{ maxWidth: '320px' }}>
            <Search className="position-absolute start-0 top-50 translate-middle-y text-secondary ms-3" size={16} aria-hidden="true" />
            <input
              type="search"
              className="form-control form-control-sm ps-5 rounded-3"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              aria-label="Buscar na tabela"
            />
          </div>
        </Card.Header>
      )}

      <div
        tabIndex={0}
        role="region"
        aria-label="Tabela de dados"
        className="table-responsive table-wrapper table-sticky-header"
      >
        <Table
          className={cn('data-table table--borderless table--striped', 'mb-0')}
          responsive={false}
          bordered={false}
          hover
          striped
        >
          <thead className="data-table__head">
            <tr role="row">
              {selectable && (
                <th scope="col" className="data-table__select-col" style={{ width: '48px' }}>
                  <input
                    ref={selectAllRef}
                    type="checkbox"
                    className="form-check-input data-table__select-all"
                    checked={selectedInPage === pageData.length && pageData.length > 0}
                    onChange={(e) => toggleSelectAll(e.target.checked)}
                    aria-label="Selecionar todos"
                  />
                </th>
              )}
              {columns.map((column, index) => (
                <th
                  key={index}
                  scope="col"
                  className={cn(
                    'data-table__header',
                    sortable && column.sortable && 'data-table__header--sortable',
                    sortColumn === String(column.field) && `data-table__header--sorted-${sortDirection}`,
                    column.className
                  )}
                  style={{ width: column.width }}
                  aria-sort={
                    sortColumn === String(column.field)
                      ? sortDirection === 'asc'
                        ? 'ascending'
                        : 'descending'
                      : 'none'
                  }
                  onClick={() => column.sortable && sortable && handleSort(String(column.field))}
                >
                  <div className="data-table__header-content d-flex align-items-center gap-1">
                    <span className="data-table__header-label">{column.label}</span>
                    {sortable && column.sortable && (
                      <span className="data-table__sort-icon text-muted" aria-hidden="true">
                        {sortColumn === String(column.field) ? (
                          sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                        ) : (
                          <>
                            <ChevronUp size={10} className="opacity-50" />
                            <ChevronDown size={10} className="opacity-50" />
                          </>
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
              {actions.length > 0 && (
                <th scope="col" className="data-table__actions-col" style={{ width: '120px' }}>
                  Ações
                </th>
              )}
            </tr>
          </thead>
          <tbody className="data-table__body">
            {pageData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (selectable ? 1 : 0) + (actions.length > 0 ? 1 : 0)} className="text-center py-5">
                  <div className="empty-state py-3">
                    <Package size={44} className="text-muted opacity-40 mb-3" aria-hidden="true" />
                    <h5 className="fw-semibold text-muted mb-1">Nenhum registro encontrado</h5>
                    <p className="text-muted small mb-0">{emptyMessage || 'Nenhum dado cadastrado para exibição.'}</p>
                  </div>
                </td>
              </tr>
            ) : (
              pageData.map((row, rowIndex) => {
                const id = row[keyFieldStr] as string | number;
                const isSelected = selectedRows.has(id);
                const rowActions = actions.filter((a) => a.visible?.(row) !== false);

                return (
                  <tr
                    key={id}
                    className={cn(
                      'data-table__row',
                      isSelected && 'data-table__row--selected',
                      responsive && 'data-table__row--responsive',
                      rowClick && 'data-table__row--clickable'
                    )}
                    data-row-id={String(id)}
                    role={rowClick ? 'button' : 'row'}
                    aria-selected={isSelected}
                    tabIndex={rowClick ? 0 : undefined}
                    onClick={rowClick ? () => rowClick(row) : undefined}
                    onKeyDown={rowClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); rowClick(row); } } : undefined}
                    data-label={responsive ? 'true' : undefined}
                  >
                    {selectable && (
                      <td className="data-table__select-cell">
                        <input
                          type="checkbox"
                          className="form-check-input data-table__row-select"
                          checked={isSelected}
                          onChange={(e) => toggleRowSelection(id, e.target.checked)}
                          aria-label={`Selecionar ${id}`}
                        />
                      </td>
                    )}
                    {renderRow ? (
                      renderRow(row, rowIndex)
                    ) : (
                      columns.map((column, colIndex) => (
                        <td
                          key={colIndex}
                          className={cn('data-table__cell', column.className, column.align && `text-${column.align}`)}
                          data-label={responsive ? column.label : undefined}
                        >
                          {column.render ? column.render(row[String(column.field)] as unknown, row, rowIndex) : formatCellValue(row[String(column.field)] as unknown, column)}
                        </td>
                      ))
                    )}
                    {actions.length > 0 && (
                      <td className="data-table__actions-cell">
                        {rowActions.length === 1 ? (
                          <button
                            type="button"
                            className={cn(
                              'btn',
                              'btn-sm',
                              `btn-${rowActions[0].variant || 'ghost'}`,
                              'btn-icon',
                              rowActions[0].className
                            )}
                            disabled={rowActions[0].disabled?.(row)}
                            onClick={(e) => {
                              e.stopPropagation();
                              rowActions[0].handler?.(row);
                              onAction?.(rowActions[0].name, row);
                            }}
                            aria-label={rowActions[0].label}
                            title={rowActions[0].label}
                          >
                            {rowActions[0].icon}
                          </button>
                        ) : (
                          <DropdownButton
                            as={Button}
                            variant="ghost"
                            size="sm"
                            className="btn-icon"
                            title={
                              <>
                                <span className="visually-hidden">Ações</span>
                                <i className="bi bi-three-dots-vertical" aria-hidden="true" />
                              </>
                            }
                            id={`dropdown-${id}`}
                            menuAlign="end"
                          >
                            {rowActions.map((action) => (
                              <Dropdown.Item
                                key={action.name}
                                disabled={action.disabled?.(row)}
                                onClick={() => {
                                  action.handler?.(row);
                                  onAction?.(action.name, row);
                                }}
                              >
                                {action.icon && <span className="me-2" aria-hidden="true">{action.icon}</span>}
                                {action.label}
                              </Dropdown.Item>
                            ))}
                          </DropdownButton>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </Table>
      </div>

      {pagination && (
        <Card.Footer className="bg-white border-top p-3 d-flex flex-wrap justify-content-between align-items-center gap-3">
          <div className="d-flex align-items-center gap-3">
            <span className="small text-muted" aria-live="polite">
              {totalItems === 0 ? (
                '0 registros'
              ) : (
                <>
                  Mostrando <strong>{(currentPage - 1) * pageSize + 1}</strong> a{' '}
                  <strong>{Math.min(currentPage * pageSize, totalItems)}</strong> de{' '}
                  <strong>{totalItems}</strong> registro{totalItems !== 1 ? 's' : ''}
                </>
              )}
            </span>
            <div className="d-flex align-items-center gap-1.5">
              <span className="small text-muted">Exibir:</span>
              <Form.Select
                size="sm"
                value={pageSize}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                style={{ width: 'auto', minWidth: '85px' }}
                aria-label="Itens por página"
              >
                {pageSizes.map((size) => (
                  <option key={size} value={size}>
                    {size} / pág
                  </option>
                ))}
              </Form.Select>
            </div>
          </div>

          {totalPages > 1 && (
            <nav className="data-table__pagination" aria-label="Paginação da tabela">
              <Pagination size="sm" className="mb-0">
                <Pagination.Prev
                  disabled={currentPage === 1}
                  onClick={() => handlePageChange(currentPage - 1)}
                  aria-label="Página anterior"
                >
                  <ChevronLeft size={16} aria-hidden="true" />
                </Pagination.Prev>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((page) => {
                    if (totalPages <= 7) return true;
                    if (page === 1 || page === totalPages) return true;
                    if (page >= currentPage - 1 && page <= currentPage + 1) return true;
                    return false;
                  })
                  .map((page, index, array) => {
                    const prevPage = array[index - 1];
                    const showEllipsis = prevPage !== undefined && page - prevPage > 1;
                    return (
                      <Fragment key={page}>
                        {showEllipsis && (
                          <Pagination.Item key={`ellipsis-${page}`} disabled>
                            <span className="page-link">…</span>
                          </Pagination.Item>
                        )}
                        <Pagination.Item active={page === currentPage}>
                          <button
                            type="button"
                            className="page-link"
                            onClick={() => handlePageChange(page)}
                            aria-label={`Página ${page}`}
                            aria-current={page === currentPage ? 'page' : undefined}
                          >
                            {page}
                          </button>
                        </Pagination.Item>
                      </Fragment>
                    );
                  })}
                <Pagination.Next
                  disabled={currentPage === totalPages}
                  onClick={() => handlePageChange(currentPage + 1)}
                  aria-label="Próxima página"
                >
                  <ChevronRight size={16} aria-hidden="true" />
                </Pagination.Next>
              </Pagination>
            </nav>
          )}
        </Card.Footer>
      )}
    </Card>
  );
}

export default DataTable;