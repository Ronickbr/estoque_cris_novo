import { cn, formatNumber } from '@utils';
import { useEffect, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { Row, Col, Card } from 'react-bootstrap';
import {
  ArrowUpRight,
  ArrowDownRight,
  Box,
  Building,
  ArrowLeftRight,
  AlertTriangle,
  Calendar,
  Trophy,
  ShoppingCart,
  Layers,
} from 'lucide-react';

const ICON_MAP: Record<string, React.ReactNode> = {
  sales: <ShoppingCart size={24} />,
  week: <Calendar size={24} />,
  month: <Calendar size={24} />,
  trophy: <Trophy size={24} />,
  products: <Box size={24} />,
  manufacturers: <Building size={24} />,
  movements: <ArrowLeftRight size={24} />,
  alerts: <AlertTriangle size={24} />,
  inventory: <Layers size={24} />,
};

export interface SummaryCardProps {
  value: number | string;
  label: string;
  description?: string;
  icon?: keyof typeof ICON_MAP | React.ReactNode;
  variant?: 'primary' | 'secondary' | 'info' | 'warning' | 'success' | 'danger';
  trend?: { value: number; label?: string; up?: boolean };
  clickable?: boolean;
  href?: string;
  onClick?: () => void;
  animate?: boolean;
  suffix?: string;
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
  suffix,
  className,
}: SummaryCardProps) {
  const valueRef = useRef<HTMLHeadingElement>(null);
  const prevValueRef = useRef<number>(0);

  const numericValue =
    typeof value === 'number'
      ? value
      : parseFloat(String(value).replace(/[^\d.-]/g, '')) || 0;

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
    const duration = 600;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const currentValue = startValue + (targetValue - startValue) * eased;

      if (valueRef.current) {
        valueRef.current.textContent = formatValue(Math.round(currentValue));
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else if (valueRef.current) {
        valueRef.current.textContent = formatValue(targetValue);
      }
    };

    requestAnimationFrame(animate);
  }

  const IconComponent = typeof icon === 'string' ? ICON_MAP[icon] || <Box size={24} /> : icon;

  const cardInner = (
    <Card className={cn('border-0 shadow-sm rounded-3 h-100 transition-all', clickable && 'cursor-pointer hover-shadow', className)}>
      <Card.Body className="p-3 d-flex align-items-center justify-content-between">
        <div>
          <span className="text-muted small fw-medium text-uppercase">{label}</span>
          <div className="d-flex align-items-baseline gap-1 mt-1">
            <h3 ref={valueRef} className="fw-bold mb-0 text-dark fs-3 lh-1">
              {formatValue(numericValue)}
            </h3>
            {suffix && <small className="text-muted fw-normal">{suffix}</small>}
          </div>

          {description && <p className="text-muted small mb-0 mt-1">{description}</p>}

          {trend && (
            <div
              className={cn(
                'd-inline-flex align-items-center gap-1 mt-1 small fw-semibold',
                trend.up ? 'text-success' : 'text-danger'
              )}
            >
              {trend.up ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              <span>{trend.value > 0 ? '+' : ''}{trend.value}%</span>
              {trend.label && <span className="text-muted fw-normal">({trend.label})</span>}
            </div>
          )}
        </div>

        <div
          className={cn(
            'rounded-3 p-3 d-flex align-items-center justify-content-center flex-shrink-0 ms-2',
            `bg-${variant}-subtle text-${variant}`
          )}
          style={{ width: '52px', height: '52px' }}
        >
          {IconComponent}
        </div>
      </Card.Body>
    </Card>
  );

  if (href) {
    return (
      <NavLink to={href} className="text-decoration-none d-block h-100">
        {cardInner}
      </NavLink>
    );
  }

  return cardInner;
}

export interface SummaryCardGridProps {
  cards: SummaryCardProps[];
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function SummaryCardGrid({ cards, className }: SummaryCardGridProps) {
  return (
    <Row className={cn('g-3', className)}>
      {cards.map((card, index) => (
        <Col key={index} xs={12} sm={6} xl={3}>
          <SummaryCard {...card} />
        </Col>
      ))}
    </Row>
  );
}

export default SummaryCard;
