import { NextResponse } from "next/server";
import { isAdmin, signEnroll } from "../../../lib/auth";
import { getStripe, appUrl, APP_TAG } from "../../../lib/stripe";
import { amountOf, statusOf, when, money, isOurs } from "../../../lib/format";

function clean(value) {
  return String(value || "").trim();
}

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const stripe = getStripe();
  const customers = await stripe.customers.list({ limit: 100 });
  const ours = customers.data.filter(isOurs);
  const rows = [];
  for (const customer of ours) {
    const subs = await stripe.subscriptions.list({
      customer: customer.id,
      status: "all",
      limit: 5
    });
    const subscription = subs.data.find((s) => s.status !== "canceled") || subs.data[0] || null;
    const invoices = await stripe.invoices.list({ customer: customer.id, limit: 6 });
    const latest = invoices.data[0];
    rows.push({
      id: customer.id,
      name: customer.name || "—",
      email: customer.email || "—",
      amount: money(amountOf(customer, subscription)),
      amountCents: amountOf(customer, subscription),
      billingDay: customer.metadata?.billing_day || "—",
      status: statusOf(customer, subscription),
      nextPayment: subscription?.pause_collection ? "Paused" : when(subscription?.current_period_end),
      paid: latest?.status === "paid" ? when(latest.status_transitions?.paid_at || latest.created) : "—",
      failed: invoices.data.some((inv) => inv.status === "open" && inv.attempted) ? "Yes" : "No",
      subscriptionId: subscription?.id || null,
      cancelAtPeriodEnd: Boolean(subscription?.cancel_at_period_end),
      enrollUrl: `${appUrl()}/enroll/${signEnroll(customer.id)}`,
      invoices: invoices.data.map((inv) => ({
        id: inv.id,
        number: inv.number,
        status: inv.status,
        amount: money(inv.amount_due),
        date: when(inv.created),
        hosted: inv.hosted_invoice_url
      })),
      lastEvent: customer.metadata?.last_event || "—",
      lastEventAt: customer.metadata?.last_event_at || "—"
    });
  }
  rows.sort((a, b) => a.name.localeCompare(b.name));
  return NextResponse.json({ clients: rows });
}

export async function POST(req) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const name = clean(body.name);
  const email = clean(body.email).toLowerCase();
  const dollars = Number(body.amount);
  const billingDay = Number(body.billingDay);
  if (!name || !email.includes("@")) {
    return NextResponse.json({ error: "Name and a valid email are required." }, { status: 400 });
  }
  if (!Number.isFinite(dollars) || dollars < 1 || dollars > 100000) {
    return NextResponse.json({ error: "Monthly amount must be between $1 and $100,000." }, { status: 400 });
  }
  if (!Number.isInteger(billingDay) || billingDay < 1 || billingDay > 28) {
    return NextResponse.json({ error: "Billing date must be a day from 1 to 28." }, { status: 400 });
  }
  const cents = Math.round(dollars * 100);
  const stripe = getStripe();
  const customer = await stripe.customers.create({
    name,
    email,
    metadata: {
      app: APP_TAG,
      sponsor: "CREIGNIFICENT LLC",
      monthly_amount_cents: String(cents),
      billing_day: String(billingDay),
      status: "link_sent",
      last_event: "client.created",
      last_event_at: new Date().toISOString()
    }
  });
  const token = signEnroll(customer.id);
  const enrollUrl = `${appUrl()}/enroll/${token}`;
  return NextResponse.json({
    id: customer.id,
    enrollUrl,
    mailto: `mailto:${email}?subject=${encodeURIComponent("Your autopay enrollment link")}&body=${encodeURIComponent(`Hi ${name},\n\nUse this secure link to enroll in monthly autopay. You can choose a card or bank account. We never see or store those details.\n\n${enrollUrl}\n\nCREIGNIFICENT LLC`)}`
  });
}
