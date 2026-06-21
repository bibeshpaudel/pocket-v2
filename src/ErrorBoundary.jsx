// Pocket — tool-level error boundary + Suspense loading fallback. Keeps one
// crashing tool from blanking the whole app, and shows a spinner while a lazy
// tool chunk loads. DS primitives + tokens only.
import React from "react";
import { EmptyState } from "../Pocket Design System/components/surfaces/EmptyState.jsx";
import { Button } from "../Pocket Design System/components/core/Button.jsx";
import { Icon } from "../Pocket Design System/components/core/Icon.jsx";

// One-time keyframes for the loading spinner.
if (typeof document !== "undefined" && !document.getElementById("pkt-css-spin")) {
  const s = document.createElement("style");
  s.id = "pkt-css-spin";
  s.textContent = "@keyframes pkt-spin{to{transform:rotate(360deg)}}";
  document.head.appendChild(s);
}

/** Centered spinner used as the Suspense fallback for lazy tool chunks. */
export function ToolLoading({ label = "Loading…" }) {
  return (
    <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, color: "var(--text-tertiary)" }}>
      <span style={{ display: "inline-flex", animation: "pkt-spin 0.8s linear infinite" }}>
        <Icon name="loader-circle" size={22} />
      </span>
      <span style={{ fontSize: "var(--text-xs)", fontFamily: "var(--font-sans)" }}>{label}</span>
    </div>
  );
}

/** Catches render/runtime errors thrown by a tool and shows a recoverable panel
    instead of crashing the app. `resetKey` (e.g. the tool id) clears the error
    automatically when it changes, so navigating to another tool always recovers. */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidUpdate(prevProps) {
    if (this.state.error && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ error: null });
    }
  }

  componentDidCatch(error, info) {
    // Surface it in the console for debugging; nothing leaves the browser.
    if (typeof console !== "undefined") console.error("[Pocket] tool crashed:", error, info);
  }

  render() {
    if (this.state.error) {
      const message = (this.state.error && this.state.error.message) || "Something went wrong while running this tool.";
      return (
        <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14 }}>
          <EmptyState icon="triangle-alert" title="This tool hit an error"
            hint={message.length > 200 ? message.slice(0, 200) + "…" : message} />
          <Button variant="secondary" size="sm" icon="rotate-ccw" onClick={() => this.setState({ error: null })}>Try again</Button>
        </div>
      );
    }
    return this.props.children;
  }
}
