import { NextResponse } from "next/server";
import { readEnroll } from "../../../../lib/auth";
import { getStripe, appUrl, APP_TAG } from "../../../../lib/stripe";

export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  let claim;
  try {
    claim = readEnroll(body.token);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  const stripe = getStripe();
  const customer = await stripe.customers.retrieve(claim.customerId);
  if (customer.deleted || customer.metadata?.app !== APP_TAG) {
    return NextResponse.json({ error: "Enrollment link is not valid." }, { status: 404 });
  }
  const existing = await stripe.subscriptions.list({ customer: customer.id, status: "all", limit: 5 });
  const live = existing.data.find((s) => ["active", "trialing", "past_due", "incomplete"].includes(s.status));
  if (live && !live.pause_collection) {
    return NextResponse.json({
      already: true,
      name: customer.name,
      message: "Autopay is already enrolled for this client."
    });
  }
  const cents = Number(customer.metadata.monthly_amount_cents);
  const billingDay = Number(customer.metadata.billing_day);
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customer.id,
    client_reference_id: customer.id,
    payment_method_types: ["card", "us_bank_account"],
    payment_method_options: {
      us_bank_account: {
        financial_connections: { permissions: ["payment_method"] },
        verification_method: "automatic"
      }
    },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: cents,
          recurring: { interval: "month" },
          product_data: {
            name: `Monthly autopay — ${customer.name}`,
            metadata: { app: APP_TAG, customer_id: customer.id }
          }
        }
      }
    ],
    subscription_data: {
      description: `Monthly autopay for ${customer.name}`,
      metadata: { app: APP_TAG, customer_id: customer.id, sponsor: "CREIGNIFICENT LLC" },
      billing_cycle_anchor_config: { day_of_month: billingDay }
    },
    success_url: `${appUrl()}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl()}/cancelled`,
    metadata: { app: APP_TAG, customer_id: customer.id }
  });
  return NextResponse.json({
    url: session.url,
    name: customer.name,
    amountCents: cents,
    billingDay
  });
}
