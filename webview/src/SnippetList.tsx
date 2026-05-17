import React, { useState, useMemo } from 'react';
import SimpleSelect from './SimpleSelect';
import { Snippet } from './types';

interface Props {
  snippets: Snippet[];
  selectedId: string | null;
  draftPreview?: Snippet | null;
  dirtySnippetId?: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
}

export default function SnippetList({ snippets, selectedId, draftPreview, dirtySnippetId, onSelect, onNew }: Props) {
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
        <SimpleSelect
          className="full-width"
          value={scopeFilter}
          options={scopes.map(s => ({ value: s, label: s === 'all' ? 'All scopes' : s }))}
          onChange={setScopeFilter}
        />
        <button className="new-btn" onClick={onNew}>+ New</button>
      </div>
      <div className="list-items">
        {draftPreview && (
          <div className="snippet-row-preview" aria-label="Unsaved new snippet">
            {draftPreview.prefix
              ? <span className="snippet-prefix">{draftPreview.prefix}</span>
              : <span className="snippet-prefix preview-untitled">Untitled</span>
            }
            <span className="snippet-desc">{draftPreview.description}</span>
            <span className="preview-dot">●</span>
          </div>
        )}
        {filtered.length === 0 && !draftPreview && (
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
            {snippet.id === dirtySnippetId
              ? <span className="preview-dot">●</span>
              : <span className="snippet-scope-badge">{snippet.scope}</span>
            }
          </div>
        ))}
      </div>
    </div>
  );
}
