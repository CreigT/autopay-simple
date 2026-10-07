import { NextResponse } from "next/server";
import { getStripe, APP_TAG } from "../../../lib/stripe";

export const runtime = "nodejs";

async function stamp(stripe, customerId, eventType) {
  if (!customerId) return;
  await stripe.customers.update(customerId, {
    metadata: {
      app: APP_TAG,
      last_event: eventType,
      last_event_at: new Date().toISOString(),
      status: eventType === "invoice.paid" ? "paid" : eventType
    }
  });
}

export async function POST(req) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "Missing webhook secret" }, { status: 500 });
  const signature = req.headers.get("stripe-signature");
  const payload = await req.text();
  let event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, secret);
  } catch (error) {
    return NextResponse.json({ error: `Webhook verification failed: ${error.message}` }, { status: 400 });
  }

  const obj = event.data.object;
  try {
    if (event.type === "checkout.session.completed") {
      await stamp(stripe, obj.customer, event.type);
    } else if (event.type === "invoice.paid" || event.type === "invoice.payment_failed") {
      await stamp(stripe, obj.customer, event.type);
    } else if (
      event.type === "customer.subscription.created" ||
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted"
    ) {
      await stamp(stripe, obj.customer, event.type);
    }
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ received: true, verified: true, type: event.type });
}
