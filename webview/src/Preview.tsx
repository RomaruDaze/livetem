import React, { useMemo } from 'react';

interface Props {
  body: string[];
}

function renderPreview(body: string[]): string {
  return body
    .join('\n')
    .replace(/\$\{(\d+):([^}]+)\}/g, (_m, _n, label) => `‹${label}›`)
    .replace(/\$(\d+)/g, (_m, n) => `‹cursor${n}›`)
    .replace(/‹cursor0›/g, '‹end›');
}

export default function Preview({ body }: Props) {
  const rendered = useMemo(() => renderPreview(body), [body]);
  return <pre className="preview-block">{rendered}</pre>;
}
