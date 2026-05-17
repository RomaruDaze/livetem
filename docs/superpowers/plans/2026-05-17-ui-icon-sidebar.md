# UI Icon & Activity Bar Sidebar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a custom SVG icon to command palette entries and a LiveTem launcher panel in the VS Code activity bar.

**Architecture:** Both features are pure `package.json` contribution changes plus one new SVG asset — no TypeScript modifications. The SVG uses `currentColor` so VS Code themes it automatically. The sidebar launcher uses `viewsWelcome` to render native buttons without a `TreeDataProvider` or `WebviewViewProvider`.

**Tech Stack:** VS Code extension manifest (package.json), SVG

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `media/icon.svg` | 16×16 `currentColor` SVG of the `</>` symbol |
| Modify | `package.json` | Add `icon` to commands; add `viewsContainers`, `views`, `viewsWelcome` |

---

## Task 1: Create the SVG icon

**Files:**
- Create: `media/icon.svg`

- [ ] **Step 1: Create the `media/` directory and write the SVG**

```bash
mkdir -p media
```

Create `media/icon.svg` with this exact content:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
  <polyline points="5,2 1,8 5,14"/>
  <line x1="10" y1="2" x2="6" y2="14"/>
  <polyline points="11,2 15,8 11,14"/>
</svg>
```

This draws:
- `<` — a left-pointing chevron at x 1–5
- `/` — a diagonal slash at x 6–10
- `>` — a right-pointing chevron at x 11–15

- [ ] **Step 2: Verify the SVG is well-formed**

```bash
cat media/icon.svg
```

Expected: the SVG content above, no truncation.

- [ ] **Step 3: Commit**

```bash
git add media/icon.svg
git commit -m "feat: add SVG icon asset for command palette and activity bar"
```

---

## Task 2: Add icon to command palette entries

**Files:**
- Modify: `package.json` — `contributes.commands` array

- [ ] **Step 1: Update the commands array in `package.json`**

Replace the existing `commands` block:

```json
"commands": [
  { "command": "livetem.open",    "title": "Snippet Manager: Open" },
  { "command": "livetem.openNew", "title": "Snippet Manager: New Snippet" }
]
```

With:

```json
"commands": [
  { "command": "livetem.open",    "title": "Snippet Manager: Open",        "icon": "media/icon.svg" },
  { "command": "livetem.openNew", "title": "Snippet Manager: New Snippet", "icon": "media/icon.svg" }
]
```

- [ ] **Step 2: Verify `package.json` is valid JSON**

```bash
node -e "JSON.parse(require('fs').readFileSync('package.json','utf8')); console.log('valid')"
```

Expected output: `valid`

- [ ] **Step 3: Build and smoke-test in the extension host**

```bash
npm run build
```

Then press `F5` in VS Code to launch the Extension Development Host. Open the command palette (`Cmd+Shift+P`), type `Snippet Manager` — both entries should show the `</>` icon to their left.

- [ ] **Step 4: Commit**

```bash
git add package.json
git commit -m "feat: add custom icon to command palette entries"
```

---

## Task 3: Add activity bar sidebar launcher

**Files:**
- Modify: `package.json` — `contributes` object (add `viewsContainers`, `views`, `viewsWelcome`)

- [ ] **Step 1: Add `viewsContainers`, `views`, and `viewsWelcome` to `package.json`**

Inside `"contributes": { ... }`, add the following three new keys alongside the existing `"commands"` key:

```json
"viewsContainers": {
  "activitybar": [
    {
      "id": "livetem-sidebar",
      "title": "LiveTem",
      "icon": "media/icon.svg"
    }
  ]
},
"views": {
  "livetem-sidebar": [
    {
      "id": "livetem.launcherView",
      "name": "Snippet Manager"
    }
  ]
},
"viewsWelcome": [
  {
    "view": "livetem.launcherView",
    "contents": "Manage your VS Code snippets with LiveTem.\n[Open Snippet Manager](command:livetem.open)\n[New Snippet](command:livetem.openNew)"
  }
]
```

The full `contributes` block should look like:

```json
"contributes": {
  "commands": [
    { "command": "livetem.open",    "title": "Snippet Manager: Open",        "icon": "media/icon.svg" },
    { "command": "livetem.openNew", "title": "Snippet Manager: New Snippet", "icon": "media/icon.svg" }
  ],
  "viewsContainers": {
    "activitybar": [
      {
        "id": "livetem-sidebar",
        "title": "LiveTem",
        "icon": "media/icon.svg"
      }
    ]
  },
  "views": {
    "livetem-sidebar": [
      {
        "id": "livetem.launcherView",
        "name": "Snippet Manager"
      }
    ]
  },
  "viewsWelcome": [
    {
      "view": "livetem.launcherView",
      "contents": "Manage your VS Code snippets with LiveTem.\n[Open Snippet Manager](command:livetem.open)\n[New Snippet](command:livetem.openNew)"
    }
  ]
}
```

- [ ] **Step 2: Verify `package.json` is valid JSON**

```bash
node -e "JSON.parse(require('fs').readFileSync('package.json','utf8')); console.log('valid')"
```

Expected output: `valid`

- [ ] **Step 3: Smoke-test the activity bar in the Extension Development Host**

Press `F5` to launch the Extension Development Host. Verify:
1. The LiveTem `</>` icon appears in the activity bar (left side strip)
2. Clicking the icon opens a sidebar panel titled "Snippet Manager"
3. The panel shows the text "Manage your VS Code snippets with LiveTem."
4. Two buttons are visible: "Open Snippet Manager" and "New Snippet"
5. Clicking "Open Snippet Manager" opens the full-tab snippet manager panel
6. Clicking "New Snippet" opens the full-tab panel in new-snippet mode

- [ ] **Step 4: Commit**

```bash
git add package.json
git commit -m "feat: add LiveTem activity bar sidebar launcher"
```

---

## Task 4: Package and version bump

- [ ] **Step 1: Bump the patch version in `package.json`**

Change `"version": "1.0.2"` to `"version": "1.0.3"`.

- [ ] **Step 2: Repackage the extension**

```bash
npx @vscode/vsce package --no-dependencies
```

Expected: `livetem-1.0.3.vsix` created in the project root.

- [ ] **Step 3: Verify the VSIX contains the SVG**

```bash
npx @vscode/vsce ls | grep icon
```

Expected output includes both `icon.png` and `media/icon.svg`.

- [ ] **Step 4: Commit and tag**

```bash
git add package.json
git commit -m "chore: bump version to 1.0.3"
git tag v1.0.3
git push && git push --tags
```
