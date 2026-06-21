/**
 * @startingPoint section="Components" subtitle="Home-grid tool card with star-on-hover" viewport="360x150"
 */
export interface ToolCardProps {
  /** Lucide icon name (use the category glyph) */
  icon?: string;
  name: string;
  /** One line, ≤60 chars */
  description?: string;
  starred?: boolean;
  /** Shows the star button when provided */
  onStar?: () => void;
  onClick?: (e: any) => void;
  /** Row layout for "Recently used" lists */
  compact?: boolean;
}
