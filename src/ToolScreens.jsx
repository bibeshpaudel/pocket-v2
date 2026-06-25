// Pocket — fallback screen for tool ids that have no built UI. The 15 "core"
// tool screens that used to live here now each have their own lazy chunk under
// src/tools/core/ (see App.jsx's TOOL_REGISTRY); only StubScreen remains so the
// registry can fall back to it for unmapped ids.
import React from "react";
import { EmptyState } from "../Pocket Design System/components/surfaces/EmptyState.jsx";

export function StubScreen({ tool }) {
  return (
    <div style={{ display: "grid", placeItems: "center", height: "100%" }}>
      <EmptyState icon={tool.icon} title={tool.name + " isn't built in this UI kit"}
        hint="It would follow the same layout: options on top, input and output side by side." />
    </div>
  );
}
