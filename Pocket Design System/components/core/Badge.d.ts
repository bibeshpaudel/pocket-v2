export interface BadgeProps {
  /** neutral | accent (amber) | ok (moss) | warn (ochre) | danger (clay) */
  kind?: "neutral" | "accent" | "ok" | "warn" | "danger";
  /** Leading status dot */
  dot?: boolean;
  children?: any;
}
