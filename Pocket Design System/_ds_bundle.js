/* @ds-bundle: {"format":3,"namespace":"PocketDesignSystem_654e67","components":[{"name":"Badge","sourcePath":"components/core/Badge.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"CopyButton","sourcePath":"components/core/CopyButton.jsx"},{"name":"Icon","sourcePath":"components/core/Icon.jsx"},{"name":"IconButton","sourcePath":"components/core/IconButton.jsx"},{"name":"Kbd","sourcePath":"components/core/Kbd.jsx"},{"name":"Logo","sourcePath":"components/core/Logo.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"},{"name":"SegmentedControl","sourcePath":"components/forms/SegmentedControl.jsx"},{"name":"Select","sourcePath":"components/forms/Select.jsx"},{"name":"Switch","sourcePath":"components/forms/Switch.jsx"},{"name":"Textarea","sourcePath":"components/forms/Textarea.jsx"},{"name":"CommandPalette","sourcePath":"components/navigation/CommandPalette.jsx"},{"name":"EmptyState","sourcePath":"components/surfaces/EmptyState.jsx"},{"name":"Panel","sourcePath":"components/surfaces/Panel.jsx"},{"name":"Tabs","sourcePath":"components/surfaces/Tabs.jsx"},{"name":"Toast","sourcePath":"components/surfaces/Toast.jsx"},{"name":"ToolCard","sourcePath":"components/surfaces/ToolCard.jsx"}],"sourceHashes":{"components/core/Badge.jsx":"001b2706bfa4","components/core/Button.jsx":"efa54806a16e","components/core/CopyButton.jsx":"5e9ecba738d0","components/core/Icon.jsx":"e4e23a6c15d0","components/core/IconButton.jsx":"a256a310d427","components/core/Kbd.jsx":"a300a28726bb","components/core/Logo.jsx":"19b2825551b3","components/forms/Input.jsx":"7c0d94b52210","components/forms/SegmentedControl.jsx":"9b84efd5cdd8","components/forms/Select.jsx":"3060125790f1","components/forms/Switch.jsx":"b452215015ad","components/forms/Textarea.jsx":"131717d4f9b0","components/navigation/CommandPalette.jsx":"a414844425ba","components/surfaces/EmptyState.jsx":"359242abd809","components/surfaces/Panel.jsx":"50811ace2a6b","components/surfaces/Tabs.jsx":"3d581e5079ad","components/surfaces/Toast.jsx":"9caa81550eef","components/surfaces/ToolCard.jsx":"5e9e94779717","ui_kits/pocket_app/App.jsx":"ef942081a425","ui_kits/pocket_app/HomeScreen.jsx":"0a3895c8bad0","ui_kits/pocket_app/ToolScreens.jsx":"cc2d3b6e2275","ui_kits/pocket_app/tools-data.js":"ddc7a1cfff61"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.PocketDesignSystem_654e67 = window.PocketDesignSystem_654e67 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/core/Badge.jsx
try { (() => {
const css = `
.pkt-badge {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 2px 9px; border-radius: var(--radius-full);
  font-family: var(--font-sans); font-size: var(--text-xs); font-weight: var(--weight-semibold);
  line-height: 1.6; white-space: nowrap;
}
.pkt-badge--neutral { background: var(--surface-hover); color: var(--text-secondary); }
.pkt-badge--accent  { background: var(--accent-soft);  color: var(--amber-700); }
.pkt-badge--ok      { background: var(--ok-soft);      color: var(--ok); }
.pkt-badge--warn    { background: var(--warn-soft);    color: var(--warn); }
.pkt-badge--danger  { background: var(--danger-soft);  color: var(--danger); }
.pkt-badge--dot::before {
  content: ""; width: 6px; height: 6px; border-radius: 999px; background: currentColor;
}
`;
if (typeof document !== "undefined" && !document.getElementById("pkt-css-badge")) {
  const s = document.createElement("style");
  s.id = "pkt-css-badge";
  s.textContent = css;
  document.head.appendChild(s);
}

/** Status pill. Earth-toned: ok=moss, danger=clay, warn=ochre. */
function Badge({
  kind = "neutral",
  dot = false,
  children
}) {
  return /*#__PURE__*/React.createElement("span", {
    className: "pkt-badge pkt-badge--" + kind + (dot ? " pkt-badge--dot" : "")
  }, children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Badge.jsx", error: String((e && e.message) || e) }); }

// components/core/Icon.jsx
try { (() => {
const cache = new Map();
const pending = new Map();

/** Inline Lucide icon. Fetches the SVG from the lucide-static CDN once,
    caches it, and renders it inline so it inherits currentColor. */
function Icon({
  name,
  size = 16,
  strokeWidth = 2,
  style,
  className
}) {
  const [inner, setInner] = React.useState(() => cache.get(name) || null);
  React.useEffect(() => {
    let alive = true;
    if (cache.has(name)) {
      setInner(cache.get(name));
      return;
    }
    if (!pending.has(name)) {
      pending.set(name, fetch("https://unpkg.com/lucide-static@0.469.0/icons/" + name + ".svg").then(r => r.ok ? r.text() : Promise.reject(new Error("icon " + name))).then(text => {
        const body = text.replace(/^[\s\S]*?<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");
        cache.set(name, body);
        return body;
      }));
    }
    pending.get(name).then(body => {
      if (alive) setInner(body);
    }).catch(() => {});
    return () => {
      alive = false;
    };
  }, [name]);
  return /*#__PURE__*/React.createElement("svg", {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: strokeWidth,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": "true",
    className: className,
    style: {
      flexShrink: 0,
      display: "inline-block",
      verticalAlign: "middle",
      ...style
    },
    dangerouslySetInnerHTML: inner ? {
      __html: inner
    } : undefined
  });
}
Object.assign(__ds_scope, { Icon });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Icon.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const css = `
.pkt-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  font-family: var(--font-sans); font-weight: var(--weight-semibold);
  border-radius: var(--radius-md); border: 1px solid transparent;
  cursor: pointer; white-space: nowrap; user-select: none;
  transition: background var(--duration-fast) var(--ease-out),
              border-color var(--duration-fast) var(--ease-out),
              color var(--duration-fast) var(--ease-out);
}
.pkt-btn:active:not(:disabled) { transform: translateY(0.5px); }
.pkt-btn:disabled { opacity: 0.45; cursor: default; }

.pkt-btn--md { height: 34px; padding: 0 14px; font-size: var(--text-sm); }
.pkt-btn--sm { height: 28px; padding: 0 10px; font-size: var(--text-xs); }
.pkt-btn--lg { height: 40px; padding: 0 18px; font-size: var(--text-base); }

.pkt-btn--primary { background: var(--accent); color: var(--text-on-accent); }
.pkt-btn--primary:hover:not(:disabled) { background: var(--accent-strong); }

.pkt-btn--secondary { background: var(--surface-raised); border-color: var(--border-default); color: var(--text-primary); }
.pkt-btn--secondary:hover:not(:disabled) { background: var(--surface-hover); border-color: var(--border-strong); }

.pkt-btn--ghost { background: transparent; color: var(--text-secondary); }
.pkt-btn--ghost:hover:not(:disabled) { background: var(--surface-hover); color: var(--text-primary); }

.pkt-btn--danger { background: var(--danger-soft); color: var(--danger); }
.pkt-btn--danger:hover:not(:disabled) { background: var(--danger); color: #FFFDF8; }
`;
if (typeof document !== "undefined" && !document.getElementById("pkt-css-button")) {
  const s = document.createElement("style");
  s.id = "pkt-css-button";
  s.textContent = css;
  document.head.appendChild(s);
}

/** Pocket button. Primary is amber with dark ink text; one per view. */
function Button({
  variant = "primary",
  size = "md",
  icon,
  children,
  ...rest
}) {
  const iconSize = size === "sm" ? 13 : size === "lg" ? 17 : 15;
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    className: "pkt-btn pkt-btn--" + size + " pkt-btn--" + variant
  }, rest), icon ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: iconSize
  }) : null, children);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/CopyButton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const css = `
.pkt-copybtn {
  display: inline-flex; align-items: center; gap: 6px;
  height: 28px; padding: 0 10px;
  font-family: var(--font-sans); font-size: var(--text-xs); font-weight: var(--weight-semibold);
  color: var(--text-secondary); background: transparent;
  border: 1px solid var(--border-default); border-radius: var(--radius-md);
  cursor: pointer;
  transition: background var(--duration-fast) var(--ease-out), color var(--duration-fast) var(--ease-out);
}
.pkt-copybtn:hover { background: var(--surface-hover); color: var(--text-primary); }
.pkt-copybtn--copied, .pkt-copybtn--copied:hover { color: var(--ok); border-color: var(--ok-soft); background: var(--ok-soft); }
.pkt-copybtn--dark { border-color: var(--code-line); color: var(--syn-punct); }
.pkt-copybtn--dark:hover { background: var(--code-line); color: var(--code-fg); }
`;
if (typeof document !== "undefined" && !document.getElementById("pkt-css-copybtn")) {
  const s = document.createElement("style");
  s.id = "pkt-css-copybtn";
  s.textContent = css;
  document.head.appendChild(s);
}

/** Copies `text` (or getText()) to the clipboard; confirms inline for 1.5s. */
function CopyButton({
  text,
  getText,
  label = "Copy",
  onDark = false,
  ...rest
}) {
  const [copied, setCopied] = React.useState(false);
  const timer = React.useRef(null);
  const handle = () => {
    const value = getText ? getText() : text;
    try {
      navigator.clipboard.writeText(value == null ? "" : String(value));
    } catch (e) {/* no-op */}
    setCopied(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 1500);
  };
  React.useEffect(() => () => clearTimeout(timer.current), []);
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    className: "pkt-copybtn" + (copied ? " pkt-copybtn--copied" : "") + (onDark ? " pkt-copybtn--dark" : ""),
    onClick: handle
  }, rest), /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: copied ? "check" : "copy",
    size: 13
  }), copied ? "Copied" : label);
}
Object.assign(__ds_scope, { CopyButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/CopyButton.jsx", error: String((e && e.message) || e) }); }

// components/core/IconButton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const css = `
.pkt-iconbtn {
  display: inline-flex; align-items: center; justify-content: center;
  border-radius: var(--radius-md); border: 1px solid transparent;
  background: transparent; color: var(--text-secondary); cursor: pointer;
  transition: background var(--duration-fast) var(--ease-out), color var(--duration-fast) var(--ease-out);
}
.pkt-iconbtn:hover:not(:disabled) { background: var(--surface-hover); color: var(--text-primary); }
.pkt-iconbtn:active:not(:disabled) { transform: translateY(0.5px); }
.pkt-iconbtn:disabled { opacity: 0.45; cursor: default; }
.pkt-iconbtn--outline { border-color: var(--border-default); background: var(--surface-raised); }
.pkt-iconbtn--outline:hover:not(:disabled) { border-color: var(--border-strong); }
.pkt-iconbtn--md { width: 34px; height: 34px; }
.pkt-iconbtn--sm { width: 28px; height: 28px; }
.pkt-iconbtn--active { color: var(--amber-600); background: var(--accent-soft); }
.pkt-iconbtn--active:hover:not(:disabled) { background: var(--accent-soft); color: var(--amber-700); }
`;
if (typeof document !== "undefined" && !document.getElementById("pkt-css-iconbtn")) {
  const s = document.createElement("style");
  s.id = "pkt-css-iconbtn";
  s.textContent = css;
  document.head.appendChild(s);
}

/** Square icon-only button. Always pass a label for accessibility. */
function IconButton({
  icon,
  label,
  size = "md",
  variant = "ghost",
  active = false,
  fill = false,
  ...rest
}) {
  const cls = ["pkt-iconbtn", "pkt-iconbtn--" + size];
  if (variant === "outline") cls.push("pkt-iconbtn--outline");
  if (active) cls.push("pkt-iconbtn--active");
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    className: cls.join(" "),
    "aria-label": label,
    title: label
  }, rest), /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: size === "sm" ? 14 : 16,
    style: active && fill ? {
      fill: "currentColor"
    } : undefined
  }));
}
Object.assign(__ds_scope, { IconButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/IconButton.jsx", error: String((e && e.message) || e) }); }

// components/core/Kbd.jsx
try { (() => {
const css = `
.pkt-kbd {
  display: inline-flex; align-items: center; justify-content: center;
  min-width: 20px; padding: 2px 7px;
  font-family: var(--font-mono); font-size: 11px; line-height: 1.4;
  color: var(--text-secondary);
  background: var(--surface-sunken);
  border: 1px solid var(--border-default); border-bottom-width: 2px;
  border-radius: var(--radius-sm);
}
.pkt-kbd-group { display: inline-flex; gap: 4px; vertical-align: middle; }
`;
if (typeof document !== "undefined" && !document.getElementById("pkt-css-kbd")) {
  const s = document.createElement("style");
  s.id = "pkt-css-kbd";
  s.textContent = css;
  document.head.appendChild(s);
}

/** Keyboard shortcut capsule(s). Pass keys as an array: ["⌘","K"]. */
function Kbd({
  keys,
  children
}) {
  const list = keys || (children != null ? [children] : []);
  return /*#__PURE__*/React.createElement("span", {
    className: "pkt-kbd-group"
  }, list.map((k, i) => /*#__PURE__*/React.createElement("kbd", {
    key: i,
    className: "pkt-kbd"
  }, k)));
}
Object.assign(__ds_scope, { Kbd });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Kbd.jsx", error: String((e && e.message) || e) }); }

// components/core/Logo.jsx
try { (() => {
/** Pocket logo: the amber mark, optionally with the wordmark. */
function Logo({
  size = 28,
  wordmark = true,
  style
}) {
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: Math.round(size * 0.36),
      ...style
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: size,
    height: size,
    viewBox: "0 0 32 32",
    "aria-label": "Pocket"
  }, /*#__PURE__*/React.createElement("rect", {
    x: "0",
    y: "0",
    width: "32",
    height: "32",
    rx: "8",
    fill: "#f59e0b"
  }), /*#__PURE__*/React.createElement("text", {
    x: "50%",
    y: "54%",
    dominantBaseline: "middle",
    textAnchor: "middle",
    fill: "#f8fafc",
    fontFamily: "var(--font-sans), system-ui, sans-serif",
    fontWeight: "bold",
    fontSize: "20"
  }, "P")), wordmark ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-sans)",
      fontWeight: "var(--weight-semibold)",
      fontSize: Math.round(size * 0.71),
      letterSpacing: "var(--tracking-tight)",
      color: "var(--text-primary)",
      lineHeight: 1
    }
  }, "Pocket") : null);
}
Object.assign(__ds_scope, { Logo });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Logo.jsx", error: String((e && e.message) || e) }); }

// components/forms/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const css = `
.pkt-field { display: flex; flex-direction: column; gap: 6px; font-family: var(--font-sans); }
.pkt-field__label { font-size: var(--text-sm); font-weight: var(--weight-medium); color: var(--text-primary); }
.pkt-field__hint { font-size: var(--text-xs); color: var(--text-tertiary); }
.pkt-field__error { font-size: var(--text-xs); color: var(--danger); }

.pkt-input {
  height: 34px; padding: 0 12px; width: 100%;
  font-family: var(--font-sans); font-size: var(--text-base); color: var(--text-primary);
  background: var(--surface-sunken);
  border: 1px solid var(--border-default); border-radius: var(--radius-md);
  transition: border-color var(--duration-fast) var(--ease-out), background var(--duration-fast) var(--ease-out);
}
.pkt-input::placeholder { color: var(--text-tertiary); }
.pkt-input:hover:not(:disabled):not(:focus) { border-color: var(--border-strong); }
.pkt-input:focus { outline: none; border-color: var(--accent); background: var(--surface-raised); box-shadow: 0 0 0 3px var(--accent-soft); }
.pkt-input:disabled { opacity: 0.55; }
.pkt-input--mono { font-family: var(--font-mono); font-size: var(--text-sm); }
.pkt-input--error, .pkt-input--error:focus { border-color: var(--danger); box-shadow: 0 0 0 3px var(--danger-soft); }
`;
if (typeof document !== "undefined" && !document.getElementById("pkt-css-input")) {
  const s = document.createElement("style");
  s.id = "pkt-css-input";
  s.textContent = css;
  document.head.appendChild(s);
}

/** Single-line text input on a sunken well; amber focus. */
function Input({
  label,
  hint,
  error,
  mono = false,
  style,
  ...rest
}) {
  const cls = "pkt-input" + (mono ? " pkt-input--mono" : "") + (error ? " pkt-input--error" : "");
  const input = /*#__PURE__*/React.createElement("input", _extends({
    className: cls
  }, rest));
  if (!label && !hint && !error) return React.cloneElement(input, {
    style
  });
  return /*#__PURE__*/React.createElement("label", {
    className: "pkt-field",
    style: style
  }, label ? /*#__PURE__*/React.createElement("span", {
    className: "pkt-field__label"
  }, label) : null, input, error ? /*#__PURE__*/React.createElement("span", {
    className: "pkt-field__error"
  }, error) : hint ? /*#__PURE__*/React.createElement("span", {
    className: "pkt-field__hint"
  }, hint) : null);
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) }); }

// components/forms/SegmentedControl.jsx
try { (() => {
const css = `
.pkt-seg {
  display: inline-flex; gap: 2px; padding: 3px;
  background: var(--surface-sunken); border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
}
.pkt-seg__opt {
  height: 26px; padding: 0 12px; border: none; border-radius: 7px;
  font-family: var(--font-sans); font-size: var(--text-xs); font-weight: var(--weight-semibold);
  color: var(--text-secondary); background: transparent; cursor: pointer;
  transition: background var(--duration-fast) var(--ease-out), color var(--duration-fast) var(--ease-out);
}
.pkt-seg__opt:hover { color: var(--text-primary); }
.pkt-seg__opt--on { background: var(--surface-raised); color: var(--text-primary); box-shadow: var(--shadow-1); border: 1px solid var(--border-default); height: 26px; }
.pkt-seg__opt--mono { font-family: var(--font-mono); }
`;
if (typeof document !== "undefined" && !document.getElementById("pkt-css-seg")) {
  const s = document.createElement("style");
  s.id = "pkt-css-seg";
  s.textContent = css;
  document.head.appendChild(s);
}

/** Compact mode picker (2–5 short options), e.g. encode/decode, v1/v4. */
function SegmentedControl({
  options = [],
  value,
  onChange,
  mono = false
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "pkt-seg",
    role: "tablist"
  }, options.map(o => {
    const opt = typeof o === "string" ? {
      value: o,
      label: o
    } : o;
    const on = opt.value === value;
    return /*#__PURE__*/React.createElement("button", {
      key: opt.value,
      type: "button",
      role: "tab",
      "aria-selected": on,
      className: "pkt-seg__opt" + (on ? " pkt-seg__opt--on" : "") + (mono ? " pkt-seg__opt--mono" : ""),
      onClick: () => onChange && onChange(opt.value)
    }, opt.label);
  }));
}
Object.assign(__ds_scope, { SegmentedControl });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/SegmentedControl.jsx", error: String((e && e.message) || e) }); }

// components/forms/Select.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const css = `
.pkt-select-wrap { position: relative; display: inline-flex; align-items: center; }
.pkt-select {
  appearance: none; -webkit-appearance: none;
  height: 34px; padding: 0 32px 0 12px; min-width: 120px;
  font-family: var(--font-sans); font-size: var(--text-sm); font-weight: var(--weight-medium);
  color: var(--text-primary); background: var(--surface-raised);
  border: 1px solid var(--border-default); border-radius: var(--radius-md);
  cursor: pointer;
  transition: border-color var(--duration-fast) var(--ease-out);
}
.pkt-select:hover { border-color: var(--border-strong); }
.pkt-select:focus { outline: none; border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-soft); }
.pkt-select-wrap .pkt-select-chev { position: absolute; right: 10px; pointer-events: none; color: var(--text-tertiary); }
`;
if (typeof document !== "undefined" && !document.getElementById("pkt-css-select")) {
  const s = document.createElement("style");
  s.id = "pkt-css-select";
  s.textContent = css;
  document.head.appendChild(s);
}

/** Native select with Pocket chrome. options: [{value, label}] or strings. */
function Select({
  options = [],
  value,
  onChange,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("span", {
    className: "pkt-select-wrap",
    style: style
  }, /*#__PURE__*/React.createElement("select", _extends({
    className: "pkt-select",
    value: value,
    onChange: onChange
  }, rest), options.map(o => {
    const opt = typeof o === "string" ? {
      value: o,
      label: o
    } : o;
    return /*#__PURE__*/React.createElement("option", {
      key: opt.value,
      value: opt.value
    }, opt.label);
  })), /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "chevron-down",
    size: 14,
    className: "pkt-select-chev"
  }));
}
Object.assign(__ds_scope, { Select });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Select.jsx", error: String((e && e.message) || e) }); }

// components/forms/Switch.jsx
try { (() => {
const css = `
.pkt-switch {
  position: relative; display: inline-flex; align-items: center;
  width: 36px; height: 21px; border-radius: var(--radius-full);
  background: var(--border-strong); border: none; cursor: pointer; padding: 0;
  transition: background var(--duration-base) var(--ease-out);
}
.pkt-switch::after {
  content: ""; position: absolute; left: 2.5px; top: 2.5px;
  width: 16px; height: 16px; border-radius: 999px; background: var(--white-warm);
  box-shadow: var(--shadow-1);
  transition: transform var(--duration-base) var(--ease-out);
}
.pkt-switch[aria-checked="true"] { background: var(--accent); }
.pkt-switch[aria-checked="true"]::after { transform: translateX(15px); }
.pkt-switch:disabled { opacity: 0.45; cursor: default; }
.pkt-switch-row { display: inline-flex; align-items: center; gap: 10px; font-family: var(--font-sans); font-size: var(--text-sm); color: var(--text-primary); cursor: pointer; }
`;
if (typeof document !== "undefined" && !document.getElementById("pkt-css-switch")) {
  const s = document.createElement("style");
  s.id = "pkt-css-switch";
  s.textContent = css;
  document.head.appendChild(s);
}

/** Toggle for instant-apply options (Pocket has no "Save" buttons). */
function Switch({
  checked = false,
  onChange,
  label,
  disabled
}) {
  const btn = /*#__PURE__*/React.createElement("button", {
    type: "button",
    role: "switch",
    "aria-checked": checked,
    className: "pkt-switch",
    disabled: disabled,
    onClick: () => onChange && onChange(!checked)
  });
  if (!label) return btn;
  return /*#__PURE__*/React.createElement("span", {
    className: "pkt-switch-row",
    onClick: () => !disabled && onChange && onChange(!checked)
  }, btn, label);
}
Object.assign(__ds_scope, { Switch });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Switch.jsx", error: String((e && e.message) || e) }); }

// components/forms/Textarea.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const css = `
.pkt-textarea {
  display: block; width: 100%; min-height: 96px; padding: 10px 12px; resize: vertical;
  font-family: var(--font-mono); font-size: var(--text-sm); line-height: var(--leading-code);
  color: var(--text-primary); background: var(--surface-sunken);
  border: 1px solid var(--border-default); border-radius: var(--radius-md);
  transition: border-color var(--duration-fast) var(--ease-out), background var(--duration-fast) var(--ease-out);
}
.pkt-textarea::placeholder { color: var(--text-tertiary); }
.pkt-textarea:hover:not(:disabled):not(:focus) { border-color: var(--border-strong); }
.pkt-textarea:focus { outline: none; border-color: var(--accent); background: var(--surface-raised); box-shadow: 0 0 0 3px var(--accent-soft); }
.pkt-textarea--sans { font-family: var(--font-sans); font-size: var(--text-base); line-height: var(--leading-normal); }
.pkt-textarea--bare { border: none; border-radius: 0; background: transparent; resize: none; }
.pkt-textarea--bare:focus { background: transparent; box-shadow: none; }
`;
if (typeof document !== "undefined" && !document.getElementById("pkt-css-textarea")) {
  const s = document.createElement("style");
  s.id = "pkt-css-textarea";
  s.textContent = css;
  document.head.appendChild(s);
}

/** Multi-line input; mono by default (Pocket inputs are usually code/data).
    bare=true strips the chrome for use inside a Panel. */
function Textarea({
  mono = true,
  bare = false,
  style,
  ...rest
}) {
  const cls = "pkt-textarea" + (mono ? "" : " pkt-textarea--sans") + (bare ? " pkt-textarea--bare" : "");
  return /*#__PURE__*/React.createElement("textarea", _extends({
    className: cls,
    style: style,
    spellCheck: false
  }, rest));
}
Object.assign(__ds_scope, { Textarea });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Textarea.jsx", error: String((e && e.message) || e) }); }

// components/navigation/CommandPalette.jsx
try { (() => {
const css = `
.pkt-cp-overlay {
  position: fixed; inset: 0; z-index: var(--z-overlay);
  background: rgba(30, 26, 20, 0.35);
  display: flex; justify-content: center; align-items: flex-start; padding-top: 12vh;
  animation: pkt-cp-fade var(--duration-fast) var(--ease-out);
}
.pkt-cp {
  width: 580px; max-width: calc(100vw - 48px);
  background: var(--surface-raised); border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl); box-shadow: var(--shadow-3); overflow: hidden;
  font-family: var(--font-sans);
  animation: pkt-cp-rise var(--duration-base) var(--ease-out);
}
@keyframes pkt-cp-fade { from { opacity: 0; } }
@keyframes pkt-cp-rise { from { opacity: 0; transform: translateY(8px); } }
.pkt-cp__search {
  display: flex; align-items: center; gap: 10px; padding: 14px 16px;
  border-bottom: 1px solid var(--border-subtle); color: var(--text-tertiary);
}
.pkt-cp__input {
  flex: 1; border: none; outline: none; background: transparent;
  font-family: var(--font-sans); font-size: var(--text-md); color: var(--text-primary);
}
.pkt-cp__input::placeholder { color: var(--text-tertiary); }
.pkt-cp__list { max-height: 348px; overflow-y: auto; padding: 6px; }
.pkt-cp__group {
  padding: 10px 10px 4px; font-size: 11px; font-weight: var(--weight-semibold);
  letter-spacing: var(--tracking-caps); text-transform: uppercase; color: var(--text-tertiary);
}
.pkt-cp__item {
  display: flex; align-items: center; gap: 10px; width: 100%;
  padding: 8px 10px; border: none; border-radius: var(--radius-md);
  background: transparent; cursor: pointer; text-align: left;
  font-family: var(--font-sans); font-size: var(--text-base); color: var(--text-primary);
}
.pkt-cp__item--on { background: var(--surface-hover); }
.pkt-cp__item .pkt-cp__glyph { color: var(--text-tertiary); display: inline-flex; }
.pkt-cp__item--on .pkt-cp__glyph { color: var(--amber-600); }
.pkt-cp__cat { margin-left: auto; font-family: var(--font-mono); font-size: 11px; color: var(--text-tertiary); }
.pkt-cp__empty { padding: 24px; text-align: center; font-size: var(--text-sm); color: var(--text-tertiary); }
`;
if (typeof document !== "undefined" && !document.getElementById("pkt-css-cp")) {
  const s = document.createElement("style");
  s.id = "pkt-css-cp";
  s.textContent = css;
  document.head.appendChild(s);
}

/** ⌘K command palette — Pocket's primary navigation.
    Owner binds the shortcut and passes open/onClose/onSelect. */
function CommandPalette({
  open,
  onClose,
  tools = [],
  recents = [],
  onSelect,
  placeholder = "Search tools…"
}) {
  const [query, setQuery] = React.useState("");
  const [active, setActive] = React.useState(0);
  const inputRef = React.useRef(null);
  const listRef = React.useRef(null);

  // Build rows: group headers + items, flat for keyboard nav
  const rows = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    const out = [];
    if (q) {
      const hits = tools.filter(t => (t.name + " " + (t.category || "") + " " + (t.keywords || "")).toLowerCase().includes(q));
      hits.forEach(t => out.push({
        type: "item",
        tool: t
      }));
    } else {
      const recent = recents.map(id => tools.find(t => t.id === id)).filter(Boolean);
      if (recent.length) {
        out.push({
          type: "group",
          label: "Recently used"
        });
        recent.forEach(t => out.push({
          type: "item",
          tool: t
        }));
      }
      const cats = [];
      tools.forEach(t => {
        if (!cats.includes(t.category)) cats.push(t.category);
      });
      cats.forEach(c => {
        out.push({
          type: "group",
          label: c
        });
        tools.filter(t => t.category === c).forEach(t => out.push({
          type: "item",
          tool: t
        }));
      });
    }
    return out;
  }, [query, tools, recents]);
  const itemIdx = rows.map((r, i) => r.type === "item" ? i : -1).filter(i => i >= 0);
  React.useEffect(() => {
    if (open) {
      setQuery("");
      setActive(0);
      setTimeout(() => inputRef.current && inputRef.current.focus(), 0);
    }
  }, [open]);
  React.useEffect(() => {
    setActive(0);
  }, [query]);
  React.useEffect(() => {
    if (!open) return undefined;
    const onKey = e => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose && onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setActive(a => Math.min(a + 1, itemIdx.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActive(a => Math.max(a - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const row = rows[itemIdx[active]];
        if (row && onSelect) onSelect(row.tool);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, rows, active, itemIdx, onClose, onSelect]);
  React.useEffect(() => {
    const el = listRef.current && listRef.current.querySelector(".pkt-cp__item--on");
    if (el && listRef.current) {
      const list = listRef.current;
      const top = el.offsetTop;
      const bottom = top + el.offsetHeight;
      if (top < list.scrollTop) list.scrollTop = top - 6;else if (bottom > list.scrollTop + list.clientHeight) list.scrollTop = bottom - list.clientHeight + 6;
    }
  }, [active, rows]);
  if (!open) return null;
  let itemCounter = -1;
  return /*#__PURE__*/React.createElement("div", {
    className: "pkt-cp-overlay",
    onMouseDown: e => {
      if (e.target === e.currentTarget && onClose) onClose();
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "pkt-cp",
    role: "dialog",
    "aria-label": "Command palette"
  }, /*#__PURE__*/React.createElement("div", {
    className: "pkt-cp__search"
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "search",
    size: 17
  }), /*#__PURE__*/React.createElement("input", {
    ref: inputRef,
    className: "pkt-cp__input",
    value: query,
    placeholder: placeholder,
    onChange: e => setQuery(e.target.value)
  }), /*#__PURE__*/React.createElement(__ds_scope.Kbd, null, "Esc")), /*#__PURE__*/React.createElement("div", {
    className: "pkt-cp__list",
    ref: listRef
  }, rows.length === 0 ? /*#__PURE__*/React.createElement("div", {
    className: "pkt-cp__empty"
  }, "No tools match \u201C", query, "\u201D.") : null, rows.map((row, i) => {
    if (row.type === "group") return /*#__PURE__*/React.createElement("div", {
      key: "g" + i,
      className: "pkt-cp__group"
    }, row.label);
    itemCounter += 1;
    const idx = itemCounter;
    const on = idx === active;
    return /*#__PURE__*/React.createElement("button", {
      key: row.tool.id + "-" + i,
      type: "button",
      className: "pkt-cp__item" + (on ? " pkt-cp__item--on" : ""),
      onMouseEnter: () => setActive(idx),
      onClick: () => onSelect && onSelect(row.tool)
    }, /*#__PURE__*/React.createElement("span", {
      className: "pkt-cp__glyph"
    }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
      name: row.tool.icon || "wrench",
      size: 16
    })), row.tool.name, /*#__PURE__*/React.createElement("span", {
      className: "pkt-cp__cat"
    }, row.tool.category), on ? /*#__PURE__*/React.createElement(__ds_scope.Kbd, null, "\u23CE") : null);
  }))));
}
Object.assign(__ds_scope, { CommandPalette });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/CommandPalette.jsx", error: String((e && e.message) || e) }); }

// components/surfaces/EmptyState.jsx
try { (() => {
/** Quiet empty state — icon, one line, optional hint. ≤2 short sentences. */
function EmptyState({
  icon = "inbox",
  title,
  hint,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      padding: "28px 20px",
      textAlign: "center",
      fontFamily: "var(--font-sans)",
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 40,
      height: 40,
      borderRadius: "var(--radius-md)",
      display: "grid",
      placeItems: "center",
      background: "var(--surface-sunken)",
      border: "1px solid var(--border-subtle)",
      color: "var(--text-tertiary)"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 18
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--text-sm)",
      fontWeight: "var(--weight-medium)",
      color: "var(--text-secondary)"
    }
  }, title), hint ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--text-xs)",
      color: "var(--text-tertiary)",
      maxWidth: 300
    }
  }, hint) : null);
}
Object.assign(__ds_scope, { EmptyState });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/surfaces/EmptyState.jsx", error: String((e && e.message) || e) }); }

// components/surfaces/Panel.jsx
try { (() => {
const css = `
.pkt-panel {
  display: flex; flex-direction: column; min-height: 0; overflow: hidden;
  background: var(--surface-raised);
  border: 1px solid var(--border-default); border-radius: var(--radius-lg);
  font-family: var(--font-sans);
}
.pkt-panel__head {
  flex: none; display: flex; align-items: center; gap: 10px;
  height: 42px; padding: 0 8px 0 14px;
  border-bottom: 1px solid var(--border-subtle);
}
.pkt-panel__title {
  font-size: var(--text-xs); font-weight: var(--weight-semibold);
  letter-spacing: var(--tracking-caps); text-transform: uppercase;
  color: var(--text-tertiary);
}
.pkt-panel__meta { margin-left: auto; display: flex; align-items: center; gap: 8px; font-size: var(--text-xs); color: var(--text-tertiary); font-family: var(--font-mono); }
.pkt-panel__actions { display: flex; align-items: center; gap: 6px; }
.pkt-panel__body { flex: 1; min-height: 0; display: flex; flex-direction: column; }

.pkt-panel--code { background: var(--code-bg); border-color: var(--code-bg); }
.pkt-panel--code .pkt-panel__head { border-bottom-color: var(--code-line); }
.pkt-panel--code .pkt-panel__title { color: var(--syn-comment); }
.pkt-panel--code .pkt-panel__meta { color: var(--syn-comment); }
.pkt-panel--sunken { background: var(--surface-sunken); }
`;
if (typeof document !== "undefined" && !document.getElementById("pkt-css-panel")) {
  const s = document.createElement("style");
  s.id = "pkt-css-panel";
  s.textContent = css;
  document.head.appendChild(s);
}

/** Workspace pane with a slim header (caps title, mono meta, actions).
    Pair two side-by-side for input → output. variant="code" is the dark pane. */
function Panel({
  title,
  meta,
  actions,
  variant = "raised",
  children,
  style
}) {
  return /*#__PURE__*/React.createElement("section", {
    className: "pkt-panel" + (variant !== "raised" ? " pkt-panel--" + variant : ""),
    style: style
  }, title || meta || actions ? /*#__PURE__*/React.createElement("header", {
    className: "pkt-panel__head"
  }, title ? /*#__PURE__*/React.createElement("span", {
    className: "pkt-panel__title"
  }, title) : null, /*#__PURE__*/React.createElement("span", {
    className: "pkt-panel__meta"
  }, meta), actions ? /*#__PURE__*/React.createElement("span", {
    className: "pkt-panel__actions"
  }, actions) : null) : null, /*#__PURE__*/React.createElement("div", {
    className: "pkt-panel__body"
  }, children));
}
Object.assign(__ds_scope, { Panel });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/surfaces/Panel.jsx", error: String((e && e.message) || e) }); }

// components/surfaces/Tabs.jsx
try { (() => {
const css = `
.pkt-tabs { display: flex; gap: 2px; border-bottom: 1px solid var(--border-default); font-family: var(--font-sans); }
.pkt-tabs__tab {
  position: relative; height: 36px; padding: 0 14px; border: none; background: transparent;
  font-size: var(--text-sm); font-weight: var(--weight-medium); color: var(--text-secondary);
  cursor: pointer; transition: color var(--duration-fast) var(--ease-out);
}
.pkt-tabs__tab:hover { color: var(--text-primary); }
.pkt-tabs__tab--on { color: var(--text-primary); font-weight: var(--weight-semibold); }
.pkt-tabs__tab--on::after {
  content: ""; position: absolute; left: 10px; right: 10px; bottom: -1px; height: 2px;
  background: var(--accent); border-radius: 2px;
}
`;
if (typeof document !== "undefined" && !document.getElementById("pkt-css-tabs")) {
  const s = document.createElement("style");
  s.id = "pkt-css-tabs";
  s.textContent = css;
  document.head.appendChild(s);
}

/** Underline tabs for switching views within a tool (e.g. Output / Errors). */
function Tabs({
  items = [],
  active,
  onChange
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "pkt-tabs",
    role: "tablist"
  }, items.map(it => {
    const item = typeof it === "string" ? {
      id: it,
      label: it
    } : it;
    const on = item.id === active;
    return /*#__PURE__*/React.createElement("button", {
      key: item.id,
      type: "button",
      role: "tab",
      "aria-selected": on,
      className: "pkt-tabs__tab" + (on ? " pkt-tabs__tab--on" : ""),
      onClick: () => onChange && onChange(item.id)
    }, item.label);
  }));
}
Object.assign(__ds_scope, { Tabs });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/surfaces/Tabs.jsx", error: String((e && e.message) || e) }); }

// components/surfaces/Toast.jsx
try { (() => {
const css = `
.pkt-toast {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 9px 14px; border-radius: var(--radius-md);
  background: var(--surface-inverse); color: var(--text-inverse);
  font-family: var(--font-sans); font-size: var(--text-sm); font-weight: var(--weight-medium);
  box-shadow: var(--shadow-2);
}
.pkt-toast--ok .pkt-toast__icon { color: #A8C078; }
.pkt-toast--danger .pkt-toast__icon { color: #E08A76; }
.pkt-toast__icon { display: inline-flex; }
@keyframes pkt-toast-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
.pkt-toast { animation: pkt-toast-in var(--duration-base) var(--ease-out); }
`;
if (typeof document !== "undefined" && !document.getElementById("pkt-css-toast")) {
  const s = document.createElement("style");
  s.id = "pkt-css-toast";
  s.textContent = css;
  document.head.appendChild(s);
}

/** Inverse-ink confirmation capsule. Place fixed bottom-center; auto-dismiss ~2s.
    Reserve for events without inline feedback (CopyButton confirms itself). */
function Toast({
  kind = "ok",
  icon,
  children,
  style
}) {
  const glyph = icon || (kind === "ok" ? "check" : kind === "danger" ? "alert-circle" : "info");
  return /*#__PURE__*/React.createElement("div", {
    className: "pkt-toast pkt-toast--" + kind,
    style: style,
    role: "status"
  }, /*#__PURE__*/React.createElement("span", {
    className: "pkt-toast__icon"
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: glyph,
    size: 14
  })), children);
}
Object.assign(__ds_scope, { Toast });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/surfaces/Toast.jsx", error: String((e && e.message) || e) }); }

// components/surfaces/ToolCard.jsx
try { (() => {
const css = `
.pkt-toolcard {
  position: relative; display: flex; flex-direction: column; gap: 10px; text-align: left;
  padding: 14px 16px; cursor: pointer; font-family: var(--font-sans); width: 100%;
  background: var(--surface-raised);
  border: 1px solid var(--border-default); border-radius: var(--radius-lg);
  transition: border-color var(--duration-fast) var(--ease-out), box-shadow var(--duration-fast) var(--ease-out);
}
.pkt-toolcard:hover { border-color: var(--border-strong); box-shadow: var(--shadow-1); }
.pkt-toolcard:active { transform: translateY(0.5px); }
.pkt-toolcard__glyph {
  width: 34px; height: 34px; border-radius: var(--radius-md);
  display: grid; place-items: center;
  background: var(--accent-soft); color: var(--amber-700);
}
.pkt-toolcard__name { font-size: var(--text-base); font-weight: var(--weight-semibold); color: var(--text-primary); }
.pkt-toolcard__desc { font-size: var(--text-sm); color: var(--text-secondary); line-height: var(--leading-snug); }
.pkt-toolcard__star {
  position: absolute; top: 10px; right: 10px;
  width: 26px; height: 26px; border: none; border-radius: var(--radius-sm);
  display: grid; place-items: center; background: transparent; cursor: pointer;
  color: var(--text-tertiary); opacity: 0; transition: opacity var(--duration-fast) var(--ease-out);
}
.pkt-toolcard:hover .pkt-toolcard__star { opacity: 1; }
.pkt-toolcard__star:hover { color: var(--amber-600); background: var(--surface-hover); }
.pkt-toolcard__star--on { opacity: 1; color: var(--amber-500); }
.pkt-toolcard__star--on svg { fill: currentColor; }

.pkt-toolcard--row { flex-direction: row; align-items: center; padding: 10px 14px; gap: 12px; }
.pkt-toolcard--row .pkt-toolcard__glyph { width: 30px; height: 30px; }
.pkt-toolcard--row .pkt-toolcard__desc { display: none; }
`;
if (typeof document !== "undefined" && !document.getElementById("pkt-css-toolcard")) {
  const s = document.createElement("style");
  s.id = "pkt-css-toolcard";
  s.textContent = css;
  document.head.appendChild(s);
}

/** Home-grid tool entry: amber glyph chip, name, one-line description,
    star-on-hover. compact=true renders a row (for "Recently used"). */
function ToolCard({
  icon = "wrench",
  name,
  description,
  starred = false,
  onStar,
  onClick,
  compact = false
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "pkt-toolcard" + (compact ? " pkt-toolcard--row" : ""),
    onClick: onClick,
    role: "button",
    tabIndex: 0,
    onKeyDown: e => {
      if (e.key === "Enter" && onClick) onClick(e);
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "pkt-toolcard__glyph"
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 17
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "pkt-toolcard__name",
    style: {
      display: "block"
    }
  }, name), description ? /*#__PURE__*/React.createElement("span", {
    className: "pkt-toolcard__desc",
    style: {
      display: "block",
      marginTop: 1
    }
  }, description) : null), onStar ? /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "pkt-toolcard__star" + (starred ? " pkt-toolcard__star--on" : ""),
    "aria-label": starred ? "Unstar" : "Star",
    onClick: e => {
      e.stopPropagation();
      onStar();
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "star",
    size: 14
  })) : null);
}
Object.assign(__ds_scope, { ToolCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/surfaces/ToolCard.jsx", error: String((e && e.message) || e) }); }

// ui_kits/pocket_app/App.jsx
try { (() => {
// Pocket app — shell + routing + state (favorites, recents, theme, palette)
const {
  Logo,
  Icon: PIcon,
  IconButton: PIconButton,
  Kbd: PKbd,
  CommandPalette: PPalette,
  Badge: PBadge
} = window.PocketDesignSystem_654e67;
function load(key, fallback) {
  try {
    const v = JSON.parse(localStorage.getItem(key));
    return v == null ? fallback : v;
  } catch (e) {
    return fallback;
  }
}
function save(key, v) {
  try {
    localStorage.setItem(key, JSON.stringify(v));
  } catch (e) {/* no-op */}
}
function TopBar({
  tool,
  onHome,
  onOpenPalette,
  starred,
  onStar,
  theme,
  onTheme
}) {
  return /*#__PURE__*/React.createElement("header", {
    "data-screen-label": tool ? tool.name : "Home",
    style: {
      flex: "none",
      display: "flex",
      alignItems: "center",
      gap: 10,
      height: 52,
      padding: "0 16px",
      background: "var(--surface-app)",
      borderBottom: "1px solid var(--border-subtle)"
    }
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onHome,
    style: {
      display: "inline-flex",
      border: "none",
      background: "transparent",
      cursor: "pointer",
      padding: 4,
      borderRadius: 8
    }
  }, /*#__PURE__*/React.createElement(Logo, {
    size: 24,
    wordmark: !tool
  })), tool ? /*#__PURE__*/React.createElement("span", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement(PIcon, {
    name: "chevron-right",
    size: 14,
    style: {
      color: "var(--text-tertiary)"
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      fontWeight: 600,
      fontSize: 15
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 26,
      height: 26,
      borderRadius: 8,
      background: "var(--accent-soft)",
      color: "var(--amber-700)",
      display: "grid",
      placeItems: "center"
    }
  }, /*#__PURE__*/React.createElement(PIcon, {
    name: tool.icon,
    size: 14
  })), tool.name), /*#__PURE__*/React.createElement(PIconButton, {
    icon: "star",
    label: starred ? "Unstar" : "Star",
    size: "sm",
    active: starred,
    fill: true,
    onClick: onStar
  }), /*#__PURE__*/React.createElement(PBadge, {
    kind: "neutral"
  }, tool.category)) : null, /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: "auto",
      display: "flex",
      alignItems: "center",
      gap: 8
    }
  }, tool ? /*#__PURE__*/React.createElement(SearchTrigger, {
    onClick: onOpenPalette
  }) : null, /*#__PURE__*/React.createElement(PIconButton, {
    icon: theme === "dark" ? "sun" : "moon",
    label: "Toggle theme",
    onClick: onTheme
  })));
}
function PocketApp() {
  const tools = window.POCKET_TOOLS;
  const categories = window.POCKET_CATEGORIES;
  const [route, setRoute] = React.useState(() => load("pocket-route", null));
  const [favorites, setFavorites] = React.useState(() => load("pocket-favs", ["json-formatter", "password", "uuid"]));
  const [recents, setRecents] = React.useState(() => load("pocket-recents", ["hash", "base64"]));
  const [theme, setTheme] = React.useState(() => load("pocket-theme", "light"));
  const [paletteOpen, setPaletteOpen] = React.useState(false);
  React.useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    save("pocket-theme", theme);
  }, [theme]);
  React.useEffect(() => {
    save("pocket-route", route);
  }, [route]);
  React.useEffect(() => {
    const onKey = e => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen(o => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  const tool = route ? tools.find(t => t.id === route) : null;
  const openTool = t => {
    setRoute(t.id);
    setPaletteOpen(false);
    setRecents(r => {
      const next = [t.id, ...r.filter(id => id !== t.id)].slice(0, 6);
      save("pocket-recents", next);
      return next;
    });
  };
  const toggleStar = id => {
    setFavorites(f => {
      const next = f.includes(id) ? f.filter(x => x !== id) : [...f, id];
      save("pocket-favs", next);
      return next;
    });
  };
  let screen = null;
  if (!tool) {
    screen = /*#__PURE__*/React.createElement("div", {
      "data-screen-label": "Home",
      style: {
        flex: 1,
        minHeight: 0,
        overflowY: "auto"
      }
    }, /*#__PURE__*/React.createElement(HomeScreen, {
      tools: tools,
      categories: categories,
      favorites: favorites,
      recents: recents,
      onOpen: openTool,
      onStar: toggleStar,
      onOpenPalette: () => setPaletteOpen(true)
    }));
  } else {
    const body = tool.id === "json-formatter" ? /*#__PURE__*/React.createElement(JsonFormatterScreen, null) : tool.id === "password" ? /*#__PURE__*/React.createElement(PasswordScreen, null) : /*#__PURE__*/React.createElement(StubScreen, {
      tool: tool
    });
    screen = /*#__PURE__*/React.createElement("div", {
      "data-screen-label": tool.name,
      style: {
        flex: 1,
        minHeight: 0,
        padding: "14px 16px 16px",
        display: "flex",
        flexDirection: "column"
      }
    }, body);
  }
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: "100vh",
      display: "flex",
      flexDirection: "column",
      background: "var(--surface-app)"
    }
  }, /*#__PURE__*/React.createElement(TopBar, {
    tool: tool,
    onHome: () => setRoute(null),
    onOpenPalette: () => setPaletteOpen(true),
    starred: tool ? favorites.includes(tool.id) : false,
    onStar: () => tool && toggleStar(tool.id),
    theme: theme,
    onTheme: () => setTheme(theme === "dark" ? "light" : "dark")
  }), screen, /*#__PURE__*/React.createElement(CommandPaletteHost, {
    open: paletteOpen,
    onClose: () => setPaletteOpen(false),
    tools: tools,
    recents: recents,
    onSelect: openTool
  }));
}
function CommandPaletteHost(props) {
  return /*#__PURE__*/React.createElement(PPalette, props);
}
Object.assign(window, {
  PocketApp
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/pocket_app/App.jsx", error: String((e && e.message) || e) }); }

// ui_kits/pocket_app/HomeScreen.jsx
try { (() => {
// Pocket app — home screen (favorites, recents, all tools)
const {
  Icon,
  Kbd,
  ToolCard,
  EmptyState
} = window.PocketDesignSystem_654e67;
const homeStyles = {
  wrap: {
    maxWidth: 1040,
    margin: "0 auto",
    padding: "40px 28px 72px"
  },
  h1: {
    fontSize: "var(--text-2xl)",
    fontWeight: 600,
    letterSpacing: "var(--tracking-tight)",
    margin: 0
  },
  sub: {
    margin: "6px 0 0",
    color: "var(--text-secondary)",
    fontSize: "var(--text-base)"
  },
  section: {
    marginTop: 36
  },
  caps: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: "var(--tracking-caps)",
    textTransform: "uppercase",
    color: "var(--text-tertiary)"
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))",
    gap: 12
  }
};
function SearchTrigger({
  onClick,
  wide
}) {
  const [hover, setHover] = React.useState(false);
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      width: wide ? "100%" : 230,
      maxWidth: 560,
      height: wide ? 44 : 32,
      padding: "0 12px",
      cursor: "text",
      textAlign: "left",
      background: hover ? "var(--surface-raised)" : "var(--surface-sunken)",
      border: "1px solid " + (hover ? "var(--border-strong)" : "var(--border-default)"),
      borderRadius: "var(--radius-md)",
      color: "var(--text-tertiary)",
      fontFamily: "var(--font-sans)",
      fontSize: wide ? 15 : 13,
      transition: "border-color var(--duration-fast) var(--ease-out), background var(--duration-fast) var(--ease-out)"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "search",
    size: wide ? 16 : 14
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }, "Search tools\u2026"), /*#__PURE__*/React.createElement(Kbd, {
    keys: ["⌘", "K"]
  }));
}
function HomeScreen({
  tools,
  categories,
  favorites,
  recents,
  onOpen,
  onStar,
  onOpenPalette
}) {
  const favTools = tools.filter(t => favorites.includes(t.id));
  const recentTools = recents.map(id => tools.find(t => t.id === id)).filter(Boolean).slice(0, 4);
  return /*#__PURE__*/React.createElement("div", {
    style: homeStyles.wrap
  }, /*#__PURE__*/React.createElement("h1", {
    style: homeStyles.h1
  }, "What do you need?"), /*#__PURE__*/React.createElement("p", {
    style: homeStyles.sub
  }, tools.length, " tools, all client-side. Nothing you paste leaves your browser."), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 20,
      maxWidth: 560
    }
  }, /*#__PURE__*/React.createElement(SearchTrigger, {
    wide: true,
    onClick: onOpenPalette
  })), /*#__PURE__*/React.createElement("section", {
    style: homeStyles.section
  }, /*#__PURE__*/React.createElement("div", {
    style: homeStyles.caps
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "star",
    size: 13
  }), " Favorites"), favTools.length ? /*#__PURE__*/React.createElement("div", {
    style: homeStyles.grid
  }, favTools.map(t => /*#__PURE__*/React.createElement(ToolCard, {
    key: t.id,
    icon: t.icon,
    name: t.name,
    description: t.description,
    starred: true,
    onStar: () => onStar(t.id),
    onClick: () => onOpen(t)
  }))) : /*#__PURE__*/React.createElement(EmptyState, {
    icon: "star",
    title: "No favorites yet",
    hint: "Star a tool and it'll stay here."
  })), recentTools.length ? /*#__PURE__*/React.createElement("section", {
    style: homeStyles.section
  }, /*#__PURE__*/React.createElement("div", {
    style: homeStyles.caps
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "history",
    size: 13
  }), " Recently used"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))",
      gap: 10
    }
  }, recentTools.map(t => /*#__PURE__*/React.createElement(ToolCard, {
    key: t.id,
    compact: true,
    icon: t.icon,
    name: t.name,
    onClick: () => onOpen(t)
  })))) : null, categories.map(cat => {
    const list = tools.filter(t => t.category === cat.id);
    if (!list.length) return null;
    return /*#__PURE__*/React.createElement("section", {
      key: cat.id,
      style: homeStyles.section
    }, /*#__PURE__*/React.createElement("div", {
      style: homeStyles.caps
    }, /*#__PURE__*/React.createElement(Icon, {
      name: cat.icon,
      size: 13
    }), " ", cat.id), /*#__PURE__*/React.createElement("div", {
      style: homeStyles.grid
    }, list.map(t => /*#__PURE__*/React.createElement(ToolCard, {
      key: t.id,
      icon: t.icon,
      name: t.name,
      description: t.description,
      starred: favorites.includes(t.id),
      onStar: () => onStar(t.id),
      onClick: () => onOpen(t)
    }))));
  }));
}
Object.assign(window, {
  HomeScreen,
  SearchTrigger
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/pocket_app/HomeScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/pocket_app/ToolScreens.jsx
try { (() => {
// Pocket app — tool screens: JSON Formatter, Password Generator, generic stub
const {
  Panel,
  Textarea,
  Badge,
  CopyButton,
  IconButton,
  Button,
  Select,
  Switch,
  SegmentedControl,
  EmptyState,
  Icon
} = window.PocketDesignSystem_654e67;
const SAMPLE_JSON = '{"name":"pocket","tools":35,"client_side":true,"categories":["formatters","generators","converters"],"latency_ms":0.4}';
function JsonFormatterScreen() {
  const [input, setInput] = React.useState(SAMPLE_JSON);
  const [mode, setMode] = React.useState("Pretty");
  const [indent, setIndent] = React.useState("2");
  const [sortKeys, setSortKeys] = React.useState(false);
  let output = "";
  let error = null;
  if (input.trim()) {
    try {
      let parsed = JSON.parse(input);
      if (sortKeys) parsed = sortDeep(parsed);
      output = mode === "Minify" ? JSON.stringify(parsed) : JSON.stringify(parsed, null, indent === "tab" ? "\t" : Number(indent));
    } catch (e) {
      error = String(e.message || e);
    }
  }
  function sortDeep(v) {
    if (Array.isArray(v)) return v.map(sortDeep);
    if (v && typeof v === "object") {
      const out = {};
      Object.keys(v).sort().forEach(k => {
        out[k] = sortDeep(v[k]);
      });
      return out;
    }
    return v;
  }
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 12,
      height: "100%",
      minHeight: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement(SegmentedControl, {
    options: ["Pretty", "Minify"],
    value: mode,
    onChange: setMode
  }), /*#__PURE__*/React.createElement(Select, {
    options: [{
      value: "2",
      label: "2 spaces"
    }, {
      value: "4",
      label: "4 spaces"
    }, {
      value: "tab",
      label: "Tabs"
    }],
    value: indent,
    onChange: e => setIndent(e.target.value),
    disabled: mode === "Minify"
  }), /*#__PURE__*/React.createElement(Switch, {
    checked: sortKeys,
    onChange: setSortKeys,
    label: "Sort keys"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: "auto"
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    size: "sm",
    icon: "rotate-ccw",
    onClick: () => setInput(SAMPLE_JSON)
  }, "Sample"))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minHeight: 0,
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 14
    }
  }, /*#__PURE__*/React.createElement(Panel, {
    title: "Input",
    variant: "sunken",
    meta: input.length.toLocaleString() + " chars",
    actions: /*#__PURE__*/React.createElement(IconButton, {
      icon: "x",
      label: "Clear",
      size: "sm",
      onClick: () => setInput("")
    })
  }, /*#__PURE__*/React.createElement(Textarea, {
    bare: true,
    value: input,
    onChange: e => setInput(e.target.value),
    placeholder: "Paste JSON here\u2026",
    style: {
      flex: 1,
      padding: "12px 14px",
      minHeight: 0
    }
  })), /*#__PURE__*/React.createElement(Panel, {
    title: "Output",
    variant: "code",
    meta: error ? /*#__PURE__*/React.createElement(Badge, {
      kind: "danger"
    }, "Parse error") : input.trim() ? /*#__PURE__*/React.createElement(Badge, {
      kind: "ok",
      dot: true
    }, "Valid JSON") : null,
    actions: /*#__PURE__*/React.createElement(CopyButton, {
      onDark: true,
      getText: () => output
    })
  }, error ? /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "14px 16px",
      fontFamily: "var(--font-mono)",
      fontSize: 13,
      lineHeight: 1.6,
      color: "#E08A76"
    }
  }, error) : /*#__PURE__*/React.createElement("pre", {
    style: {
      margin: 0,
      padding: "12px 16px",
      overflow: "auto",
      flex: 1,
      fontFamily: "var(--font-mono)",
      fontSize: 13,
      lineHeight: 1.6,
      color: "var(--code-fg)"
    },
    dangerouslySetInnerHTML: {
      __html: window.pocketHighlightJSON(output)
    }
  }))));
}
const PW_CHARS = {
  lower: "abcdefghijkmnopqrstuvwxyz",
  upper: "ABCDEFGHJKLMNPQRSTUVWXYZ",
  numbers: "23456789",
  symbols: "!@#$%^&*-_=+?"
};
function makePassword(len, opts) {
  let pool = PW_CHARS.lower;
  if (opts.upper) pool += PW_CHARS.upper;
  if (opts.numbers) pool += PW_CHARS.numbers;
  if (opts.symbols) pool += PW_CHARS.symbols;
  const arr = new Uint32Array(len);
  crypto.getRandomValues(arr);
  return Array.from(arr, n => pool[n % pool.length]).join("");
}
function PasswordScreen() {
  const [len, setLen] = React.useState(20);
  const [opts, setOpts] = React.useState({
    upper: true,
    numbers: true,
    symbols: true
  });
  const [nonce, setNonce] = React.useState(0);
  const pw = React.useMemo(() => makePassword(len, opts), [len, opts, nonce]);
  const strength = len >= 16 && opts.symbols ? ["ok", "Strong"] : len >= 12 ? ["warn", "Okay"] : ["danger", "Weak"];
  const setOpt = k => v => setOpts(o => ({
    ...o,
    [k]: v
  }));
  return /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 560,
      margin: "32px auto 0",
      display: "flex",
      flexDirection: "column",
      gap: 16
    }
  }, /*#__PURE__*/React.createElement(Panel, {
    variant: "code",
    title: "Password",
    meta: /*#__PURE__*/React.createElement(Badge, {
      kind: strength[0],
      dot: true
    }, strength[1]),
    actions: /*#__PURE__*/React.createElement("span", {
      style: {
        display: "flex",
        gap: 6
      }
    }, /*#__PURE__*/React.createElement(IconButton, {
      icon: "refresh-cw",
      label: "Regenerate",
      size: "sm",
      onClick: () => setNonce(nonce + 1),
      style: {
        color: "var(--syn-punct)"
      }
    }), /*#__PURE__*/React.createElement(CopyButton, {
      onDark: true,
      getText: () => pw
    }))
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "20px 18px",
      fontFamily: "var(--font-mono)",
      fontSize: 19,
      letterSpacing: "0.02em",
      color: "var(--code-fg)",
      wordBreak: "break-all",
      lineHeight: 1.5
    }
  }, pw)), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--surface-raised)",
      border: "1px solid var(--border-default)",
      borderRadius: "var(--radius-lg)",
      padding: "16px 18px",
      display: "flex",
      flexDirection: "column",
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      fontWeight: 500,
      width: 90
    }
  }, "Length"), /*#__PURE__*/React.createElement("input", {
    type: "range",
    min: "8",
    max: "64",
    value: len,
    onChange: e => setLen(Number(e.target.value)),
    style: {
      flex: 1,
      accentColor: "var(--amber-500)"
    }
  }), /*#__PURE__*/React.createElement("code", {
    style: {
      fontSize: 13,
      width: 28,
      textAlign: "right",
      color: "var(--text-secondary)"
    }
  }, len)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 22,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement(Switch, {
    checked: opts.upper,
    onChange: setOpt("upper"),
    label: "Uppercase"
  }), /*#__PURE__*/React.createElement(Switch, {
    checked: opts.numbers,
    onChange: setOpt("numbers"),
    label: "Numbers"
  }), /*#__PURE__*/React.createElement(Switch, {
    checked: opts.symbols,
    onChange: setOpt("symbols"),
    label: "Symbols"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--text-tertiary)"
    }
  }, "Generated locally with ", /*#__PURE__*/React.createElement("code", null, "crypto.getRandomValues"), ". Ambiguous characters (Il1 O0) are excluded.")));
}
function StubScreen({
  tool
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      placeItems: "center",
      height: "100%"
    }
  }, /*#__PURE__*/React.createElement(EmptyState, {
    icon: tool.icon,
    title: tool.name + " isn't built in this UI kit",
    hint: "It would follow the same layout: options on top, input and output side by side."
  }));
}
Object.assign(window, {
  JsonFormatterScreen,
  PasswordScreen,
  StubScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/pocket_app/ToolScreens.jsx", error: String((e && e.message) || e) }); }

// ui_kits/pocket_app/tools-data.js
try { (() => {
// Pocket — tool catalog + tiny helpers for the UI kit (plain script, no JSX)
window.POCKET_CATEGORIES = [{
  id: "Formatters",
  icon: "braces"
}, {
  id: "Development",
  icon: "terminal"
}, {
  id: "Generators",
  icon: "sparkles"
}, {
  id: "Converters",
  icon: "repeat"
}, {
  id: "Text",
  icon: "type"
}, {
  id: "Security",
  icon: "shield"
}, {
  id: "Images",
  icon: "image"
}, {
  id: "PDF",
  icon: "file-text"
}, {
  id: "CSV Tools",
  icon: "table"
}, {
  id: "Web",
  icon: "globe"
}];
window.POCKET_TOOLS = [{
  id: "json-formatter",
  name: "JSON Formatter",
  category: "Formatters",
  icon: "braces",
  description: "Pretty-print, minify, validate"
}, {
  id: "xml-formatter",
  name: "XML Formatter",
  category: "Formatters",
  icon: "code-xml",
  description: "Indent and validate XML"
}, {
  id: "compiler",
  name: "Online Compiler",
  category: "Development",
  icon: "terminal",
  description: "Run Python, JS and C++"
}, {
  id: "git-cheatsheet",
  name: "Git Cheatsheet",
  category: "Development",
  icon: "git-branch",
  description: "Common commands, searchable"
}, {
  id: "qr-code",
  name: "QR Code Generator",
  category: "Generators",
  icon: "qr-code",
  description: "Text or URL to QR"
}, {
  id: "password",
  name: "Password Generator",
  category: "Generators",
  icon: "key-round",
  description: "Strong, random, local"
}, {
  id: "lorem-ipsum",
  name: "Lorem Ipsum",
  category: "Generators",
  icon: "text",
  description: "Placeholder paragraphs"
}, {
  id: "uuid",
  name: "UUID Generator",
  category: "Generators",
  icon: "fingerprint",
  description: "v1 and v4, in bulk"
}, {
  id: "mermaid",
  name: "Mermaid Editor",
  category: "Generators",
  icon: "workflow",
  description: "Diagrams from text"
}, {
  id: "base64",
  name: "Base64 Converter",
  category: "Converters",
  icon: "binary",
  description: "Encode and decode"
}, {
  id: "unit",
  name: "Unit Converter",
  category: "Converters",
  icon: "ruler",
  description: "Length, mass, data, more"
}, {
  id: "timestamp",
  name: "Timestamp Converter",
  category: "Converters",
  icon: "clock",
  description: "Unix ↔ human time"
}, {
  id: "timezone",
  name: "Timezone Converter",
  category: "Converters",
  icon: "globe",
  description: "Compare times across zones"
}, {
  id: "markdown",
  name: "Markdown Previewer",
  category: "Text",
  icon: "eye",
  description: "Live side-by-side preview"
}, {
  id: "syntax",
  name: "Syntax Highlighter",
  category: "Text",
  icon: "highlighter",
  description: "Colorize a snippet"
}, {
  id: "diff",
  name: "Text Diff",
  category: "Text",
  icon: "file-diff",
  description: "Compare two texts"
}, {
  id: "case",
  name: "Case Converter",
  category: "Text",
  icon: "case-sensitive",
  description: "camel, snake, kebab, title"
}, {
  id: "word-counter",
  name: "Word Counter",
  category: "Text",
  icon: "sigma",
  description: "Words, chars, reading time"
}, {
  id: "regex",
  name: "RegEx Tester",
  category: "Text",
  icon: "regex",
  description: "Live matches and groups"
}, {
  id: "hash",
  name: "Hash Generator",
  category: "Security",
  icon: "shield",
  description: "MD5, SHA-1, SHA-256"
}, {
  id: "aes",
  name: "AES Encrypt / Decrypt",
  category: "Security",
  icon: "lock",
  description: "Client-side only"
}, {
  id: "jwt",
  name: "JWT Debugger",
  category: "Security",
  icon: "key-square",
  description: "Decode and verify tokens"
}, {
  id: "image-compressor",
  name: "Image Compressor",
  category: "Images",
  icon: "image-down",
  description: "Smaller files, same look"
}, {
  id: "svg-viewer",
  name: "SVG Viewer",
  category: "Images",
  icon: "shapes",
  description: "Preview and clean SVG"
}, {
  id: "image-converter",
  name: "Image Converter",
  category: "Images",
  icon: "images",
  description: "PNG ↔ JPG ↔ WebP"
}, {
  id: "image-analyzer",
  name: "Image Analyzer",
  category: "Images",
  icon: "scan-search",
  description: "EXIF and metadata"
}, {
  id: "pdf-to-text",
  name: "PDF to Text",
  category: "PDF",
  icon: "file-text",
  description: "Extract plain text"
}, {
  id: "merge-pdfs",
  name: "Merge PDFs",
  category: "PDF",
  icon: "files",
  description: "Combine and reorder"
}, {
  id: "word-to-pdf",
  name: "Word to PDF",
  category: "PDF",
  icon: "file-type",
  description: "DOCX to PDF"
}, {
  id: "csv-json",
  name: "CSV ↔ JSON",
  category: "CSV Tools",
  icon: "table",
  description: "Both directions"
}, {
  id: "csv-sql",
  name: "CSV to SQL",
  category: "CSV Tools",
  icon: "database",
  description: "INSERT statements"
}, {
  id: "csv-editor",
  name: "CSV Editor",
  category: "CSV Tools",
  icon: "table-2",
  description: "Edit rows in place"
}, {
  id: "url-codec",
  name: "URL Encoder / Decoder",
  category: "Web",
  icon: "link",
  description: "Percent-encoding"
}, {
  id: "ip-lookup",
  name: "IP Lookup",
  category: "Web",
  icon: "map-pin",
  description: "Where an address lives"
}, {
  id: "dns-lookup",
  name: "DNS Lookup",
  category: "Web",
  icon: "server",
  description: "A, MX, TXT records"
}, {
  id: "css-generators",
  name: "CSS Generators",
  category: "Web",
  icon: "palette",
  description: "Shadows, gradients, radii"
}];

// Tiny JSON syntax highlighter → HTML with --syn-* colors
window.pocketHighlightJSON = function (src) {
  const esc = s => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return esc(src).replace(/("(?:\\.|[^"\\])*")(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|[{}\[\],:]/g, (m, str, colon, kw) => {
    if (str) {
      return colon ? '<span style="color:var(--syn-key)">' + str + '</span><span style="color:var(--syn-punct)">' + colon + "</span>" : '<span style="color:var(--syn-string)">' + str + "</span>";
    }
    if (kw) return '<span style="color:var(--syn-keyword)">' + kw + "</span>";
    if (/^[{}\[\],:]$/.test(m)) return '<span style="color:var(--syn-punct)">' + m + "</span>";
    return '<span style="color:var(--syn-number)">' + m + "</span>";
  });
};
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/pocket_app/tools-data.js", error: String((e && e.message) || e) }); }

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.CopyButton = __ds_scope.CopyButton;

__ds_ns.Icon = __ds_scope.Icon;

__ds_ns.IconButton = __ds_scope.IconButton;

__ds_ns.Kbd = __ds_scope.Kbd;

__ds_ns.Logo = __ds_scope.Logo;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.SegmentedControl = __ds_scope.SegmentedControl;

__ds_ns.Select = __ds_scope.Select;

__ds_ns.Switch = __ds_scope.Switch;

__ds_ns.Textarea = __ds_scope.Textarea;

__ds_ns.CommandPalette = __ds_scope.CommandPalette;

__ds_ns.EmptyState = __ds_scope.EmptyState;

__ds_ns.Panel = __ds_scope.Panel;

__ds_ns.Tabs = __ds_scope.Tabs;

__ds_ns.Toast = __ds_scope.Toast;

__ds_ns.ToolCard = __ds_scope.ToolCard;

})();
