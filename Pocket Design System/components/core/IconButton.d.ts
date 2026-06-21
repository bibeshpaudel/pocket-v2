export interface IconButtonProps {
  /** Lucide icon name */
  icon: string;
  /** Accessible label (also the tooltip) — required */
  label: string;
  size?: "sm" | "md";
  /** ghost (default) or outline (bordered, raised) */
  variant?: "ghost" | "outline";
  /** Amber active state (e.g. a starred favorite) */
  active?: boolean;
  /** Fill the glyph when active (for star/heart toggles) */
  fill?: boolean;
  disabled?: boolean;
  onClick?: (e: any) => void;
}
