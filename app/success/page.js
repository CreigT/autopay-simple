export default function SuccessPage() {
  return (
    <main className="panel" style={{ maxWidth: 640, marginTop: 28 }}>
      <span className="sponsor">Enrollment received</span>
      <h1 style={{ fontSize: 42 }}>Stripe has your authorization.</h1>
      <p className="lede">This page does not mark you paid. AutoPay Simple waits for Stripe to confirm the payment by webhook. Bank account payments can take a few days to clear. A receipt is emailed by Stripe when the invoice is paid.</p>
    </main>
  );
}
