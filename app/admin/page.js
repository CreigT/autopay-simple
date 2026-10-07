"use client";

import { useEffect, useState } from "react";

function badge(status) {
  const key = status.toLowerCase().includes("active")
    ? "active"
    : status.toLowerCase().includes("fail")
      ? "failed"
      : "link";
  return <span className={`badge ${key}`}>{status}</span>;
}

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [clients, setClients] = useState([]);
  const [events, setEvents] = useState([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", amount: "", billingDay: "1" });
  const [paymentType,setPaymentType]=useState("monthly");

  async function load() {
    const [dash, audit] = await Promise.all([fetch("/api/clients"), fetch("/api/audit")]);
    if (dash.status === 401) {
      setAuthed(false);
      return;
    }
    const data = await dash.json();
    const log = await audit.json();
    setClients(data.clients || []);
    setEvents(log.events || []);
    setAuthed(true);
  }

  useEffect(() => { load(); }, []);

  async function login(e) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password })
    });
    if (!res.ok) {
      setError("Wrong password");
      return;
    }
    setPassword("");
    await load();
  }

  async function createClient(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    const res = await fetch(paymentType === "one_time" ? "/api/checkout" : "/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error || "Could not create client");
      return;
    }
    setNotice(data.enrollUrl || data.url);
    setForm({ name: "", email: "", amount: "", billingDay: "1" });
    await load();
  }

  async function act(id, action) {
    setError("");
    const res = await fetch(`/api/clients/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action })
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Update failed");
      return;
    }
    if (action === "link") {
      await navigator.clipboard.writeText(data.enrollUrl);
      setNotice(data.enrollUrl);
    }
    await load();
  }

  if (!authed) {
    return (
      <main className="panel" style={{ maxWidth: 420, marginTop: 28 }}>
        <h1 style={{ fontSize: 36 }}>Dashboard</h1>
        <p className="note">Admin only. Clients never see this page.</p>
        <form onSubmit={login}>
          <label>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button type="submit">Enter</button>
        </form>
        {error && <p className="error">{error}</p>}
      </main>
    );
  }

  return (
    <main>
      <section className="panel">
        <h2>Create payment link</h2>
        <label>Payment type</label>
        <select aria-label="Payment type" value={paymentType} onChange={e=>setPaymentType(e.target.value)} style={{width:"100%",padding:12,marginBottom:16}}><option value="monthly">Monthly autopay</option><option value="one_time">One-time payment</option></select>
        <form onSubmit={createClient} className="row">
          <div>
            <label>Name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div>
            <label>Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div>
            <label>Monthly amount</label>
            <input type="number" min="1" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
          </div>
          {paymentType === "monthly" && <div>
            <label>Billing day</label>
            <input type="number" min="1" max="28" value={form.billingDay} onChange={(e) => setForm({ ...form, billingDay: e.target.value })} required />
          </div>}
          <button disabled={busy} type="submit">{busy ? "Saving" : "Create + link"}</button>
        </form>
        {notice && <p className="ok">Secure payment link: <a href={notice} target="_blank" rel="noopener noreferrer">{notice}</a></p>}
        {error && <p className="error">{error}</p>}
      </section>
      <section className="panel">
        <h2>Autopay</h2>
        <table>
          <thead>
            <tr>
              <th>Client</th><th>Amount</th><th>Next payment</th><th>Paid</th><th>Failed</th><th>Status</th><th></th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => (
              <tr key={client.id}>
                <td>{client.name}<br /><span className="note">{client.email}</span></td>
                <td>{client.amount}<br /><span className="note">Day {client.billingDay}</span></td>
                <td>{client.nextPayment}{client.cancelAtPeriodEnd ? " · ends after period" : ""}</td>
                <td>{client.paid}</td>
                <td>{client.failed}</td>
                <td>{badge(client.status)}</td>
                <td className="actions">
                  {client.paymentType !== "one_time" && <button className="ghost" onClick={() => act(client.id, "link")}>Copy link</button>}
                  {client.paymentType !== "one_time" && <a className="btn ghost" href={`mailto:${client.email}?subject=Autopay%20enrollment&body=${encodeURIComponent(client.enrollUrl)}`}>Email</a>}
                  {client.paymentType !== "one_time" && <button className="warn" onClick={() => act(client.id, client.status === "Paused" ? "resume" : "pause")}>{client.status === "Paused" ? "Resume" : "Pause"}</button>}
                  {client.paymentType !== "one_time" && <button className="danger" onClick={() => act(client.id, "cancel")}>Cancel</button>}
                </td>
              </tr>
            ))}
            {clients.length === 0 && <tr><td colSpan="7">No clients yet.</td></tr>}
          </tbody>
        </table>
      </section>
      <section className="panel">
        <h2>Audit log</h2>
        <p className="note">Paid is recorded only after Stripe sends a verified invoice.paid webhook. This list is Stripe’s event log.</p>
        <table>
          <thead><tr><th>When</th><th>Event</th><th>Object</th></tr></thead>
          <tbody>
            {events.map((event) => (
              <tr key={event.id}><td>{event.created}</td><td>{event.type}</td><td>{event.object}</td></tr>
            ))}
            {events.length === 0 && <tr><td colSpan="3">No matching events yet.</td></tr>}
          </tbody>
        </table>
        <p><button className="ghost" onClick={async () => { await fetch("/api/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "logout" }) }); setAuthed(false); }}>Log out</button></p>
      </section>
    </main>
  );
}
