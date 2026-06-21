// Pocket app — shared "Split | <input> | <output>" view toggle for input→output tools.
// Returns a SegmentedControl plus the booleans/grid columns to drive panel visibility,
// so every tool gets the same behavior the Markdown previewer has. DS + tokens only.
import React from "react";
import { SegmentedControl } from "../Pocket Design System/components/forms/SegmentedControl.jsx";

export function useSplitView(leftLabel = "Input", rightLabel = "Output") {
  const [view, setView] = React.useState("Split");
  const showLeft = view === "Split" || view === leftLabel;
  const showRight = view === "Split" || view === rightLabel;
  const control = (
    <SegmentedControl options={["Split", leftLabel, rightLabel]} value={view} onChange={setView} />
  );
  return {
    view, setView, control, showLeft, showRight,
    columns: showLeft && showRight ? "1fr 1fr" : "1fr",
    leftStyle: { display: showLeft ? "flex" : "none" },
    rightStyle: { display: showRight ? "flex" : "none" },
  };
}
