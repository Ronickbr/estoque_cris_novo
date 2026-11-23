import { cn, formatNumber } from '@utils';
import { useEffect, useRef } from 'react';

export interface StockIndicatorProps {
  stock: number;
  minStock: number;
  maxStock?: number;
  showBadge?: boolean;
  showProgress?: boolean;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  animate?: boolean;
  ariaLabel?: string;
  className?: string;
}

const STOCK_LEVELS = {
  empty: { threshold: 0, label: 'Esgotado', className: 'stock--empty', color: 'danger' },
  critical: { threshold: 0.5, label: 'Crítico', className: 'stock--critical', color: 'danger' },
  low: { threshold: 1, label: 'Baixo', className: 'stock--low', color: 'warning' },
  medium: { threshold: 2, label: 'Médio', className: 'stock--medium', color: 'info' },
  high: { threshold: Infinity, label: 'Normal', className: 'stock--high', color: 'success' },
};

export function StockIndicator({
  stock,
  minStock,
  maxStock,
  showBadge = true,
  showProgress = true,
  showLabel = true,
  size = 'md',
  animate = true,
  ariaLabel,
  className,
}: StockIndicatorProps) {
  const progressBarRef = useRef<HTMLDivElement>(null);
  const prevPercentageRef = useRef<number>(-1);

  const level = getLevel(stock, minStock);
  const percentage = getPercentage(stock, minStock, maxStock);

  useEffect(() => {
    if (animate && progressBarRef.current && percentage !== prevPercentageRef.current) {
      progressBarRef.current.style.width = '0%';
      requestAnimationFrame(() => {
        if (progressBarRef.current) {
          progressBarRef.current.style.width = `${percentage}%`;
        }
      });
      prevPercentageRef.current = percentage;
    } else if (!animate && progressBarRef.current) {
      progressBarRef.current.style.width = `${percentage}%`;
    }
  }, [percentage, animate]);

  function getLevel(stock: number, minStock: number) {
    if (stock <= 0) return STOCK_LEVELS.empty;
    if (stock <= minStock * 0.5) return STOCK_LEVELS.critical;
    if (stock <= minStock) return STOCK_LEVELS.low;
    if (stock <= minStock * 2) return STOCK_LEVELS.medium;
    return STOCK_LEVELS.high;
  }

  function getPercentage(stock: number, minStock: number, maxStock?: number): number {
    if (stock <= 0) return 0;
    const max = maxStock || minStock * 3;
    return Math.min(Math.round((stock / max) * 100), 100);
  }

  return (
    <div
      className={cn('stock-indicator', `stock-indicator--${size}`, level.className, className)}
      role="group"
      aria-label={ariaLabel || `Estoque: ${level.label}, ${formatNumber(stock)} unidades`}
    >
      {showBadge && (
        <span
          className={cn('stock-indicator__badge badge', `bg-${level.color}`, level.className)}
          aria-label={`${level.label}: ${formatNumber(stock)} unidades`}
        >
          {showLabel && <span className="stock-indicator__label">{level.label}</span>}
          <span className="stock-indicator__value">{formatNumber(stock)}</span>
        </span>
      )}
      {showProgress && (
        <div
          className="stock-indicator__progress progress"
          role="progressbar"
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Nível de estoque: ${percentage}%`}
        >
          <div
            ref={progressBarRef}
            className={cn('progress-bar', `bg-${level.color}`, level.className)}
            style={{
              width: animate && prevPercentageRef.current === -1 ? '0%' : `${percentage}%`,
              transition: animate ? 'width 0.6s ease-out' : 'none',
            }}
          />
        </div>
      )}
    </div>
  );
}

export interface StockAlertCardProps {
  manufacturer: string;
  manufacturerColor: string;
  manufacturerIcon: string;
  products: Array<{
    id: number;
    name: string;
    stock: number;
    minStock: number;
    image?: string;
  }>;
}

export function StockAlertCard({
  manufacturer,
  manufacturerColor,
  manufacturerIcon,
  products,
}: StockAlertCardProps) {
  return (
    <div
      className="manufacturer-card"
      style={{ '--manufacturer-color': manufacturerColor } as React.CSSProperties}
    >
      <div className="manufacturer-card__header" style={{ backgroundColor: manufacturerColor } as React.CSSProperties}>
        <div className="manufacturer-card__icon">
          <i className={`bi bi-${manufacturerIcon}`} aria-hidden="true" />
        </div>
        <h6 className="manufacturer-card__title">{manufacturer}</h6>
        <span className="manufacturer-card__count">{products.length} produto(s)</span>
      </div>
      <div className="manufacturer-card__body">
        <ul className="manufacturer-card__list list-unstyled mb-0" role="list">
          {products.map((product) => (
            <li key={product.id} className="manufacturer-card__item">
              <div className="manufacturer-card__product-info d-flex align-items-center gap-2">
                {product.image && (
                  <img
                    src={product.image}
                    alt=""
                    className="manufacturer-card__product-image rounded"
                    style={{ width: '32px', height: '32px', objectFit: 'cover' }}
                    loading="lazy"
                  />
                )}
                <span className="manufacturer-card__product-name text-truncate flex-1">{product.name}</span>
              </div>
              <StockIndicator
                stock={product.stock}
                minStock={product.minStock}
                showLabel={false}
                size="sm"
              />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default StockIndicator;