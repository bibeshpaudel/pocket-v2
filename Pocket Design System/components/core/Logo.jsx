import React from "react";

/** Pocket logo: the amber mark, optionally with the wordmark. */
export function Logo({ size = 28, wordmark = true, style }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: Math.round(size * 0.36), ...style }}>
      <svg width={size} height={size} viewBox="0 0 32 32" aria-label="Pocket">
        <rect x="0" y="0" width="32" height="32" rx="8" fill="#f59e0b"></rect>
        <text x="50%" y="54%" dominantBaseline="middle" textAnchor="middle" fill="#f8fafc" fontFamily="var(--font-sans), system-ui, sans-serif" fontWeight="bold" fontSize="20">P</text>
      </svg>
      {wordmark ? (
        <span style={{
          fontFamily: "var(--font-sans)",
          fontWeight: "var(--weight-semibold)",
          fontSize: Math.round(size * 0.71),
          letterSpacing: "var(--tracking-tight)",
          color: "var(--text-primary)",
          lineHeight: 1,
        }}>Pocket</span>
      ) : null}
    </span>
  );
}
