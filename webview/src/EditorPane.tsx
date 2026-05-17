import React, { useState, useEffect } from 'react';
import { Snippet } from './types';
import BodyEditor from './BodyEditor';
import Preview from './Preview';

interface Props {
  snippet: Snippet | null;
  isNew: boolean;
  allSnippets: Snippet[];
  onSave: (snippet: Snippet, previousName?: string) => void;
  onDelete: (snippet: Snippet) => void;
}

const SCOPES = ['global', 'workspace', 'javascript', 'typescript', 'python', 'css', 'html', 'json'];

function emptySnippet(): Snippet {
  return { id: crypto.randomUUID(), name: '', prefix: '', description: '', body: [''], scope: 'global', source: '' };
}

export default function EditorPane({ snippet, isNew, allSnippets, onSave, onDelete }: Props) {
  const [draft, setDraft] = useState<Snippet | null>(null);
  const [originalName, setOriginalName] = useState<string | undefined>(undefined);
  const [saveError, setSaveError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (isNew) {
      setDraft(emptySnippet());
      setOriginalName(undefined);
      setSaveError('');
      setConfirmDelete(false);
    } else if (snippet) {
      setDraft({ ...snippet });
      setOriginalName(snippet.name);
      setSaveError('');
      setConfirmDelete(false);
    } else {
      setDraft(null);
      setOriginalName(undefined);
    }
  }, [snippet, isNew]);

  if (!draft) {
    return (
      <div className="editor-pane editor-empty">
        <span>Select a snippet or click <strong>+ New</strong></span>
      </div>
    );
  }

  const hasDuplicatePrefix = allSnippets.some(
    s => s.prefix === draft.prefix && s.scope === draft.scope && s.id !== draft.id
  );

  function handleSave() {
    if (!draft!.prefix.trim()) { setSaveError('Prefix is required.'); return; }
    if (!draft!.name.trim())   { setSaveError('Name is required.');   return; }
    const prevName = originalName !== draft!.name ? originalName : undefined;
    onSave(draft!, prevName);
    setSaveError('');
  }

  function handleDuplicate() {
    setDraft({ ...draft!, id: crypto.randomUUID(), prefix: `copy-of-${draft!.prefix}`, name: `copy of ${draft!.name}` });
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
          <label>Name (key)</label>
          <input
            value={draft.name}
            onChange={e => setDraft({ ...draft, name: e.target.value })}
            placeholder="e.g. arrow function"
          />
        </div>
        <div className="field">
          <label>Scope</label>
          <select value={draft.scope} onChange={e => setDraft({ ...draft, scope: e.target.value })}>
            {SCOPES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className="body-section">
        <label>Body</label>
        <BodyEditor
          value={draft.body.join('\n')}
          onChange={val => setDraft({ ...draft, body: val.split('\n') })}
        />
      </div>

      <div className="preview-section">
        <label>Preview</label>
        <Preview body={draft.body} />
      </div>

      <div className="action-bar">
        {saveError && <span className="save-error">{saveError}</span>}
        <button className="btn-primary" onClick={handleSave}>Save</button>
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
