export interface IconProps {
  /** Lucide icon name, kebab-case (e.g. "braces", "copy", "shield") */
  name: string;
  /** Pixel size. 16 inline/controls, 18 tool glyphs, 20 nav. */
  size?: number;
  strokeWidth?: number;
  style?: any;
  className?: string;
}
