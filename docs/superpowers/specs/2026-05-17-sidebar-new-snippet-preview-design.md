# Sidebar New-Snippet Preview

**Date:** 2026-05-17
**Status:** Approved

## Overview

When the user clicks "+ New" and starts filling in a snippet, a live-updating preview row appears at the top of the sidebar — mirroring how VS Code shows a new unsaved file in the file tree before it is committed to disk.

## Data Flow

Draft state flows one way: `EditorPane → App → SnippetList`.

1. `EditorPane` gains an optional prop `onDraftChange?: (draft: Snippet | null) => void`.
   - A `useEffect` watching `[draft, isNew]` calls it with the current draft whenever `isNew` is true.
   - It calls it with `null` when `isNew` is false (user saves, selects away, etc.).

2. `App` holds a `draftPreview: Snippet | null` in a plain `useState` (not in the reducer — transient UI state, not persisted).
   - Passed to `EditorPane` as `onDraftChange={setDraftPreview}`.
   - Also set to `null` inside the reducer's `SAVED` and `DELETED` cases to clean up on those transitions.
   - Passed to `SnippetList` as `draftPreview`.

3. `SnippetList` receives `draftPreview?: Snippet | null` and renders it as a special row when non-null.

## Preview Row

- **Position:** Pinned at the top of the list, above all sorted snippets, with a thin separator below.
- **Prefix label:** Shows the current prefix value, or *"Untitled"* (italic, muted opacity) when the prefix field is empty.
- **Unsaved indicator:** A `●` dot badge styled with `--vscode-gitDecoration-modifiedResourceForeground` (the VS Code yellow/orange unsaved-file colour). Replaces the normal scope badge.
- **Interaction:** Not clickable. No hover highlight, no active state. The editor is already open with this draft.
- **Visibility:** Always visible regardless of active search query or scope filter.

## Edge Cases

| Scenario | Behaviour |
|---|---|
| Search or scope filter active | Preview row always shows at top, unaffected by filters |
| User clicks a saved snippet | `isNew → false` → `onDraftChange(null)` → row disappears immediately |
| User saves | `SAVED` action → App clears `draftPreview` → row disappears; saved snippet appears in sorted position |
| Empty snippet list | Preview row shows alone at top |
| Duplicate prefix warning | Stays in the editor pane only; not shown in the preview row |

## Files Changed

| File | Change |
|---|---|
| `webview/src/EditorPane.tsx` | Add `onDraftChange` prop; fire it via `useEffect([draft, isNew])` |
| `webview/src/App.tsx` | Add `draftPreview` useState; wire `onDraftChange`; clear on SAVED/DELETED |
| `webview/src/SnippetList.tsx` | Add `draftPreview` prop; render preview row at top |
| `webview/src/app.css` | Add styles for `.snippet-row-preview`, `.preview-dot`, `.preview-untitled` |
