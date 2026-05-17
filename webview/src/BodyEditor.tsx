import React from 'react';
import Editor from '@monaco-editor/react';

interface Props {
  value: string;
  onChange: (value: string) => void;
}

export default function BodyEditor({ value, onChange }: Props) {
  return (
    <div className="body-editor-wrap">
      <Editor
        height="200px"
        language="plaintext"
        theme="vs-dark"
        value={value}
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
        }}
      />
    </div>
  );
}
