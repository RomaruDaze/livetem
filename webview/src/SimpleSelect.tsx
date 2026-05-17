import React, { useState, useRef, useEffect } from 'react';

interface Option { value: string; label: string; }

interface Props {
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  className?: string;
}

export default function SimpleSelect({ value, options, onChange, className }: Props) {
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const [dropStyle, setDropStyle] = useState<React.CSSProperties>({});
  const ref = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) {
      document.addEventListener('mousedown', handleClick);
      const idx = options.findIndex(o => o.value === value);
      setHighlighted(idx >= 0 ? idx : 0);
    }
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  useEffect(() => {
    if (open && listRef.current && highlighted >= 0) {
      const item = listRef.current.children[highlighted] as HTMLElement;
      item?.scrollIntoView({ block: 'nearest' });
    }
  }, [highlighted, open]);

  function handleToggle() {
    if (!open && triggerRef.current) {
      const r = triggerRef.current.getBoundingClientRect();
      setDropStyle({
        position: 'fixed',
        top: r.bottom + 2,
        left: r.left,
        right: 'auto',
        minWidth: r.width,
        zIndex: 9999,
      });
    }
    setOpen(o => !o);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        handleToggle();
        e.preventDefault();
      }
      return;
    }
    if (e.key === 'ArrowDown') {
      setHighlighted(i => Math.min(i + 1, options.length - 1));
      e.preventDefault();
    } else if (e.key === 'ArrowUp') {
      setHighlighted(i => Math.max(i - 1, 0));
      e.preventDefault();
    } else if (e.key === 'Enter') {
      onChange(options[highlighted].value);
      setOpen(false);
      e.preventDefault();
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  const selected = options.find(o => o.value === value);

  return (
    <div className={`lang-select${className ? ' ' + className : ''}`} ref={ref}>
      <button
        ref={triggerRef}
        type="button"
        className="lang-select-trigger"
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
      >
        <span className="lang-label">{selected?.label ?? value}</span>
        <span className="lang-chevron">▾</span>
      </button>
      {open && (
        <div className="lang-dropdown" style={dropStyle} ref={listRef}>
          {options.map((opt, i) => (
            <button
              key={opt.value}
              type="button"
              className={`lang-item${opt.value === value ? ' lang-item-active' : ''}${i === highlighted ? ' lang-item-highlighted' : ''}`}
              onClick={() => { onChange(opt.value); setOpen(false); }}
              onMouseEnter={() => setHighlighted(i)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
