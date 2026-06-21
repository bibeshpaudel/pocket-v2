/**
 * @startingPoint section="Components" subtitle="⌘K palette — Pocket's primary navigation" viewport="640x420"
 */
export interface CommandPaletteProps {
  open: boolean;
  onClose?: () => void;
  /** All tools: [{id, name, category, icon, keywords?}] */
  tools: Array<{ id: string; name: string; category: string; icon?: string; keywords?: string }>;
  /** Tool ids, most recent first — shown as "Recently used" when query is empty */
  recents?: string[];
  onSelect?: (tool: any) => void;
  placeholder?: string;
}
