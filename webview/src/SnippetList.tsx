import React from 'react';
import { Snippet } from './types';
interface Props { snippets: Snippet[]; selectedId: string | null; onSelect: (id: string) => void; onNew: () => void; }
export default function SnippetList(_props: Props) { return <div />; }
