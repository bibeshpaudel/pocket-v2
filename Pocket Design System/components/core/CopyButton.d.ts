export interface CopyButtonProps {
  /** Text to copy */
  text?: string;
  /** Lazy alternative to text — called at click time */
  getText?: () => string;
  /** Button label (default "Copy") */
  label?: string;
  /** Style for placement on dark code panes */
  onDark?: boolean;
}
