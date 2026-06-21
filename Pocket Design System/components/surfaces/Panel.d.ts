export interface PanelProps {
  /** Caps header label, e.g. "Input", "Output" */
  title?: string;
  /** Mono meta on the right (counts, status) — string or nodes */
  meta?: any;
  /** Action buttons (CopyButton, IconButton) */
  actions?: any;
  /** raised (default) | sunken (input wells) | code (dark pane) */
  variant?: "raised" | "sunken" | "code";
  children?: any;
  style?: any;
}
