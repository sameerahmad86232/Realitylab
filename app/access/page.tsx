export const metadata = { title: "Private access · RealityLab", robots: { index: false, follow: false } };

export default function PrivateAccess() {
  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "24px", background: "#f4f7fa", color: "#18324a" }}>
      <section style={{ maxWidth: 430, width: "100%", padding: "32px", background: "white", border: "1px solid #dce5ed", borderRadius: 16, boxShadow: "0 16px 50px #10284012" }}>
        <a href="/" style={{ color: "#245e9e" }}>← RealityLab</a>
        <p style={{ fontSize: 12, letterSpacing: 2, textTransform: "uppercase", marginTop: 28 }}>Private maker preview</p>
        <h1 style={{ fontSize: 30, lineHeight: 1.2, margin: "12px 0" }}>Unlock live AI tools</h1>
        <p style={{ lineHeight: 1.7 }}>Live scanning and Build & Learn use limited inference credits. Enter the private preview access code to enable paid requests for eight hours. The recorded tour and examples remain public.</p>
        <form action="/api/access" method="POST" style={{ display: "grid", gap: 12, marginTop: 24 }}>
          <label htmlFor="access-code">Access code</label>
          <input id="access-code" name="code" type="password" required minLength={16} maxLength={256} autoComplete="off"
            style={{ padding: 14, fontSize: 16, border: "1px solid #9aaebe", borderRadius: 8, width: "100%", boxSizing: "border-box" }} />
          <button type="submit" style={{ padding: 14, fontSize: 15, border: 0, borderRadius: 8, background: "#183a57", color: "white", cursor: "pointer" }}>Unlock RealityLab</button>
        </form>
        <p role="status" style={{ fontSize: 13, marginTop: 22 }}>If your code was rejected, check the code and try again. After five failed attempts, access is temporarily limited.</p>
      </section>
    </main>
  );
}
