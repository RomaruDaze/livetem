import React, { useState, useRef, useEffect } from 'react';

interface Language {
  id: string;
  label: string;
  color: string;
}

const LANGUAGES: Language[] = [
  { id: 'abap',             label: 'ABAP',           color: '#E8274B' },
  { id: 'bat',              label: 'Batch',          color: '#C1F12E' },
  { id: 'bicep',            label: 'Bicep',          color: '#519ABA' },
  { id: 'c',                label: 'C',              color: '#555555' },
  { id: 'clojure',          label: 'Clojure',        color: '#DB5855' },
  { id: 'coffeescript',     label: 'CoffeeScript',   color: '#244776' },
  { id: 'cpp',              label: 'C++',            color: '#F34B7D' },
  { id: 'csharp',           label: 'C#',             color: '#178600' },
  { id: 'css',              label: 'CSS',            color: '#563D7C' },
  { id: 'dart',             label: 'Dart',           color: '#00B4AB' },
  { id: 'dockerfile',       label: 'Dockerfile',     color: '#384D54' },
  { id: 'elixir',           label: 'Elixir',         color: '#6E4A7E' },
  { id: 'erlang',           label: 'Erlang',         color: '#B83998' },
  { id: 'fsharp',           label: 'F#',             color: '#B845FC' },
  { id: 'go',               label: 'Go',             color: '#00ADD8' },
  { id: 'graphql',          label: 'GraphQL',        color: '#E10098' },
  { id: 'groovy',           label: 'Groovy',         color: '#4298B8' },
  { id: 'handlebars',       label: 'Handlebars',     color: '#F7931E' },
  { id: 'haskell',          label: 'Haskell',        color: '#5E5086' },
  { id: 'hcl',              label: 'HCL / Terraform',color: '#7B42BC' },
  { id: 'html',             label: 'HTML',           color: '#E34C26' },
  { id: 'ini',              label: 'INI',            color: '#6E4C13' },
  { id: 'java',             label: 'Java',           color: '#B07219' },
  { id: 'javascript',       label: 'JavaScript',     color: '#F7DF1E' },
  { id: 'javascriptreact',  label: 'JSX',            color: '#61DAFB' },
  { id: 'json',             label: 'JSON',           color: '#8B8B8B' },
  { id: 'jsonc',            label: 'JSONC',          color: '#8B8B8B' },
  { id: 'julia',            label: 'Julia',          color: '#A270BA' },
  { id: 'kotlin',           label: 'Kotlin',         color: '#7F52FF' },
  { id: 'latex',            label: 'LaTeX',          color: '#3D6117' },
  { id: 'less',             label: 'Less',           color: '#1D365D' },
  { id: 'lua',              label: 'Lua',            color: '#000080' },
  { id: 'makefile',         label: 'Makefile',       color: '#427819' },
  { id: 'markdown',         label: 'Markdown',       color: '#083FA1' },
  { id: 'objective-c',      label: 'Objective-C',    color: '#438EFF' },
  { id: 'objective-cpp',    label: 'Objective-C++',  color: '#438EFF' },
  { id: 'perl',             label: 'Perl',           color: '#39457E' },
  { id: 'php',              label: 'PHP',            color: '#4F5D95' },
  { id: 'plaintext',        label: 'Plain Text',     color: '#8B8B8B' },
  { id: 'powershell',       label: 'PowerShell',     color: '#012456' },
  { id: 'properties',       label: 'Properties',     color: '#8B8B8B' },
  { id: 'python',           label: 'Python',         color: '#3776AB' },
  { id: 'r',                label: 'R',              color: '#198CE7' },
  { id: 'razor',            label: 'Razor (CSHTML)', color: '#512BD4' },
  { id: 'ruby',             label: 'Ruby',           color: '#CC342D' },
  { id: 'rust',             label: 'Rust',           color: '#DEA584' },
  { id: 'scala',            label: 'Scala',          color: '#C22D40' },
  { id: 'scss',             label: 'SCSS',           color: '#C6538C' },
  { id: 'shellscript',      label: 'Shell Script',   color: '#89E051' },
  { id: 'sql',              label: 'SQL',            color: '#BD79D1' },
  { id: 'swift',            label: 'Swift',          color: '#FA7343' },
  { id: 'toml',             label: 'TOML',           color: '#9C4221' },
  { id: 'typescript',       label: 'TypeScript',     color: '#3178C6' },
  { id: 'typescriptreact',  label: 'TSX',            color: '#3178C6' },
  { id: 'vb',               label: 'Visual Basic',   color: '#945DB7' },
  { id: 'vue',              label: 'Vue',            color: '#41B883' },
  { id: 'xml',              label: 'XML',            color: '#E34C26' },
  { id: 'yaml',             label: 'YAML',           color: '#CB171E' },
];

export { LANGUAGES };
export type { Language };

interface Props {
  value: string;
  onChange: (id: string) => void;
}

export default function LanguageSelect({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [highlightedIdx, setHighlightedIdx] = useState(0);
  const [dropStyle, setDropStyle] = useState<React.CSSProperties>({});
  const ref = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const filtered = search.trim()
    ? LANGUAGES.filter(l =>
        l.label.toLowerCase().includes(search.toLowerCase()) ||
        l.id.toLowerCase().includes(search.toLowerCase())
      )
    : LANGUAGES;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClick);
      searchRef.current?.focus();
      const idx = LANGUAGES.findIndex(l => l.id === value);
      setHighlightedIdx(idx >= 0 ? idx : 0);
    }
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  useEffect(() => {
    setHighlightedIdx(0);
  }, [search]);

  useEffect(() => {
    if (open && listRef.current && highlightedIdx >= 0) {
      const item = listRef.current.children[highlightedIdx] as HTMLElement;
      item?.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightedIdx, open]);

  function handleSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      setHighlightedIdx(i => Math.min(i + 1, filtered.length - 1));
      e.preventDefault();
    } else if (e.key === 'ArrowUp') {
      setHighlightedIdx(i => Math.max(i - 1, 0));
      e.preventDefault();
    } else if (e.key === 'Enter') {
      if (filtered[highlightedIdx]) {
        onChange(filtered[highlightedIdx].id);
        setOpen(false);
        setSearch('');
      }
      e.preventDefault();
    } else if (e.key === 'Escape') {
      setOpen(false);
      setSearch('');
    }
  }

  const selected = LANGUAGES.find(l => l.id === value) ?? { id: value, label: value, color: '#8B8B8B' };

  function handleToggle() {
    if (!open && triggerRef.current) {
      const r = triggerRef.current.getBoundingClientRect();
      setDropStyle({
        position: 'fixed',
        top: r.bottom + 2,
        left: 'auto',
        right: window.innerWidth - r.right,
        minWidth: 220,
        zIndex: 9999,
      });
    }
    setOpen(o => !o);
  }

  return (
    <div className="lang-select" ref={ref}>
      <button
        ref={triggerRef}
        type="button"
        className="lang-select-trigger"
        onClick={handleToggle}
      >
        <span className="lang-dot" style={{ background: selected.color }} />
        <span className="lang-label">{selected.label}</span>
        <span className="lang-chevron">▾</span>
      </button>
      {open && (
        <div className="lang-dropdown" style={dropStyle}>
          <input
            ref={searchRef}
            className="lang-search"
            placeholder="Search languages..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={handleSearchKeyDown}
          />
          <div className="lang-list" ref={listRef}>
            {filtered.length === 0 && (
              <div className="lang-empty">No languages found</div>
            )}
            {filtered.map((lang, i) => (
              <button
                key={lang.id}
                type="button"
                className={`lang-item${lang.id === value ? ' lang-item-active' : ''}${i === highlightedIdx ? ' lang-item-highlighted' : ''}`}
                onClick={() => { onChange(lang.id); setOpen(false); setSearch(''); }}
                onMouseEnter={() => setHighlightedIdx(i)}
              >
                <span className="lang-dot" style={{ background: lang.color }} />
                <span>{lang.label}</span>
                <span className="lang-id">{lang.id}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
