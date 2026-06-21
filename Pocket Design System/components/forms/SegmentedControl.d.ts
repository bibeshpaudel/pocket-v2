export interface SegmentedControlProps {
  /** 2–5 short options: [{value, label}] or strings */
  options: Array<{ value: string; label: string } | string>;
  value?: string;
  onChange?: (value: string) => void;
  /** Mono labels (e.g. "v1", "SHA-256") */
  mono?: boolean;
}
