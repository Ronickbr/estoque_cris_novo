import { cn, formatNumber } from '@utils';
import { useEffect, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { ArrowUpRight, ArrowDownRight, Box, Building, ArrowLeftRight, AlertTriangle, Calendar, Trophy, ShoppingCart } from 'lucide-react';

const ICON_MAP: Record<string, React.ReactNode> = {
  sales: <ShoppingCart size={24} />,
  week: <Calendar size={24} />,
  month: <Calendar size={24} />,
  trophy: <Trophy size={24} />,
  products: <Box size={24} />,
  manufacturers: <Building size={24} />,
  movements: <ArrowLeftRight size={24} />,
  alerts: <AlertTriangle size={24} />,
};

const COLOR_VARIANTS = {
  primary: { bg: 'primary-100', icon: 'primary-700' },
  secondary: { bg: 'secondary-100', icon: 'secondary-700' },
  info: { bg: 'info-100', icon: 'info-700' },
  warning: { bg: 'warning-100', icon: 'warning-700' },
  success: { bg: 'success-100', icon: 'success-700' },
  danger: { bg: 'danger-100', icon: 'danger-700' },
};

export interface SummaryCardProps {
  value: number | string;
  label: string;
  description?: string;
  icon?: keyof typeof ICON_MAP | React.ReactNode;
  variant?: keyof typeof COLOR_VARIANTS;
  trend?: { value: number; label?: string; up?: boolean };
  clickable?: boolean;
  href?: string;
  onClick?: () => void;
  animate?: boolean;
  className?: string;
}

export function SummaryCard({
  value,
  label,
  description,
  icon = 'products',
  variant = 'primary',
  trend,
  clickable = false,
  href,
  onClick,
  animate = true,
  className,
}: SummaryCardProps) {
  const valueRef = useRef<HTMLHeadingElement>(null);
  const prevValueRef = useRef<number>(0);
  const colors = COLOR_VARIANTS[variant] || COLOR_VARIANTS.primary;

  const numericValue = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^\d.-]/g, '')) || 0;

  useEffect(() => {
    if (animate && valueRef.current && numericValue !== prevValueRef.current) {
      animateValue(numericValue);
      prevValueRef.current = numericValue;
    } else if (!animate && valueRef.current) {
      valueRef.current.textContent = formatValue(numericValue);
    }
  }, [numericValue, animate]);

  function formatValue(val: number): string {
    return formatNumber(val);
  }

  function animateValue(targetValue: number) {
    const startValue = prevValueRef.current;
    const duration = 1000;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const currentValue = startValue + (targetValue - startValue) * eased;

      if (valueRef.current) {
        valueRef.current.textContent = formatValue(currentValue);
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else if (valueRef.current) {
        valueRef.current.textContent = formatValue(targetValue);
      }
    };

    requestAnimationFrame(animate);
  }

  const IconComponent = typeof icon === 'string' ? ICON_MAP[icon] : icon;

  const content = (
    <>
      <div
        className="summary-card__icon d-flex align-items-center justify-content-center"
        style={{ '--icon-bg': `var(--color-${colors.bg})`, '--icon-color': `var(--color-${colors.icon})` } as React.CSSProperties}
        aria-hidden="true"
      >
        {IconComponent}
      </div>
      <div className="summary-card__content flex-1 min-w-0">
        <p className="summary-card__label text-muted mb-1 fw-medium small">{label}</p>
        <h3 ref={valueRef} className="summary-card__value fw-bold mb-1 fs-4 lh-1">
          {formatValue(numericValue)}
        </h3>
        {description && <p className="summary-card__description text-muted small mb-0">{description}</p>}
        {trend && (
          <div className={cn('summary-card__trend d-inline-flex align-items-center gap-1 mt-1', trend.up ? 'summary-card__trend--up text-success' : 'summary-card__trend--down text-danger')}>
            {trend.up ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            <span className="fw-medium small">{trend.value > 0 ? '+' : ''}{trend.value}%</span>
            {trend.label && <span className="summary-card__trend-label text-muted">{trend.label}</span>}
          </div>
        )}
      </div>
    </>
  );

  if (clickable && href) {
    return (
      <NavLink
        to={href}
        className={cn('summary-card', `summary-card--${variant}`, 'summary-card--clickable', 'text-decoration-none', className)}
        onClick={(e) => {
          if (onClick) {
            e.preventDefault();
            onClick();
          }
        }}
        aria-label={`${label}: ${formatValue(numericValue)}`}
      >
        {content}
      </NavLink>
    );
  }

  return (
    <div
      className={cn('summary-card', `summary-card--${variant}`, clickable && 'summary-card--clickable', className)}
      tabIndex={clickable ? 0 : undefined}
      role={clickable ? 'button' : undefined}
      onClick={clickable ? onClick : undefined}
      onKeyDown={clickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.(); } } : undefined}
      aria-label={`${label}: ${formatValue(numericValue)}`}
    >
      {content}
    </div>
  );
}

export interface SummaryCardGridProps {
  cards: SummaryCardProps[];
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function SummaryCardGrid({ cards, gap = 'md', className }: SummaryCardGridProps) {
  const gapSizes = { sm: '0.75rem', md: '1.5rem', lg: '2rem' };
  return (
    <div
      className={cn('summary-grid', className)}
      role="region"
      aria-label="Resumo do dashboard"
      style={
        {
          display: 'grid',
          gridTemplateColumns: 'repeat(1, 1fr)',
          gap: gapSizes[gap],
        } as React.CSSProperties
      }
    >
      {cards.map((card, index) => (
        <SummaryCard key={index} {...card} />
      ))}
    </div>
  );
}

export default SummaryCard;