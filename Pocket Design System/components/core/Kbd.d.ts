export interface KbdProps {
  /** Keys in press order, e.g. ["⌘","K"]. Use unicode: ⌘ ⇧ ⌥ ⏎ ⎋ */
  keys?: string[];
  children?: any;
}
