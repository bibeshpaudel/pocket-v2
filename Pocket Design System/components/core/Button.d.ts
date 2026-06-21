/**
 * @startingPoint section="Components" subtitle="Amber primary, secondary, ghost and danger buttons" viewport="360x120"
 */
export interface ButtonProps {
  /** primary = amber w/ ink text (one per view); secondary = outlined; ghost = bare; danger = clay */
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  /** Optional leading Lucide icon name */
  icon?: string;
  disabled?: boolean;
  onClick?: (e: any) => void;
  children?: any;
}
