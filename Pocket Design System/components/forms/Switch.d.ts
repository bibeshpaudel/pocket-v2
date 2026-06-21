export interface SwitchProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  /** Optional inline label rendered to the right */
  label?: string;
  disabled?: boolean;
}
