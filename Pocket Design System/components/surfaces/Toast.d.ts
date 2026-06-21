export interface ToastProps {
  kind?: "ok" | "danger" | "neutral";
  /** Override the default kind icon */
  icon?: string;
  children?: any;
  style?: any;
}
