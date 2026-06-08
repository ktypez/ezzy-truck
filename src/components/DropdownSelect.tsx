import { useState, useRef, useEffect } from 'react';

interface Option {
  label: string;
  value: string | number;
}

interface DropdownSelectProps {
  options: Option[];
  value: string | number;
  onChange: (value: string | number) => void;
  placeholder?: string;
  style?: React.CSSProperties;
}

export default function DropdownSelect({ options, value, onChange, placeholder, style }: DropdownSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={ref} style={{ position: 'relative', ...style }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          padding: '8px 12px',
          fontSize: 17,
          fontWeight: 700,
          color: 'var(--text)',
          background: 'var(--card)',
          border: '1.5px solid var(--border)',
          borderRadius: 8,
          cursor: 'pointer',
          fontFamily: 'inherit',
          outline: 'none',
          gap: 8,
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          transition: 'box-shadow 0.15s, border-color 0.15s',
          ...(open ? { boxShadow: '0 0 0 2px var(--primary-bg)' } : {}),
        }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selected ? selected.label : placeholder ?? 'Select...'}
        </span>
        <svg
          width="16" height="16" viewBox="0 0 16 16" fill="none"
          style={{
            flexShrink: 0,
            transition: 'transform 0.2s',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        >
          <path d="M4 6L8 10L12 6" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            background: 'var(--card)',
            border: '1.5px solid var(--border)',
            borderRadius: 8,
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            zIndex: 100,
            maxHeight: 260,
            overflowY: 'auto',
            padding: '4px 0',
          }}
        >
          {options.map((opt) => (
            <div
              key={opt.value}
              onClick={() => { onChange(opt.value); setOpen(false); }}
              style={{
                padding: '8px 12px',
                fontSize: 15,
                fontWeight: opt.value === value ? 700 : 500,
                color: opt.value === value ? 'var(--primary)' : 'var(--text)',
                background: opt.value === value ? 'var(--primary-bg)' : 'transparent',
                cursor: 'pointer',
                transition: 'background 0.12s',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => {
                if (opt.value !== value) e.currentTarget.style.background = 'color-mix(in srgb, var(--primary) 6%, transparent)';
              }}
              onMouseLeave={(e) => {
                if (opt.value !== value) e.currentTarget.style.background = 'transparent';
              }}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
