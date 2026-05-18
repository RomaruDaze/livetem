import Editor, { OnMount } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';

interface Props {
  value: string;
  onChange: (value: string) => void;
  language?: string;
}

export default function BodyEditor({ value, onChange, language = 'plaintext' }: Props) {
  const handleMount: OnMount = (editor) => {
    // VS Code webviews block Monaco's internal clipboard path; call the API directly instead.
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyV, () => {
      void navigator.clipboard.readText().then(text => {
        const sel = editor.getSelection();
        if (sel) {
          editor.executeEdits('paste', [{ range: sel, text, forceMoveMarkers: true }]);
          editor.focus();
        }
      });
    });
  };

  return (
    <div className="body-editor-wrap">
      <Editor
        height="200px"
        language={language}
        theme="vs-dark"
        value={value}
        onMount={handleMount}
        onChange={val => onChange(val ?? '')}
        options={{
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          wordWrap: 'off',
          fontSize: 13,
          lineNumbers: 'on',
          renderLineHighlight: 'none',
          overviewRulerLanes: 0,
          folding: false,
          padding: { top: 6, bottom: 6 },
          autoIndent: 'full',
          tabSize: 4,
          insertSpaces: true,
        }}
      />
    </div>
  );
}
