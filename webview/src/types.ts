export interface Snippet {
  id: string;
  name: string;
  prefix: string;
  description: string;
  body: string[];
  scope: string;
  source: string;
}

export type HostMessage =
  | { type: 'init';    snippets: Snippet[] }
  | { type: 'saved';   snippet: Snippet }
  | { type: 'deleted'; id: string }
  | { type: 'error';   message: string };

export type WebviewMessage =
  | { type: 'save';   snippet: Snippet }
  | { type: 'delete'; id: string; name: string; source: string };
