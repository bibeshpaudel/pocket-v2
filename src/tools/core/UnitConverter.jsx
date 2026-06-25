import React from "react";
import { Panel } from "../../../Pocket Design System/components/surfaces/Panel.jsx";
import { CopyButton } from "../../../Pocket Design System/components/core/CopyButton.jsx";
import { IconButton } from "../../../Pocket Design System/components/core/IconButton.jsx";
import { Button } from "../../../Pocket Design System/components/core/Button.jsx";
import { Select } from "../../../Pocket Design System/components/forms/Select.jsx";
import { SegmentedControl } from "../../../Pocket Design System/components/forms/SegmentedControl.jsx";
import { Input } from "../../../Pocket Design System/components/forms/Input.jsx";

const UNIT_CATEGORIES = {
  Length: {
    units: [
      { id: "m", label: "Meters (m)", factor: 1 },
      { id: "km", label: "Kilometers (km)", factor: 1000 },
      { id: "mi", label: "Miles (mi)", factor: 1609.344 },
      { id: "ft", label: "Feet (ft)", factor: 0.3048 },
      { id: "in", label: "Inches (in)", factor: 0.0254 }
    ]
  },
  Mass: {
    units: [
      { id: "kg", label: "Kilograms (kg)", factor: 1 },
      { id: "g", label: "Grams (g)", factor: 0.001 },
      { id: "lb", label: "Pounds (lb)", factor: 0.45359237 },
      { id: "oz", label: "Ounces (oz)", factor: 0.028349523 }
    ]
  },
  Data: {
    units: [
      { id: "B", label: "Bytes (B)", factor: 1 },
      { id: "KB", label: "Kilobytes (KB)", factor: 1024 },
      { id: "MB", label: "Megabytes (MB)", factor: 1024 * 1024 },
      { id: "GB", label: "Gigabytes (GB)", factor: 1024 * 1024 * 1024 },
      { id: "TB", label: "Terabytes (TB)", factor: 1024 * 1024 * 1024 * 1024 }
    ]
  },
  Temperature: {
    units: [
      { id: "C", label: "Celsius (°C)" },
      { id: "F", label: "Fahrenheit (°F)" },
      { id: "K", label: "Kelvin (K)" }
    ]
  }
};

export default function UnitConverterScreen() {
  const [category, setCategory] = React.useState("Length");
  const units = UNIT_CATEGORIES[category].units;
  const [fromUnit, setFromUnit] = React.useState(units[0].id);
  const [toUnit, setToUnit] = React.useState(units[1]?.id || units[0].id);
  const [inputVal, setInputVal] = React.useState("1");

  React.useEffect(() => {
    const nextUnits = UNIT_CATEGORIES[category].units;
    setFromUnit(nextUnits[0].id);
    setToUnit(nextUnits[1]?.id || nextUnits[0].id);
  }, [category]);

  const outputVal = React.useMemo(() => {
    const num = Number(inputVal);
    if (isNaN(num)) return "Invalid number";
    if (category === "Temperature") {
      if (fromUnit === toUnit) return num.toString();
      let celsius = num;
      if (fromUnit === "F") celsius = (num - 32) * 5/9;
      if (fromUnit === "K") celsius = num - 273.15;

      let res = celsius;
      if (toUnit === "F") res = (celsius * 9/5) + 32;
      if (toUnit === "K") res = celsius + 273.15;
      return Number(res.toFixed(6)).toString();
    } else {
      const fromObj = units.find(u => u.id === fromUnit);
      const toObj = units.find(u => u.id === toUnit);
      if (!fromObj || !toObj) return "";
      const baseVal = num * fromObj.factor;
      const convertedVal = baseVal / toObj.factor;
      return Number(convertedVal.toFixed(9)).toString();
    }
  }, [inputVal, category, fromUnit, toUnit, units]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, height: "100%", minHeight: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <SegmentedControl options={["Length", "Mass", "Data", "Temperature"]} value={category} onChange={setCategory} />
        <span style={{ fontSize: 13, color: "var(--text-tertiary)" }}>From</span>
        <Select options={units.map(u => ({ value: u.id, label: u.label }))} value={fromUnit} onChange={e => setFromUnit(e.target.value)} />
        <span style={{ fontSize: 13, color: "var(--text-tertiary)" }}>To</span>
        <Select options={units.map(u => ({ value: u.id, label: u.label }))} value={toUnit} onChange={e => setToUnit(e.target.value)} />
        <span style={{ marginLeft: "auto" }}>
          <Button variant="ghost" size="sm" icon="rotate-ccw" onClick={() => setInputVal("1")}>Reset</Button>
        </span>
      </div>
      <div style={{ flex: 1, minHeight: 0, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Panel title="Input Value" variant="sunken"
          actions={<IconButton icon="x" label="Clear" size="sm" onClick={() => setInputVal("")} />}>
          <div style={{ padding: "20px 24px" }}>
            <Input mono value={inputVal} onChange={e => setInputVal(e.target.value)} placeholder="Enter numeric value..." style={{ height: 42, fontSize: 16, maxWidth: 360 }} />
          </div>
        </Panel>
        <Panel title="Result" variant="code" actions={<CopyButton onDark getText={() => outputVal} />}>
          <div style={{ padding: "24px 28px", fontFamily: "var(--font-mono)", fontSize: 28, fontWeight: 500, color: "var(--code-fg)", wordBreak: "break-all" }}>
            {outputVal}
            <span style={{ fontSize: 14, color: "var(--syn-comment)", marginLeft: 10, fontFamily: "var(--font-sans)", fontWeight: 400 }}>{toUnit}</span>
          </div>
        </Panel>
      </div>
    </div>
  );
}
