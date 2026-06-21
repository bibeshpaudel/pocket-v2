export interface SelectProps {
  /** [{value, label}] or plain strings */
  options: Array<{ value: string; label: string } | string>;
  value?: string;
  onChange?: (e: any) => void;
  disabled?: boolean;
  style?: any;
}
