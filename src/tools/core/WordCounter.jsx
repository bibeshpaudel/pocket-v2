import React from "react";
import { Panel } from "../../../Pocket Design System/components/surfaces/Panel.jsx";
import { Textarea } from "../../../Pocket Design System/components/forms/Textarea.jsx";
import { IconButton } from "../../../Pocket Design System/components/core/IconButton.jsx";
import { Icon } from "../../../Pocket Design System/components/core/Icon.jsx";
import { useSplitView } from "../../split-view.jsx";

export default function WordCounterScreen() {
  const [input, setInput] = React.useState("The quick brown fox jumps over the lazy dog.");
  const sv = useSplitView("Input", "Analysis");

  const stats = React.useMemo(() => {
    const charsWithSpaces = input.length;
    const charsWithoutSpaces = input.replace(/\s/g, "").length;

    const wordsList = input.trim().split(/\s+/).filter(Boolean);
    const wordCount = wordsList.length;

    const sentenceCount = input.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
    const paragraphCount = input.split(/\n+/).filter(p => p.trim().length > 0).length;
    const lineCount = input ? input.split(/\n/).length : 0;

    // Reading/speaking time
    const readTimeSec = Math.round((wordCount / 200) * 60);
    const readTimeStr = readTimeSec < 60 ? `${readTimeSec}s` : `${Math.ceil(readTimeSec / 60)} min`;

    const speakTimeSec = Math.round((wordCount / 130) * 60);
    const speakTimeStr = speakTimeSec < 60 ? `${speakTimeSec}s` : `${Math.ceil(speakTimeSec / 60)} min`;

    // Word frequencies
    const freq = {};
    wordsList.forEach(w => {
      const cleanWord = w.toLowerCase().replace(/[^a-zA-Z0-9]/g, "");
      if (cleanWord.length > 1) { // ignore single-char filler like "a" or punctuation
        freq[cleanWord] = (freq[cleanWord] || 0) + 1;
      }
    });
    const topWords = Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);

    return {
      charsWithSpaces,
      charsWithoutSpaces,
      wordCount,
      sentenceCount,
      paragraphCount,
      lineCount,
      readTimeStr,
      speakTimeStr,
      topWords
    };
  }, [input]);

  const metrics = [
    { label: "Words", value: stats.wordCount },
    { label: "Characters", value: stats.charsWithSpaces },
    { label: "Chars (no space)", value: stats.charsWithoutSpaces },
    { label: "Sentences", value: stats.sentenceCount },
    { label: "Paragraphs", value: stats.paragraphCount },
    { label: "Lines", value: stats.lineCount }
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, height: "100%", minHeight: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        {sv.control}
      </div>
      <div style={{ flex: 1, minHeight: 0, display: "grid", gridTemplateColumns: sv.columns, gap: 14 }}>
        <Panel style={sv.leftStyle} title="Input Text" variant="sunken"
          actions={<IconButton icon="x" label="Clear" size="sm" onClick={() => setInput("")} />}>
          <Textarea bare value={input} onChange={(e) => setInput(e.target.value)}
            placeholder="Type or paste text to count..." style={{ flex: 1, padding: "12px 14px", minHeight: 0 }} />
        </Panel>

        <Panel style={sv.rightStyle} title="Analysis" variant="raised">
          <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 24, overflowY: "auto", flex: 1 }}>

            {/* Grid Metrics */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
              {metrics.map(m => (
                <div key={m.label} style={{ background: "var(--surface-sunken)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 4 }}>
                  <span style={{ fontSize: 11, color: "var(--text-tertiary)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "var(--tracking-caps)" }}>{m.label}</span>
                  <span style={{ fontSize: 22, fontWeight: 600, color: "var(--text-primary)" }}>{m.value.toLocaleString()}</span>
                </div>
              ))}
            </div>

            {/* Speaking/Reading Times */}
            <div style={{ display: "flex", gap: 14 }}>
              <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 10, background: "rgba(0,0,0,0.15)", padding: "10px 14px", borderRadius: "var(--radius-md)" }}>
                <Icon name="book-open" size={18} style={{ color: "var(--amber-500)" }} />
                <div>
                  <div style={{ fontSize: 11, color: "var(--text-tertiary)" }}>Reading Time</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-secondary)" }}>{stats.readTimeStr}</div>
                </div>
              </div>
              <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 10, background: "rgba(0,0,0,0.15)", padding: "10px 14px", borderRadius: "var(--radius-md)" }}>
                <Icon name="megaphone" size={18} style={{ color: "var(--amber-500)" }} />
                <div>
                  <div style={{ fontSize: 11, color: "var(--text-tertiary)" }}>Speaking Time</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-secondary)" }}>{stats.speakTimeStr}</div>
                </div>
              </div>
            </div>

            {/* Word Frequencies */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", color: "var(--text-secondary)", letterSpacing: "var(--tracking-caps)" }}>Keyword Density</span>
              {stats.topWords.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {stats.topWords.map(([word, count]) => {
                    const pct = Math.round((count / stats.wordCount) * 100);
                    return (
                      <div key={word} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <span style={{ width: 100, fontSize: 13, fontFamily: "var(--font-mono)", color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis" }}>{word}</span>
                        <div style={{ flex: 1, height: 6, background: "var(--surface-sunken)", borderRadius: 3, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${Math.min(pct * 3, 100)}%`, background: "var(--amber-500)", borderRadius: 3 }} />
                        </div>
                        <span style={{ width: 60, fontSize: 12, textAlign: "right", color: "var(--text-tertiary)" }}>{count} ({pct}%)</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <span style={{ fontSize: 13, color: "var(--text-tertiary)", fontStyle: "italic" }}>Type more words to see density analytics.</span>
              )}
            </div>

          </div>
        </Panel>
      </div>
    </div>
  );
}
