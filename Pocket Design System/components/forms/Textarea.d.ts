export interface TextareaProps {
  /** Mono (default true) — Pocket inputs are usually code/data */
  mono?: boolean;
  /** Strip chrome for use inside a Panel body */
  bare?: boolean;
  placeholder?: string;
  value?: string;
  onChange?: (e: any) => void;
  rows?: number;
  style?: any;
}
