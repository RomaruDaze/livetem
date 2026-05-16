import React from 'react';
import { Snippet } from './types';
interface Props { snippet: Snippet | null; isNew: boolean; allSnippets: Snippet[]; onSave: (snippet: Snippet, previousName?: string) => void; onDelete: (snippet: Snippet) => void; }
export default function EditorPane(_props: Props) { return <div />; }
