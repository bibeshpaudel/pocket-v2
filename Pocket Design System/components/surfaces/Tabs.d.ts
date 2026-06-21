export interface TabsProps {
  /** [{id, label}] or plain strings */
  items: Array<{ id: string; label: string } | string>;
  active?: string;
  onChange?: (id: string) => void;
}
