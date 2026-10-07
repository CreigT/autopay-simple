export default function HomePage() {
  return (
    <main>
      <section className="hero">
        <div>
          <h1>One link. Monthly autopay.</h1>
          <p className="lede">
            Send a client one secure link. They enter their name and email, choose a bank account or card, and authorize recurring billing. Stripe charges them. You watch a simple dashboard.
          </p>
        </div>
        <aside className="stamp">
          <span className="sponsor">V1 job</span>
          <ol>
            <li>Create the client.</li>
            <li>Send the enrollment link.</li>
            <li>Client enrolls on Stripe.</li>
            <li>Stripe charges every month.</li>
            <li>Pause or cancel from the dashboard.</li>
          </ol>
        </aside>
      </section>
      <section className="grid">
        <div className="tile"><span>Status</span><b>Active Autopay</b></div>
        <div className="tile"><span>Schedule</span><b>Next payment</b></div>
        <div className="tile"><span>Money</span><b>Amount / Paid</b></div>
        <div className="tile"><span>Problems</span><b>Failed / Cancelled</b></div>
      </section>
      <section className="panel">
        <h2>What this product does not do</h2>
        <p className="note">Clients only open their own enrollment link. They cannot see another client. The full list is on the owner dashboard, behind the owner password.</p>
        <p><a className="btn" href="/admin">Owner dashboard</a></p>
      </section>
    </main>
  );
}
