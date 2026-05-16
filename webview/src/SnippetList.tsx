import React, { useState, useMemo } from 'react';
import { Snippet } from './types';

interface Props {
  snippets: Snippet[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
}

export default function SnippetList({ snippets, selectedId, onSelect, onNew }: Props) {
  const [search, setSearch] = useState('');
  const [scopeFilter, setScopeFilter] = useState('all');

  const scopes = useMemo(() => {
    const set = new Set(snippets.map(s => s.scope));
    return ['all', 'global', 'workspace', ...Array.from(set).filter(s => s !== 'global' && s !== 'workspace').sort()];
  }, [snippets]);

  const filtered = useMemo(() => {
    return snippets
      .filter(s => scopeFilter === 'all' || s.scope === scopeFilter)
      .filter(s =>
        s.prefix.toLowerCase().includes(search.toLowerCase()) ||
        s.description.toLowerCase().includes(search.toLowerCase()) ||
        s.name.toLowerCase().includes(search.toLowerCase())
      )
      .sort((a, b) => a.prefix.localeCompare(b.prefix));
  }, [snippets, search, scopeFilter]);

  return (
    <div className="snippet-list">
      <div className="list-toolbar">
        <input
          className="search-input"
          placeholder="Search snippets..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select
          className="scope-select"
          value={scopeFilter}
          onChange={e => setScopeFilter(e.target.value)}
        >
          {scopes.map(s => (
            <option key={s} value={s}>{s === 'all' ? 'All scopes' : s}</option>
          ))}
        </select>
        <button className="new-btn" onClick={onNew}>+ New</button>
      </div>
      <div className="list-items">
        {filtered.length === 0 && (
          <div className="empty-state">No snippets found</div>
        )}
        {filtered.map(snippet => (
          <div
            key={snippet.id}
            role="button"
            tabIndex={0}
            className={`snippet-row ${snippet.id === selectedId ? 'active' : ''}`}
            onClick={() => onSelect(snippet.id)}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onSelect(snippet.id); }}
          >
            <span className="snippet-prefix">{snippet.prefix}</span>
            <span className="snippet-desc">{snippet.description || snippet.name}</span>
            <span className="snippet-scope-badge">{snippet.scope}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
