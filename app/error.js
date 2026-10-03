"use client";

export default function Error({ error, reset }) {
  return (
    <div style={{ padding: 20, fontFamily: "sans-serif" }}>
      <h2>Something went wrong</h2>
      <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", background: "#fee", padding: 12 }}>
        {String(error?.message || error)}
        {"\n\n"}
        {String(error?.stack || "").slice(0, 1200)}
      </pre>
      <button onClick={() => reset()}>Try again</button>
    </div>
  );
                  }
