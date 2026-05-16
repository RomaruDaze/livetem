import React, { useEffect, useReducer } from 'react';
import { Snippet, HostMessage } from './types';
import SnippetList from './SnippetList';
import EditorPane from './EditorPane';

// Acquire the VS Code API once at module level
declare const acquireVsCodeApi: () => { postMessage: (msg: unknown) => void };
const vscode = acquireVsCodeApi();

interface State {
  snippets: Snippet[];
  selectedId: string | null;
  isNew: boolean;
  error: string | null;
}

type Action =
  | { type: 'INIT';          snippets: Snippet[] }
  | { type: 'SAVED';         snippet: Snippet }
  | { type: 'DELETED';       id: string }
  | { type: 'SELECT';        id: string }
  | { type: 'NEW' }
  | { type: 'ERROR';         message: string }
  | { type: 'DISMISS_ERROR' };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'INIT':
      return { ...state, snippets: action.snippets, error: null };
    case 'SAVED': {
      const exists = state.snippets.some(s => s.id === action.snippet.id);
      return {
        ...state,
        snippets: exists
          ? state.snippets.map(s => s.id === action.snippet.id ? action.snippet : s)
          : [...state.snippets, action.snippet],
        selectedId: action.snippet.id,
        isNew: false,
        error: null,
      };
    }
    case 'DELETED':
      return {
        ...state,
        snippets: state.snippets.filter(s => s.id !== action.id),
        selectedId: state.selectedId === action.id ? null : state.selectedId,
        error: null,
      };
    case 'SELECT':
      return { ...state, selectedId: action.id, isNew: false };
    case 'NEW':
      return { ...state, selectedId: null, isNew: true };
    case 'ERROR':
      return { ...state, error: action.message };
    case 'DISMISS_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, {
    snippets: [], selectedId: null, isNew: false, error: null,
  });

  useEffect(() => {
    // Tell the host we are ready — host will send init + optional startNew
    vscode.postMessage({ type: 'ready' });

    const handler = (event: MessageEvent) => {
      const msg = event.data as HostMessage | { type: 'startNew' };
      if (msg.type === 'startNew') { dispatch({ type: 'NEW' }); return; }
      switch (msg.type) {
        case 'init':    dispatch({ type: 'INIT',    snippets: msg.snippets }); break;
        case 'saved':   dispatch({ type: 'SAVED',   snippet:  msg.snippet  }); break;
        case 'deleted': dispatch({ type: 'DELETED', id:       msg.id       }); break;
        case 'error':   dispatch({ type: 'ERROR',   message:  msg.message  }); break;
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  const selected = state.snippets.find(s => s.id === state.selectedId) ?? null;

  return (
    <div className="app">
      {state.error && (
        <div className="error-banner" onClick={() => dispatch({ type: 'DISMISS_ERROR' })}>
          {state.error} ✕
        </div>
      )}
      <SnippetList
        snippets={state.snippets}
        selectedId={state.selectedId}
        onSelect={id => dispatch({ type: 'SELECT', id })}
        onNew={() => dispatch({ type: 'NEW' })}
      />
      <EditorPane
        snippet={selected}
        isNew={state.isNew}
        allSnippets={state.snippets}
        onSave={(snippet, previousName) => vscode.postMessage({ type: 'save', snippet, previousName })}
        onDelete={snippet => vscode.postMessage({ type: 'delete', id: snippet.id, name: snippet.name, source: snippet.source })}
      />
    </div>
  );
}
