"use client";
import { useState } from "react";

export default function Page() {
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [form, setForm] = useState({ name: "", email: "", amount: "", day: "1" });
  const [link, setLink] = useState("");
  const [error, setError] = useState("");

  async function login(event) {
    event.preventDefault();
    setError("");
    const response = await fetch("/api/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
    const data = await response.json();
    if (!response.ok) return setError(data.error || "Login failed");
    setToken(data.token);
  }

  async function createClient(event) {
    event.preventDefault();
    setError("");
    setLink("");
    const response = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
      body: JSON.stringify(form)
    });
    const data = await response.json();
    if (!response.ok) return setError(data.error || "Could not create the payment link");
    setLink(data.url);
  }

  return (
    <div>
      <p style={{ color: "#1c6b45", letterSpacing: ".12em", fontSize: 12, fontWeight: 700 }}>SPONSORED BY CREIGNIFICENT LLC</p>
      <h1>AutoPay Simple</h1>
      <p>Enter the client. The page gives you a Stripe link. The client opens that link and chooses a bank account or card. Stripe charges them every month.</p>
      {!token ? (
        <form onSubmit={login}>
          <label>Owner password<br /><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ width: "100%", padding: 12, margin: "8px 0" }} /></label>
          <button style={{ background: "#114831", color: "#fff", border: 0, borderRadius: 999, padding: "12px 16px" }}>Open</button>
        </form>
      ) : (
        <form onSubmit={createClient}>
          <label>Name<br /><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required style={{ width: "100%", padding: 12, margin: "8px 0" }} /></label>
          <label>Email<br /><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required style={{ width: "100%", padding: 12, margin: "8px 0" }} /></label>
          <label>Monthly amount<br /><input type="number" min="1" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required style={{ width: "100%", padding: 12, margin: "8px 0" }} /></label>
          <label>Billing day<br /><input type="number" min="1" max="28" value={form.day} onChange={(e) => setForm({ ...form, day: e.target.value })} required style={{ width: "100%", padding: 12, margin: "8px 0" }} /></label>
          <button style={{ background: "#114831", color: "#fff", border: 0, borderRadius: 999, padding: "12px 16px" }}>Create payment link</button>
        </form>
      )}
      {error ? <p style={{ color: "#8d2f2f" }}>{error}</p> : null}
      {link ? <p>Send this link to that client only: <a href={link}>{link}</a></p> : null}
    </div>
  );
}
