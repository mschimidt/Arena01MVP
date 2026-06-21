// Skeleton components para estados de carregamento

export function SkeletonLine({ width = '100%', height = '16px', className = '' }: {
  width?: string | number;
  height?: string | number;
  className?: string;
}) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{ width, height, borderRadius: 'var(--radius-sm)' }}
      aria-hidden="true"
    />
  );
}

export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div
      className="card"
      style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
      aria-hidden="true"
    >
      <SkeletonLine height="20px" width="60%" />
      {Array.from({ length: lines - 1 }).map((_, i) => (
        <SkeletonLine key={i} height="14px" width={i === lines - 2 ? '40%' : '90%'} />
      ))}
    </div>
  );
}

export function SkeletonAvatar({ size = 40 }: { size?: number }) {
  return (
    <div
      className="skeleton"
      style={{ width: size, height: size, borderRadius: '50%', flexShrink: 0 }}
      aria-hidden="true"
    />
  );
}

export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }} aria-hidden="true">
      {/* Header */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: '16px', padding: '12px 16px', borderBottom: '1px solid var(--border-color)' }}>
        {Array.from({ length: cols }).map((_, i) => (
          <SkeletonLine key={i} height="12px" width="70%" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={r}
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            gap: '16px',
            padding: '14px 16px',
            borderBottom: r < rows - 1 ? '1px solid var(--border-color)' : 'none',
          }}
        >
          {Array.from({ length: cols }).map((_, c) => (
            <SkeletonLine key={c} height="14px" width={c === 0 ? '80%' : '55%'} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonAulaCard() {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} aria-hidden="true">
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
          <SkeletonLine height="18px" width="55%" />
          <SkeletonLine height="12px" width="75%" />
        </div>
        <SkeletonLine height="24px" width="90px" />
      </div>
      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', display: 'flex', justifyContent: 'space-between' }}>
        <SkeletonLine height="12px" width="30%" />
        <SkeletonLine height="32px" width="130px" />
      </div>
    </div>
  );
}

export function SkeletonMetricsGrid({ count = 4 }: { count?: number }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${count}, 1fr)`, gap: '16px' }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <SkeletonAvatar size={44} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
            <SkeletonLine height="20px" width="60%" />
            <SkeletonLine height="12px" width="80%" />
          </div>
        </div>
      ))}
    </div>
  );
}
