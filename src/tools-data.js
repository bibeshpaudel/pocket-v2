export const POCKET_CATEGORIES = [
  { id: "Formatters", icon: "braces" },
  { id: "Development", icon: "terminal" },
  { id: "Generators", icon: "sparkles" },
  { id: "Converters", icon: "repeat" },
  { id: "Text", icon: "type" },
  { id: "Security", icon: "shield" },
  { id: "Images", icon: "image" },
  { id: "PDF", icon: "file-text" },
  { id: "CSV Tools", icon: "table" },
  { id: "Web", icon: "globe" },
];

export const POCKET_TOOLS = [
  { id: "json-formatter", name: "JSON Formatter", category: "Formatters", icon: "braces", description: "Pretty-print, minify, validate" },
  { id: "xml-formatter", name: "XML Formatter", category: "Formatters", icon: "code-xml", description: "Indent and validate XML" },
  { id: "compiler", name: "Online Compiler", category: "Development", icon: "terminal", description: "Run JS, Python, C++ & more", network: true },
  { id: "git-cheatsheet", name: "Git Cheatsheet", category: "Development", icon: "git-branch", description: "Common commands, searchable" },
  { id: "qr-code", name: "QR Code Generator", category: "Generators", icon: "qr-code", description: "Text or URL to QR" },
  { id: "password", name: "Password Generator", category: "Generators", icon: "key-round", description: "Strong, random, local" },
  { id: "lorem-ipsum", name: "Lorem Ipsum", category: "Generators", icon: "text", description: "Placeholder paragraphs" },
  { id: "uuid", name: "UUID Generator", category: "Generators", icon: "fingerprint", description: "v1 and v4, in bulk" },
  { id: "mermaid", name: "Mermaid Editor", category: "Generators", icon: "workflow", description: "Diagrams from text" },
  { id: "base64", name: "Base64 Converter", category: "Converters", icon: "binary", description: "Encode and decode" },
  { id: "unit", name: "Unit Converter", category: "Converters", icon: "ruler", description: "Length, mass, data, more" },
  { id: "timestamp", name: "Timestamp Converter", category: "Converters", icon: "clock", description: "Unix ↔ human time" },
  { id: "timezone", name: "Timezone Converter", category: "Converters", icon: "globe", description: "Compare times across zones" },
  { id: "markdown", name: "Markdown Previewer", category: "Text", icon: "eye", description: "Live side-by-side preview" },
  { id: "syntax", name: "Syntax Highlighter", category: "Text", icon: "highlighter", description: "Colorize a snippet" },
  { id: "diff", name: "Text Diff", category: "Text", icon: "file-diff", description: "Compare two texts" },
  { id: "case", name: "Case Converter", category: "Text", icon: "case-sensitive", description: "camel, snake, kebab, title" },
  { id: "word-counter", name: "Word Counter", category: "Text", icon: "sigma", description: "Words, chars, reading time" },
  { id: "regex", name: "RegEx Tester", category: "Text", icon: "regex", description: "Live matches and groups" },
  { id: "hash", name: "Hash Generator", category: "Security", icon: "shield", description: "MD5, SHA-1, SHA-256" },
  { id: "aes", name: "AES Encrypt / Decrypt", category: "Security", icon: "lock", description: "Client-side only" },
  { id: "jwt", name: "JWT Debugger", category: "Security", icon: "key-square", description: "Decode and verify tokens" },
  { id: "cert-inspector", name: "Certificate Inspector", category: "Security", icon: "file-badge", description: "Inspect X.509 certs, verify sigs" },
  { id: "image-compressor", name: "Image Compressor", category: "Images", icon: "image-down", description: "Smaller files, same look" },
  { id: "svg-viewer", name: "SVG Viewer", category: "Images", icon: "shapes", description: "Preview and clean SVG" },
  { id: "image-converter", name: "Image Converter", category: "Images", icon: "images", description: "PNG ↔ JPG ↔ WebP" },
  { id: "image-analyzer", name: "Image Analyzer", category: "Images", icon: "scan-search", description: "EXIF and metadata" },
  { id: "pdf-to-text", name: "PDF to Text", category: "PDF", icon: "file-text", description: "Extract plain text" },
  { id: "merge-pdfs", name: "Merge PDFs", category: "PDF", icon: "files", description: "Combine and reorder" },
  { id: "word-to-pdf", name: "Word to PDF", category: "PDF", icon: "file-type", description: "DOCX to PDF" },
  { id: "csv-json", name: "CSV ↔ JSON", category: "CSV Tools", icon: "table", description: "Both directions" },
  { id: "csv-sql", name: "CSV to SQL", category: "CSV Tools", icon: "database", description: "INSERT statements" },
  { id: "csv-editor", name: "CSV Editor", category: "CSV Tools", icon: "table-2", description: "Edit rows in place" },
  { id: "url-codec", name: "URL Encoder / Decoder", category: "Web", icon: "link", description: "Percent-encoding" },
  { id: "ip-lookup", name: "IP Lookup", category: "Web", icon: "map-pin", description: "Where an address lives", network: true },
  { id: "dns-lookup", name: "DNS Lookup", category: "Web", icon: "server", description: "A, MX, TXT records", network: true },
  { id: "env-inspector", name: "Environment Inspector", category: "Web", icon: "activity", description: "Browser & device diagnostics" },
  { id: "color-converter", name: "Color Converter", category: "Converters", icon: "palette", description: "HEX, RGB, HSL, HSV" },
  { id: "number-base", name: "Number Base Converter", category: "Converters", icon: "calculator", description: "Bin, oct, dec, hex" },
  { id: "json-yaml", name: "JSON ↔ YAML", category: "Converters", icon: "arrow-left-right", description: "Both directions" },
  { id: "cron", name: "Cron Explainer", category: "Development", icon: "calendar-clock", description: "Decode cron schedules" },
  { id: "env-json", name: ".env ↔ JSON", category: "Development", icon: "settings", description: "Parse dotenv files" },
  { id: "text-escape", name: "Escape / Unescape", category: "Text", icon: "ampersand", description: "HTML, JSON, Unicode" },
  { id: "slugify", name: "Slugify", category: "Text", icon: "spell-check", description: "URL-safe slugs" },
  { id: "ulid", name: "ULID / NanoID", category: "Generators", icon: "id-card", description: "Sortable & short IDs" },
  { id: "sample-data", name: "Sample Data", category: "Generators", icon: "dices", description: "Fake rows: CSV / JSON" },
];

// Tiny JSON syntax highlighter → HTML with --syn-* colors
export function pocketHighlightJSON(src) {
  const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return esc(src).replace(
    /("(?:\\.|[^"\\])*")(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|[{}\[\],:]/g,
    (m, str, colon, kw) => {
      if (str) {
        return colon
          ? '<span style="color:var(--syn-key)">' + str + '</span><span style="color:var(--syn-punct)">' + colon + "</span>"
          : '<span style="color:var(--syn-string)">' + str + '</span>';
      }
      if (kw) return '<span style="color:var(--syn-keyword)">' + kw + '</span>';
      if (/^[{}\[\],:]$/.test(m)) return '<span style="color:var(--syn-punct)">' + m + '</span>';
      return '<span style="color:var(--syn-number)">' + m + '</span>';
    }
  );
}

// Tiny XML syntax highlighter → HTML with --syn-* colors
export function pocketHighlightXML(src) {
  const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return esc(src)
    // Comments
    .replace(/(&lt;!--[\s\S]*?--&gt;)/g, '<span style="color:var(--syn-comment)">$1</span>')
    // Processing Instructions (XML declaration)
    .replace(/(&lt;\?[\s\S]*?\?&gt;)/g, '<span style="color:var(--syn-keyword)">$1</span>')
    // Tags
    .replace(/(&lt;\/?[a-zA-Z0-9_:-]+)(\s+[\s\S]*?)?(\/?&gt;)/g, (match, tagHead, attrs, tagTail) => {
      let formattedAttrs = attrs || "";
      if (attrs) {
        formattedAttrs = attrs.replace(
          /([a-zA-Z0-9_:-]+)=((['"])[\s\S]*?\3)/g,
          ' <span style="color:var(--syn-key)">$1</span>=<span style="color:var(--syn-string)">$2</span>'
        );
      }
      const tagHeadFormatted = tagHead.replace(
        /(&lt;\/?)([a-zA-Z0-9_:-]+)/,
        '$1<span style="color:var(--syn-keyword)">$2</span>'
      );
      return tagHeadFormatted + formattedAttrs + tagTail;
    });
}

