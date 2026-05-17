# Unsaved-Changes Indicators Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show a disabled/muted Save button when the draft matches the saved snippet, and a yellow `●` dot on the sidebar row for the snippet currently being edited with unsaved changes.

**Architecture:** `EditorPane` computes `isDirty` locally and fires `onDirtyChange?(isDirty)` via a `useEffect`. `App` tracks `dirtySnippetId` (the ID of the dirty snippet, or null) and passes it to `SnippetList`, which swaps the scope badge for a `●` dot on the matching row.

**Tech Stack:** React 18, TypeScript, VS Code CSS variables, no new dependencies.

---

### Task 1: Add CSS for the disabled Save button

**Files:**
- Modify: `webview/src/app.css`

No test framework exists for the webview; verification is a clean `npm run build`.

- [ ] **Step 1: Add the disabled style to `webview/src/app.css`**

Append after the `.btn-primary:hover` rule (currently line 252):

```css
.btn-primary:disabled {
  opacity: 0.4;
  cursor: default;
}
```

- [ ] **Step 2: Verify build**

```bash
cd /Users/rogermarvin/Projects/personal/vscex/livetem/webview && npm run build
```

Expected: `✓ built in ~15s` with no errors.

- [ ] **Step 3: Commit**

```bash
git add webview/src/app.css
git commit -m "feat: add disabled style for Save button"
```

---

### Task 2: Add `isDirty` and `onDirtyChange` to EditorPane

**Files:**
- Modify: `webview/src/EditorPane.tsx`

- [ ] **Step 1: Extend the Props interface**

In `webview/src/EditorPane.tsx`, update the `Props` interface (currently lines 8–15):

```typescript
interface Props {
  snippet: Snippet | null;
  isNew: boolean;
  allSnippets: Snippet[];
  onSave: (snippet: Snippet, previousName?: string) => void;
  onDelete: (snippet: Snippet) => void;
  onDraftChange?: (draft: Snippet | null) => void;
  onDirtyChange?: (isDirty: boolean) => void;
}
```

- [ ] **Step 2: Destructure the new prop**

Update the function signature (currently line 29):

```typescript
export default function EditorPane({ snippet, isNew, allSnippets, onSave, onDelete, onDraftChange, onDirtyChange }: Props) {
```

- [ ] **Step 3: Compute `isDirty` in the component body**

Add this derived value directly before the `if (!draft)` guard (currently line 64). Place it after the existing state declarations and after the two `useEffect` blocks:

```typescript
const isDirty = isNew || (
  draft !== null &&
  snippet !== null && (
    draft.prefix !== snippet.prefix ||
    draft.description !== snippet.description ||
    draft.scope !== snippet.scope ||
    draft.body.join('\n') !== snippet.body.join('\n')
  )
);
```

- [ ] **Step 4: Add the `useEffect` that fires `onDirtyChange`**

Add this `useEffect` directly after the existing `useEffect([draft, isNew])` block (currently ending at line 62):

```typescript
useEffect(() => {
  onDirtyChange?.(isDirty);
}, [isDirty]);
```

- [ ] **Step 5: Disable the Save button when clean**

Update the Save button in the return block (currently line 166):

```tsx
<button className="btn-primary" onClick={handleSave} disabled={!isDirty}>Save</button>
```

- [ ] **Step 6: Verify build**

```bash
cd /Users/rogermarvin/Projects/personal/vscex/livetem/webview && npm run build
```

Expected: `✓ built in ~15s` with no errors.

- [ ] **Step 7: Commit**

```bash
git add webview/src/EditorPane.tsx
git commit -m "feat: compute isDirty and add onDirtyChange prop to EditorPane"
```

---

### Task 3: Wire `dirtySnippetId` in App and render dot in SnippetList

**Files:**
- Modify: `webview/src/App.tsx`
- Modify: `webview/src/SnippetList.tsx`

These two files are committed together because `App` passes `dirtySnippetId` to `SnippetList` — neither compiles cleanly without the other.

- [ ] **Step 1: Add `dirtySnippetId` state to App**

In `webview/src/App.tsx`, add state after the existing `draftPreview` line (currently line 66):

```typescript
const [draftPreview, setDraftPreview] = useState<Snippet | null>(null);
const [dirtySnippetId, setDirtySnippetId] = useState<string | null>(null);
```

- [ ] **Step 2: Wire `onDirtyChange` into the EditorPane JSX**

Update the `EditorPane` usage in the return block (currently lines 102–109):

```tsx
<EditorPane
  snippet={selected}
  isNew={state.isNew}
  allSnippets={state.snippets}
  onSave={(snippet, previousName) => vscode.postMessage({ type: 'save', snippet, previousName })}
  onDelete={snippet => vscode.postMessage({ type: 'delete', id: snippet.id, name: snippet.name, source: snippet.source })}
  onDraftChange={setDraftPreview}
  onDirtyChange={isDirty => setDirtySnippetId(isDirty ? state.selectedId : null)}
/>
```

- [ ] **Step 3: Pass `dirtySnippetId` to SnippetList**

Update the `SnippetList` usage (currently lines 95–101):

```tsx
<SnippetList
  snippets={state.snippets}
  selectedId={state.selectedId}
  draftPreview={draftPreview}
  dirtySnippetId={dirtySnippetId}
  onSelect={id => dispatch({ type: 'SELECT', id })}
  onNew={() => dispatch({ type: 'NEW' })}
/>
```

- [ ] **Step 4: Add `dirtySnippetId` to SnippetList Props**

In `webview/src/SnippetList.tsx`, update the `Props` interface (currently lines 5–11):

```typescript
interface Props {
  snippets: Snippet[];
  selectedId: string | null;
  draftPreview?: Snippet | null;
  dirtySnippetId?: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
}
```

- [ ] **Step 5: Destructure the new prop**

Update the function signature (currently line 13):

```typescript
export default function SnippetList({ snippets, selectedId, draftPreview, dirtySnippetId, onSelect, onNew }: Props) {
```

- [ ] **Step 6: Render dot and hide scope badge on the dirty row**

In the `filtered.map` block, replace the scope badge span (currently line 75) with a conditional that shows the dot on the dirty row and the badge on all others:

```tsx
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
```

- [ ] **Step 7: Verify build — no TypeScript errors**

```bash
cd /Users/rogermarvin/Projects/personal/vscex/livetem/webview && npm run build
```

Expected: `✓ built in ~15s` with no errors.

- [ ] **Step 8: Commit both files together**

```bash
git add webview/src/App.tsx webview/src/SnippetList.tsx
git commit -m "feat: wire dirtySnippetId through App into SnippetList dot indicator"
```

---

### Task 4: Manual smoke test

No automated test framework exists for the webview. Verify all spec scenarios by running the extension.

- [ ] **Step 1: Compile the extension and open the Extension Development Host**

```bash
npm run compile
```

Then press `F5` in VS Code to launch the Extension Development Host.

- [ ] **Step 2: Verify each scenario**

| Action | Expected |
|---|---|
| Open manager, select an existing snippet | Save button is muted/disabled (no changes yet) |
| Edit the prefix field | Save button becomes active immediately |
| Revert the prefix back to its original value | Save button goes muted again |
| Edit prefix → check sidebar | Yellow `●` dot appears on that snippet's row, scope badge hidden |
| Revert edit | Dot disappears, scope badge returns |
| Make an edit, click Save | After save, dot disappears, Save button goes muted |
| Click `+ New`, type a prefix | Preview row at top has dot (existing behaviour); Save button is active |
| Select a saved snippet, edit it, then click a different snippet | Dot disappears from the first snippet's row |
| No snippet selected | Save button is muted |

- [ ] **Step 3: Compile extension to confirm no TypeScript errors in host code**

```bash
npm run compile
```

Expected: exits with no errors.
