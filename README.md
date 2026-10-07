# AutoPay Simple

Sponsored by CREIGNIFICENT LLC.

One simple job: take one-time cleaning payments or enroll recurring service customers in autopay.

## Resume here — October 6, 2026 (Pacific time)

**Project state: TEST MODE WORKING FOR MONTHLY AUTOPAY; NOT YET APPROVED FOR LIVE MONEY.**

### What worked tonight
- GitHub repository: `CreigT/autopay-simple` (`main`).
- Vercel production deployment reached **READY** after fixing module imports, adding the Stripe SDK, consolidating the API, and addressing Stripe Managed Payments.
- Vercel admin login worked after setting `ADMIN_PASSWORD` and `APP_SECRET`.
- Stripe test credentials were installed in Vercel (`STRIPE_SECRET_KEY` starts with `sk_test_`). Never commit or paste the actual key.
- A test webhook destination was configured in Stripe for `/api/webhook`; signing secret was entered in Vercel per owner. Verify delivery/signature status again before production.
- **Successful $1.00 monthly subscription checkout in Stripe test mode**, with a client row showing **Active Autopay**, a paid date of **Oct 6, 2026**, and Stripe audit entries including `checkout.session.completed`, `customer.subscription.created`, and `invoice.paid` (owner's dashboard screenshot at ~10:36 PM PT).
- This is a **simulated payment**, not money received.
- The confirmation page says **"Stripe has your authorization"**: it is not, by itself, proof of a paid invoice.

### Current issues / important details
- One-time payment test **has not passed**. Earlier test attempts created customer entries with **$0.00 / Pending** but no completed Checkout. Do not interpret those rows as successful charges.
- The dashboard is currently visually basic and uses a misleading **"Monthly amount"** field label even when **One-time payment** is selected. Improve clarity before customers rely on it.
- Do **not** treat a Vercel **READY** build as live payment readiness.
- Before sending any client links, confirm `NEXT_PUBLIC_APP_URL` matches the intended public production domain, not an old per-deployment URL.
- Chrome previously showed a red **Dangerous** warning on versioned Vercel links. Investigate browser/site reputation before directing real customers to those URLs.
- Multiple test customers were created during failed checkouts; review and clean up test-only records only in the Stripe sandbox after verifying nothing important is needed.
- No live secret keys are stored in GitHub. All Vercel environment values should remain private.

### Tomorrow — exact next steps
1. Open the current Vercel production deployment and verify its URL, HTTPS, deployment status, and environment settings. Do not use stale versioned URLs.
2. Test **one-time $1.00 Checkout** in Stripe **test mode** with a fresh test customer; require a Stripe-hosted Checkout URL, successful card payment, a recorded PaymentIntent, and the dashboard showing **Paid** and **$1.00** (not $0.00/Pending).
3. In the Stripe **test-mode** webhook destination, verify **successful HTTP 2xx deliveries** for the relevant events; test an invalid-signature POST is rejected. Dashboard audit visibility alone is not full proof of webhook delivery.
4. Test failed card payment; verify failed state and no false paid confirmation. Test subscription pause/resume and cancellation at period end. Check duplicate-subscription prevention and idempotency for retried requests.
5. Verify receipt/notification settings and review customer-facing checkout, privacy, and mobile usability. Correct any incomplete error handling or dashboard statuses.
6. **Only after tests pass:** set up a separate Stripe **LIVE** webhook signing secret and live `sk_live_` credential in Vercel, carefully verify matching environments, redeploy, and run a small controlled **real** payment. Do not put live credentials in chat or GitHub.
7. Check live payment in Stripe and dashboard/audit independently. Declare **PRODUCTION PASS** only after a verified live charge, webhook processing, and accurate records.

### Quick-start links
- GitHub: https://github.com/CreigT/autopay-simple
- Vercel project: https://vercel.com/creigterrence-8552s-projects/autopay-simple
- Intended public URL (verify mapping first): https://autopay-simple.vercel.app/admin
- Stripe webhooks: https://dashboard.stripe.com/webhooks

**Next smallest action tomorrow:** complete the **one-time $1.00 test payment**, then confirm it appears as **Paid / $1.00** in AutoPay Simple. Do not charge clients through this app until production verification is complete.

---

## Flow

1. Admin creates a client: name, email, monthly amount, billing day (1–28).
2. App returns a signed enrollment link, valid for 14 days.
3. Client opens the link and continues to Stripe Checkout. Stripe Checkout presents the methods available on the account and compatible with that session. This app never receives card or bank credentials.
4. Stripe creates the monthly subscription and charges on the billing day.
5. Dashboard reads Stripe: Active Autopay, next payment, amount, paid, failed, cancelled.
6. Stripe emails receipts and failed-payment notices when those customer emails are enabled.
7. Admin can pause, resume, or cancel at period end.
8. `/api/webhook` rejects any event whose Stripe signature does not verify. Customer metadata is stamped only after that check. The dashboard paid date comes from Stripe invoices, not from the success page.

## Setup

Use Stripe test mode until the checklist below passes. Never switch to live keys until one-time and subscription test flows, webhook security, and payment status reconciliation have passed.

```bash
cp .env.example .env.local
npm install
npm run dev
```

Env vars: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_APP_URL`, `ADMIN_PASSWORD`, `APP_SECRET`.

Stripe Dashboard, test mode:

- Enable card and ACH Direct Debit.
- Customer emails: successful payment receipts and failed payment notices.
- Billing → Revenue recovery: Smart Retries on.
- Webhook endpoint: `https://YOUR_DOMAIN/api/webhook`
- Events: `checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`

Local webhooks: `stripe listen --forward-to localhost:3000/api/webhook`

## Not production-ready until this passes

1. Enrollment link opens Stripe Checkout.
2. Test card `4242 4242 4242 4242` completes and `invoice.paid` is verified.
3. A second invoice can be created in the Stripe dashboard and paid.
4. Failed payment: test card `4000 0000 0000 0341`, or ACH account `000111111113` / routing `110000000`. Dashboard shows Failed. Stripe emails the client.
5. Cancel at period end from the dashboard. Status becomes scheduled to end, then Cancelled.
6. A forged webhook POST without a valid signature returns 400 and does not stamp the client.

ACH success test account: `000123456789`, routing `110000000`.

## Deploy

Push this folder to GitHub and import it on Vercel. Set the same env vars. Set `NEXT_PUBLIC_APP_URL` to the Vercel URL. Add the live webhook only after the test checklist passes.
