export interface InputProps {
  label?: string;
  hint?: string;
  /** Error message; turns the border clay */
  error?: string;
  /** Mono for code/data values (hashes, URLs, tokens) */
  mono?: boolean;
  placeholder?: string;
  value?: string;
  onChange?: (e: any) => void;
  disabled?: boolean;
  type?: string;
  style?: any;
}
