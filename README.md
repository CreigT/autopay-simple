# AutoPay Simple

Sponsored by CREIGNIFICENT LLC.

One job: put a recurring service customer on autopay.

## Flow

1. Admin creates a client: name, email, monthly amount, billing day (1–28).
2. App returns a signed enrollment link, valid for 14 days.
3. Client opens the link and continues to Stripe Checkout. They choose card or US bank account. This app never receives card or bank credentials.
4. Stripe creates the monthly subscription and charges on the billing day.
5. Dashboard reads Stripe: Active Autopay, next payment, amount, paid, failed, cancelled.
6. Stripe emails receipts and failed-payment notices when those customer emails are enabled.
7. Admin can pause, resume, or cancel at period end.
8. `/api/webhook` rejects any event whose Stripe signature does not verify. Customer metadata is stamped only after that check. The dashboard paid date comes from Stripe invoices, not from the success page.

## Setup

Use Stripe test mode until the checklist below passes. The connected Creignificent LLC account in this workspace is live mode. Do not point this app at live keys for the first run.

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
