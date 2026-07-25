import React from "react";

export default function HomePage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        background: "#050816",
        color: "#f9fafb",
        padding: "2rem"
      }}
    >
      <section
        style={{
          maxWidth: "640px",
          width: "100%",
          borderRadius: "1rem",
          border: "1px solid #1f2937",
          padding: "2rem",
          background:
            "radial-gradient(circle at top left, rgba(59,130,246,0.2), transparent 50%), radial-gradient(circle at bottom right, rgba(16,185,129,0.2), transparent 50%)"
        }}
      >
        <header style={{ marginBottom: "1.5rem", textAlign: "center" }}>
          <h1
            style={{
              fontSize: "2rem",
              fontWeight: 700,
              letterSpacing: "0.05em",
              marginBottom: "0.5rem"
            }}
          >
            🐛 Lorapok Coding Agent
          </h1>
          <p style={{ fontSize: "0.95rem", color: "#9ca3af" }}>
            Node.js CLI & web agent for automated coding, file operations, and workflows.
          </p>
        </header>

        <section style={{ marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "0.5rem" }}>
            Status
          </h2>
          <p style={{ fontSize: "0.95rem", color: "#d1d5db" }}>
            The website stack is initialized and responding. If you reached this page while fixing
            “website doesn&apos;t work”, the base Next.js app is now online.
          </p>
        </section>

        <section style={{ marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "0.5rem" }}>
            How to run the website locally
          </h2>
          <ol style={{ paddingLeft: "1.25rem", fontSize: "0.95rem", color: "#e5e7eb" }}>
            <li style={{ marginBottom: "0.4rem" }}>Change directory to the website folder:</li>
            <li
              style={{
                marginBottom: "0.8rem",
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas",
                fontSize: "0.85rem",
                backgroundColor: "#030712",
                padding: "0.5rem 0.75rem",
                borderRadius: "0.5rem",
                border: "1px solid #111827"
              }}
            >
              cd website
            </li>
            <li style={{ marginBottom: "0.4rem" }}>Install dependencies:</li>
            <li
              style={{
                marginBottom: "0.8rem",
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas",
                fontSize: "0.85rem",
                backgroundColor: "#030712",
                padding: "0.5rem 0.75rem",
                borderRadius: "0.5rem",
                border: "1px solid #111827"
              }}
            >
              npm install
            </li>
            <li style={{ marginBottom: "0.4rem" }}>Start the development server:</li>
            <li
              style={{
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas",
                fontSize: "0.85rem",
                backgroundColor: "#030712",
                padding: "0.5rem 0.75rem",
                borderRadius: "0.5rem",
                border: "1px solid #111827"
              }}
            >
              npm run dev
            </li>
          </ol>
        </section>

        <section>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "0.5rem" }}>
            Integration notes
          </h2>
          <p style={{ fontSize: "0.95rem", color: "#d1d5db", marginBottom: "0.25rem" }}>
            This website directory is a separate Next.js app living alongside the existing Node.js
            CLI and server stack.
          </p>
          <p style={{ fontSize: "0.9rem", color: "#9ca3af" }}>
            You can now wire this frontend to your existing API in{" "}
            <code style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas" }}>
              server.js
            </code>{" "}
            or expose endpoints from{" "}
            <code style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas" }}>
              index.js
            </code>{" "}
            and consume them via fetch in this app.
          </p>
        </section>
      </section>
    </main>
  );
}