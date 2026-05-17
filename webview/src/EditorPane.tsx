import React, { useState, useEffect } from 'react';
import { Snippet } from './types';
import BodyEditor from './BodyEditor';
import Preview from './Preview';
import LanguageSelect from './LanguageSelect';
import SimpleSelect from './SimpleSelect';

interface Props {
  snippet: Snippet | null;
  isNew: boolean;
  allSnippets: Snippet[];
  onSave: (snippet: Snippet, previousName?: string) => void;
  onDelete: (snippet: Snippet) => void;
  onDraftChange?: (draft: Snippet | null) => void;
  onDirtyChange?: (isDirty: boolean) => void;
}

type ScopeType = 'global' | 'workspace' | 'language';

function getScopeType(scope: string): ScopeType {
  if (scope === 'global') return 'global';
  if (scope === 'workspace') return 'workspace';
  return 'language';
}

function emptySnippet(): Snippet {
  return { id: crypto.randomUUID(), name: '', prefix: '', description: '', body: [''], scope: 'global', source: '' };
}

export default function EditorPane({ snippet, isNew, allSnippets, onSave, onDelete, onDraftChange, onDirtyChange }: Props) {
  const [draft, setDraft] = useState<Snippet | null>(null);
  const [originalName, setOriginalName] = useState<string | undefined>(undefined);
  const [saveError, setSaveError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editorLanguage, setEditorLanguage] = useState('plaintext');

  useEffect(() => {
    if (isNew) {
      setDraft(emptySnippet());
      setOriginalName(undefined);
      setSaveError('');
      setConfirmDelete(false);
      setEditorLanguage('plaintext');
    } else if (snippet) {
      setDraft({ ...snippet });
      setOriginalName(snippet.name);
      setSaveError('');
      setConfirmDelete(false);
      const st = getScopeType(snippet.scope);
      setEditorLanguage(st === 'language' ? snippet.scope : 'plaintext');
    } else {
      setDraft(null);
      setOriginalName(undefined);
    }
  }, [snippet, isNew]);

  useEffect(() => {
    if (isNew && draft) {
      onDraftChange?.(draft);
    } else {
      onDraftChange?.(null);
    }
  }, [draft, isNew]);

  const isDirty = isNew || (
    draft !== null &&
    snippet !== null && (
      draft.prefix !== snippet.prefix ||
      draft.description !== snippet.description ||
      draft.scope !== snippet.scope ||
      draft.body.join('\n') !== snippet.body.join('\n')
    )
  );

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty]);

  if (!draft) {
    return (
      <div className="editor-pane editor-empty">
        <span>Select a snippet or click <strong>+ New</strong></span>
      </div>
    );
  }

  const scopeType = getScopeType(draft.scope);

  const hasDuplicatePrefix = allSnippets.some(
    s => s.prefix === draft.prefix && s.scope === draft.scope && s.id !== draft.id
  );

  function handleScopeTypeChange(newType: ScopeType) {
    if (newType === 'global') {
      setDraft({ ...draft, scope: 'global' });
    } else if (newType === 'workspace') {
      setDraft({ ...draft, scope: 'workspace' });
    } else {
      const lang = editorLanguage !== 'plaintext' ? editorLanguage : 'javascript';
      setDraft({ ...draft, scope: lang });
      setEditorLanguage(lang);
    }
  }

  function handleEditorLanguageChange(lang: string) {
    setEditorLanguage(lang);
    if (scopeType === 'language') {
      setDraft({ ...draft, scope: lang });
    }
  }

  function handleSave() {
    if (!draft.prefix.trim()) { setSaveError('Prefix is required.'); return; }
    const derivedName = draft.description.trim() || draft.prefix.trim();
    const snippetToSave = { ...draft, name: derivedName };
    const prevName = originalName && originalName !== derivedName ? originalName : undefined;
    onSave(snippetToSave, prevName);
    setSaveError('');
  }

  function handleDuplicate() {
    setDraft({ ...draft, id: crypto.randomUUID(), name: '', prefix: `copy-of-${draft.prefix}`, source: '' });
    setOriginalName(undefined);
  }

  return (
    <div className="editor-pane">
      <div className="field-row">
        <div className="field">
          <label>Prefix</label>
          <input
            value={draft.prefix}
            onChange={e => setDraft({ ...draft, prefix: e.target.value })}
            placeholder="e.g. fn"
          />
          {hasDuplicatePrefix && (
            <span className="field-warning">Another snippet uses this prefix.</span>
          )}
        </div>
        <div className="field field-wide">
          <label>Description</label>
          <input
            value={draft.description}
            onChange={e => setDraft({ ...draft, description: e.target.value })}
            placeholder="Short description"
          />
        </div>
        <div className="field">
          <label>Scope</label>
          <SimpleSelect
            value={scopeType}
            options={[
              { value: 'global', label: 'Global' },
              { value: 'workspace', label: 'Workspace' },
              { value: 'language', label: 'Language' },
            ]}
            onChange={v => handleScopeTypeChange(v as ScopeType)}
          />
        </div>
      </div>

      <div className="body-section">
        <div className="body-header">
          <label>Body</label>
          <LanguageSelect value={editorLanguage} onChange={handleEditorLanguageChange} />
        </div>
        <BodyEditor
          value={draft.body.join('\n')}
          onChange={val => setDraft({ ...draft, body: val.split('\n') })}
          language={editorLanguage}
        />
      </div>

      <div className="preview-section">
        <label>Preview</label>
        <Preview body={draft.body} />
      </div>

      <div className="action-bar">
        {saveError && <span className="save-error">{saveError}</span>}
        <button className="btn-primary" onClick={handleSave} disabled={!isDirty}>Save</button>
        <button className="btn-secondary" onClick={handleDuplicate}>Duplicate</button>
        {snippet && !isNew && (
          confirmDelete ? (
            <>
              <span className="delete-confirm-label">Delete this snippet?</span>
              <button className="btn-danger" onClick={() => { onDelete(snippet!); setConfirmDelete(false); }}>Confirm</button>
              <button className="btn-secondary" onClick={() => setConfirmDelete(false)}>Cancel</button>
            </>
          ) : (
            <button className="btn-danger" onClick={() => setConfirmDelete(true)}>Delete</button>
          )
        )}
      </div>
    </div>
  );
}
