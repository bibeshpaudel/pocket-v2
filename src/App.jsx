import React, { Suspense, lazy } from "react";
import { Routes, Route, useNavigate, useParams, useLocation } from "react-router-dom";
import { Logo } from "../Pocket Design System/components/core/Logo.jsx";
import { Icon } from "../Pocket Design System/components/core/Icon.jsx";
import { IconButton } from "../Pocket Design System/components/core/IconButton.jsx";
import { CommandPalette } from "../Pocket Design System/components/navigation/CommandPalette.jsx";
import { Badge } from "../Pocket Design System/components/core/Badge.jsx";
import { HomeScreen, SearchTrigger } from "./HomeScreen.jsx";
import { Sidebar } from "./Sidebar.jsx";
import { ThemePicker, normalizeTheme, normalizeMode, normalizeDark } from "./ThemePicker.jsx";
import { NotesButton } from "./Notes.jsx";
import { ErrorBoundary, ToolLoading } from "./ErrorBoundary.jsx";
import { POCKET_TOOLS, POCKET_CATEGORIES } from "./tools-data.js";

// Lazy loaded tool screens
const JsonFormatterScreen = lazy(() =>
  import("./ToolScreens.jsx").then((m) => ({ default: m.JsonFormatterScreen }))
);
const XmlFormatterScreen = lazy(() =>
  import("./ToolScreens.jsx").then((m) => ({ default: m.XmlFormatterScreen }))
);
const Base64Screen = lazy(() =>
  import("./ToolScreens.jsx").then((m) => ({ default: m.Base64Screen }))
);
const HashScreen = lazy(() =>
  import("./ToolScreens.jsx").then((m) => ({ default: m.HashScreen }))
);
const UnitConverterScreen = lazy(() =>
  import("./ToolScreens.jsx").then((m) => ({ default: m.UnitConverterScreen }))
);
const TimestampConverterScreen = lazy(() =>
  import("./ToolScreens.jsx").then((m) => ({ default: m.TimestampConverterScreen }))
);
const TimezoneConverterScreen = lazy(() =>
  import("./ToolScreens.jsx").then((m) => ({ default: m.TimezoneConverterScreen }))
);
const PasswordScreen = lazy(() =>
  import("./ToolScreens.jsx").then((m) => ({ default: m.PasswordScreen }))
);
const QrCodeScreen = lazy(() =>
  import("./ToolScreens.jsx").then((m) => ({ default: m.QrCodeScreen }))
);
const LoremIpsumScreen = lazy(() =>
  import("./ToolScreens.jsx").then((m) => ({ default: m.LoremIpsumScreen }))
);
const UuidScreen = lazy(() =>
  import("./ToolScreens.jsx").then((m) => ({ default: m.UuidScreen }))
);
const CaseConverterScreen = lazy(() =>
  import("./ToolScreens.jsx").then((m) => ({ default: m.CaseConverterScreen }))
);
const WordCounterScreen = lazy(() =>
  import("./ToolScreens.jsx").then((m) => ({ default: m.WordCounterScreen }))
);
const RegexScreen = lazy(() =>
  import("./ToolScreens.jsx").then((m) => ({ default: m.RegexScreen }))
);
const UrlCodecScreen = lazy(() =>
  import("./ToolScreens.jsx").then((m) => ({ default: m.UrlCodecScreen }))
);
// Heavier tools live in their own module so their data only loads when opened.
const GitCheatsheetScreen = lazy(() => import("./tools/GitCheatsheet.jsx"));
const TextDiffScreen = lazy(() => import("./tools/TextDiff.jsx"));
const MarkdownPreviewScreen = lazy(() => import("./tools/MarkdownPreview.jsx"));
const AesToolScreen = lazy(() => import("./tools/AesTool.jsx"));
const IpLookupScreen = lazy(() => import("./tools/IpLookup.jsx"));
const DnsLookupScreen = lazy(() => import("./tools/DnsLookup.jsx"));
const JwtDebuggerScreen = lazy(() => import("./tools/JwtDebugger.jsx"));
const CertificateInspectorScreen = lazy(() => import("./tools/CertificateInspector.jsx"));
const MermaidEditorScreen = lazy(() => import("./tools/MermaidEditor.jsx"));
const OnlineCompilerScreen = lazy(() => import("./tools/OnlineCompiler.jsx"));
const SyntaxHighlighterScreen = lazy(() => import("./tools/SyntaxHighlighter.jsx"));
const PdfToTextScreen = lazy(() => import("./tools/PdfToText.jsx"));
const MergePdfsScreen = lazy(() => import("./tools/MergePdfs.jsx"));
const WordToPdfScreen = lazy(() => import("./tools/WordToPdf.jsx"));
const ImageCompressorScreen = lazy(() => import("./tools/ImageCompressor.jsx"));
const ImageConverterScreen = lazy(() => import("./tools/ImageConverter.jsx"));
const SvgViewerScreen = lazy(() => import("./tools/SvgViewer.jsx"));
const ImageAnalyzerScreen = lazy(() => import("./tools/ImageAnalyzer.jsx"));
const CsvJsonScreen = lazy(() => import("./tools/CsvJson.jsx"));
const CsvSqlScreen = lazy(() => import("./tools/CsvSql.jsx"));
const CsvEditorScreen = lazy(() => import("./tools/CsvEditor.jsx"));
const ColorConverterScreen = lazy(() => import("./tools/ColorConverter.jsx"));
const NumberBaseScreen = lazy(() => import("./tools/NumberBase.jsx"));
const JsonYamlScreen = lazy(() => import("./tools/JsonYaml.jsx"));
const CronExplainerScreen = lazy(() => import("./tools/CronExplainer.jsx"));
const EnvJsonScreen = lazy(() => import("./tools/EnvJson.jsx"));
const TextEscapeScreen = lazy(() => import("./tools/TextEscape.jsx"));
const SlugifyScreen = lazy(() => import("./tools/Slugify.jsx"));
const UlidNanoidScreen = lazy(() => import("./tools/UlidNanoid.jsx"));
const SampleDataScreen = lazy(() => import("./tools/SampleData.jsx"));
const StubScreen = lazy(() =>
  import("./ToolScreens.jsx").then((m) => ({ default: m.StubScreen }))
);

// Tool component registry
const TOOL_REGISTRY = {
  "json-formatter": JsonFormatterScreen,
  "xml-formatter": XmlFormatterScreen,
  "base64": Base64Screen,
  "hash": HashScreen,
  "unit": UnitConverterScreen,
  "timestamp": TimestampConverterScreen,
  "timezone": TimezoneConverterScreen,
  "password": PasswordScreen,
  "qr-code": QrCodeScreen,
  "lorem-ipsum": LoremIpsumScreen,
  "uuid": UuidScreen,
  "case": CaseConverterScreen,
  "word-counter": WordCounterScreen,
  "regex": RegexScreen,
  "url-codec": UrlCodecScreen,
  "ip-lookup": IpLookupScreen,
  "dns-lookup": DnsLookupScreen,
  "jwt": JwtDebuggerScreen,
  "cert-inspector": CertificateInspectorScreen,
  "mermaid": MermaidEditorScreen,
  "compiler": OnlineCompilerScreen,
  "syntax": SyntaxHighlighterScreen,
  "pdf-to-text": PdfToTextScreen,
  "merge-pdfs": MergePdfsScreen,
  "word-to-pdf": WordToPdfScreen,
  "image-compressor": ImageCompressorScreen,
  "image-converter": ImageConverterScreen,
  "svg-viewer": SvgViewerScreen,
  "image-analyzer": ImageAnalyzerScreen,
  "git-cheatsheet": GitCheatsheetScreen,
  "diff": TextDiffScreen,
  "markdown": MarkdownPreviewScreen,
  "aes": AesToolScreen,
  "csv-json": CsvJsonScreen,
  "csv-sql": CsvSqlScreen,
  "csv-editor": CsvEditorScreen,
  "color-converter": ColorConverterScreen,
  "number-base": NumberBaseScreen,
  "json-yaml": JsonYamlScreen,
  "cron": CronExplainerScreen,
  "env-json": EnvJsonScreen,
  "text-escape": TextEscapeScreen,
  "slugify": SlugifyScreen,
  "ulid": UlidNanoidScreen,
  "sample-data": SampleDataScreen,
};

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
  } catch (e) {
    /* no-op */
  }
}

function TopBar({ tool, onHome, onOpenPalette, starred, onStar, theme, onSetTheme, mode, onToggleMode, darkLevel, onSetDark }) {
  return (
    <header data-screen-label={tool ? tool.name : "Home"} style={{
      flex: "none", display: "flex", alignItems: "center", gap: 10,
      height: 52, padding: "0 16px",
      background: "var(--surface-app)", borderBottom: "1px solid var(--border-subtle)",
    }}>
      <button type="button" onClick={onHome} style={{ display: "inline-flex", border: "none", background: "transparent", cursor: "pointer", padding: 4, borderRadius: 8 }}>
        <Logo size={24} wordmark={!tool} />
      </button>
      {tool ? (
        <span style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <Icon name="chevron-right" size={14} style={{ color: "var(--text-tertiary)" }} />
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontWeight: 600, fontSize: 15 }}>
            <span style={{ width: 26, height: 26, borderRadius: 8, background: "var(--accent-soft)", color: "var(--amber-700)", display: "grid", placeItems: "center" }}>
              <Icon name={tool.icon} size={14} />
            </span>
            {tool.name}
          </span>
          <IconButton icon="star" label={starred ? "Unstar" : "Star"} size="sm" active={starred} fill onClick={onStar} />
          <Badge kind="neutral">{tool.category}</Badge>
        </span>
      ) : null}
      <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
        {tool ? <SearchTrigger onClick={onOpenPalette} /> : null}
        <NotesButton />
        <ThemePicker theme={theme} onChange={onSetTheme} dark={darkLevel} onSetDark={onSetDark} />
        <IconButton icon={mode === "dark" ? "sun" : "moon"} label="Toggle light / dark" onClick={onToggleMode} />
      </span>
    </header>
  );
}

function ToolPageWrapper({ tools, openTool }) {
  const { toolId } = useParams();
  
  const normalizedId = toolId === "json" ? "json-formatter" : toolId;
  const tool = tools.find((t) => t.id === normalizedId);

  React.useEffect(() => {
    if (tool) {
      openTool(tool);
    }
  }, [tool]);

  if (!tool) {
    return (
      <div data-screen-label="Unknown Tool" style={{ flex: 1, minHeight: 0, padding: "14px 16px 16px", display: "flex", flexDirection: "column" }}>
        <StubScreen tool={{ name: toolId || "Unknown Tool", icon: "wrench" }} />
      </div>
    );
  }

  const BodyComponent = TOOL_REGISTRY[tool.id] || StubScreen;

  return (
    <div data-screen-label={tool.name} style={{ flex: 1, minHeight: 0, padding: "14px 16px 16px", display: "flex", flexDirection: "column" }}>
      <ErrorBoundary resetKey={tool.id}>
        <Suspense fallback={<ToolLoading />}>
          <BodyComponent tool={tool} />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}

export default function App() {
  const tools = POCKET_TOOLS;
  const categories = POCKET_CATEGORIES;
  const navigate = useNavigate();
  const location = useLocation();

  const [favorites, setFavorites] = React.useState(() => load("pocket-favs", ["json-formatter", "password", "uuid"]));
  const [recents, setRecents] = React.useState(() => load("pocket-recents", ["hash", "base64"]));
  const [theme, setTheme] = React.useState(() => normalizeTheme(load("pocket-theme", "amber")));
  const [mode, setMode] = React.useState(() => normalizeMode(load("pocket-theme", "amber"), load("pocket-mode", null)));
  const [darkLevel, setDarkLevel] = React.useState(() => normalizeDark(load("pocket-dark", null), load("pocket-theme", "amber")));
  const [paletteOpen, setPaletteOpen] = React.useState(false);
  const [navCollapsed, setNavCollapsed] = React.useState(() => load("pocket-nav-collapsed", false));

  React.useEffect(() => {
    const el = document.documentElement;
    el.setAttribute("data-theme", theme);
    el.setAttribute("data-mode", mode);
    el.setAttribute("data-dark", darkLevel);
    save("pocket-theme", theme);
    save("pocket-mode", mode);
    save("pocket-dark", darkLevel);
  }, [theme, mode, darkLevel]);

  React.useEffect(() => { save("pocket-nav-collapsed", navCollapsed); }, [navCollapsed]);

  React.useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Resolve tool from URL pathname
  const match = location.pathname.match(/^\/tool\/([^/]+)/);
  const matchedToolId = match ? match[1] : null;
  const normalizedId = matchedToolId === "json" ? "json-formatter" : matchedToolId;
  const tool = normalizedId ? tools.find((t) => t.id === normalizedId) : null;

  const handleOpenTool = (t) => {
    setRecents((r) => {
      const next = [t.id, ...r.filter((id) => id !== t.id)].slice(0, 6);
      save("pocket-recents", next);
      return next;
    });
  };

  const goToTool = (t) => {
    navigate("/tool/" + t.id);
    handleOpenTool(t);
  };

  const openToolFromPalette = (t) => {
    setPaletteOpen(false);
    goToTool(t);
  };

  const toggleStar = (id) => {
    setFavorites((f) => {
      const next = f.includes(id) ? f.filter((x) => x !== id) : [...f, id];
      save("pocket-favs", next);
      return next;
    });
  };

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "var(--surface-app)" }}>
      <TopBar tool={tool} onHome={() => navigate("/")} onOpenPalette={() => setPaletteOpen(true)}
        starred={tool ? favorites.includes(tool.id) : false}
        onStar={() => tool && toggleStar(tool.id)}
        theme={theme} onSetTheme={setTheme}
        mode={mode} onToggleMode={() => setMode((m) => (m === "dark" ? "light" : "dark"))}
        darkLevel={darkLevel} onSetDark={setDarkLevel} />
      
      <div style={{ flex: 1, minHeight: 0, display: "flex" }}>
        <Sidebar tools={tools} categories={categories}
          activeId={tool ? tool.id : null}
          collapsed={navCollapsed}
          onToggleCollapse={() => setNavCollapsed((c) => !c)}
          onOpen={goToTool} />

        <div style={{ flex: 1, minWidth: 0, minHeight: 0, display: "flex", flexDirection: "column" }}>
          <Routes>
            <Route path="/" element={
              <div data-screen-label="Home" style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
                <HomeScreen tools={tools} categories={categories} favorites={favorites} recents={recents}
                  onOpen={goToTool}
                  onStar={toggleStar}
                  onOpenPalette={() => setPaletteOpen(true)} />
              </div>
            } />
            <Route path="/tool/:toolId" element={
              <ToolPageWrapper tools={tools} openTool={handleOpenTool} />
            } />
          </Routes>
        </div>
      </div>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)}
        tools={tools} recents={recents} onSelect={openToolFromPalette} />
    </div>
  );
}
