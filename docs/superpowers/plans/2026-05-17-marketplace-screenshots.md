# Marketplace Screenshots & GIFs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 4 animated GIF screenshots to the LiveTem VS Code Marketplace listing using a demo-first README layout.

**Architecture:** Create an `images/` directory for GIF assets, update README.md with a hero GIF + feature table layout, and exclude the images folder from the VSIX package via `.vscodeignore`. The GIF files themselves are provided by the user separately after this code work is done.

**Tech Stack:** Markdown, `.vscodeignore`, git

---

### Task 1: Create images directory

**Files:**
- Create: `images/.gitkeep`

- [ ] **Step 1: Create the images directory with a placeholder**

```bash
mkdir images && touch images/.gitkeep
```

- [ ] **Step 2: Verify the directory exists**

```bash
ls images/
```

Expected output:
```
.gitkeep
```

- [ ] **Step 3: Commit**

```bash
git add images/.gitkeep
git commit -m "chore: add images directory for marketplace GIFs"
```

---

### Task 2: Update README.md with demo-first layout

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Replace README.md with the new demo-first content**

Overwrite `README.md` with exactly:

```markdown
# LiveTem — Snippet Manager

A UI for creating and editing VS Code snippets.

![LiveTem demo](images/demo-editor.gif)

## Features

- Create and edit VS Code snippets with a built-in editor
- Manage snippet scope (global, workspace, language-specific)
- Syntax highlighting and language selection for snippet bodies
- Unsaved-changes indicators

| Sidebar Launcher | Command Palette | New Snippet |
|:---:|:---:|:---:|
| ![Sidebar launcher](images/demo-sidebar.gif) | ![Command palette](images/demo-command-palette.gif) | ![New snippet](images/demo-new-snippet.gif) |

## Usage

Open the command palette (`Ctrl+Shift+P` / `Cmd+Shift+P`) and run:

- **Snippet Manager: Open** — open the snippet manager panel
- **Snippet Manager: New Snippet** — create a new snippet

Or click the LiveTem icon in the activity bar to open the sidebar launcher.

## Requirements

VS Code 1.85.0 or later.
```

- [ ] **Step 2: Verify the file looks correct**

```bash
cat README.md
```

Check that the hero image line `![LiveTem demo](images/demo-editor.gif)` appears right after the description, and the 3-column table appears under Features.

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: update README with demo-first GIF layout for marketplace"
```

---

### Task 3: Exclude images from VSIX package

**Files:**
- Modify: `.vscodeignore`

- [ ] **Step 1: Add `images/**` to .vscodeignore**

Open `.vscodeignore` and append `images/**` on a new line at the end. The file currently ends with:

```
out/test/**
```

After editing it should end with:

```
out/test/**
images/**
```

- [ ] **Step 2: Verify .vscodeignore contains the new line**

```bash
cat .vscodeignore
```

Expected: `images/**` appears in the output.

- [ ] **Step 3: Commit**

```bash
git add .vscodeignore
git commit -m "chore: exclude images dir from VSIX package"
```

---

### Note: Adding your GIF files

After the above tasks are complete, record and place your 4 GIF files:

| File path | What to record |
|---|---|
| `images/demo-editor.gif` | Main snippet editor open — scroll the list, click a snippet, edit the body (~6s) |
| `images/demo-sidebar.gif` | Click the LiveTem icon in the activity bar → sidebar opens → click "Open Snippet Manager" (~4s) |
| `images/demo-command-palette.gif` | Cmd+Shift+P → type "snippet" → custom icon visible → press Enter (~3s) |
| `images/demo-new-snippet.gif` | Click New Snippet → fill in name/body → save (~5s) |

**Capture steps:**
1. Press `F5` in VS Code to open Extension Development Host
2. Set the window to ~1280×800
3. Record with **Kap** (exports GIF directly) or QuickTime → convert with ffmpeg:
   ```bash
   ffmpeg -i input.mov -vf "fps=15,scale=800:-1:flags=lanczos,palettegen" palette.png && \
   ffmpeg -i input.mov -i palette.png -vf "fps=15,scale=800:-1:flags=lanczos,paletteuse" output.gif
   ```
4. Drop GIFs into `images/`, then:
   ```bash
   git add images/
   git commit -m "assets: add marketplace demo GIFs"
   ```
