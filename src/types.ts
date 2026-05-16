export interface Snippet {
  id: string;
  name: string;
  prefix: string;
  description: string;
  body: string[];
  scope: string;
  /** Absolute path to the .json file this snippet is stored in. Empty string for unsaved new snippets. */
  source: string;
}

export type HostMessage =
  | { type: 'init';    snippets: Snippet[] }
  | { type: 'saved';   snippet: Snippet }
  | { type: 'deleted'; id: string }
  | { type: 'error';   message: string };

export type WebviewMessage =
  | { type: 'ready' }
  | { type: 'save';   snippet: Snippet; previousName?: string }
  | { type: 'delete'; id: string; name: string; source: string };
