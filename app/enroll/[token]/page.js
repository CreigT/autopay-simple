"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function EnrollPage() {
  const { token } = useParams();
  const [message, setMessage] = useState("Checking your secure link…");
  const [ready, setReady] = useState(null);

  useEffect(() => {
    if (!token) return;
    let ignore = false;
    (async () => {
      const res = await fetch("/api/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token })
      });
      const data = await res.json();
      if (ignore) return;
      if (!res.ok) {
        setMessage(data.error || "This link is not valid.");
        return;
      }
      if (data.already) {
        setMessage(data.message);
        return;
      }
      setReady(data);
      setMessage("");
    })();
    return () => { ignore = true; };
  }, [token]);

  return (
    <main className="panel" style={{ maxWidth: 560, marginTop: 28 }}>
      <span className="sponsor">Secure enrollment</span>
      <h1 style={{ fontSize: 42 }}>Set up autopay</h1>
      {message && <p>{message}</p>}
      {ready && (
        <>
          <p className="lede">Continue to Stripe to choose a bank account (ACH) or card for {ready.name}. This page is only for this enrollment. AutoPay Simple never sees the card or bank details, and it does not show any other client.</p>
          <p><b>${(ready.amountCents / 100).toFixed(2)}</b> on day {ready.billingDay} of each month.</p>
          <p><a className="btn" href={ready.url}>Continue to Stripe</a></p>
        </>
      )}
    </main>
  );
}
