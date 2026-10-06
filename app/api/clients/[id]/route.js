import { NextResponse } from "next/server";
import { isAdmin, signEnroll } from "../../../../lib/auth";
import { getStripe, appUrl, APP_TAG } from "../../../../lib/stripe";

async function ownCustomer(stripe, id) {
  const customer = await stripe.customers.retrieve(id);
  if (customer.deleted || customer.metadata?.app !== APP_TAG) {
    throw new Error("Client not found");
  }
  return customer;
}

export async function POST(req, { params }) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const stripe = getStripe();
  const customer = await ownCustomer(stripe, id);
  const action = body.action;

  if (action === "link") {
    const enrollUrl = `${appUrl()}/enroll/${signEnroll(customer.id)}`;
    return NextResponse.json({ enrollUrl });
  }

  const subs = await stripe.subscriptions.list({ customer: id, status: "all", limit: 5 });
  const subscription = subs.data.find((s) => !["canceled", "incomplete_expired"].includes(s.status));
  if (!subscription) return NextResponse.json({ error: "No active autopay to update." }, { status: 400 });

  if (action === "pause") {
    await stripe.subscriptions.update(subscription.id, {
      pause_collection: { behavior: "void" }
    });
  } else if (action === "resume") {
    await stripe.subscriptions.update(subscription.id, { pause_collection: "" });
  } else if (action === "cancel") {
    await stripe.subscriptions.update(subscription.id, { cancel_at_period_end: true });
  } else if (action === "cancel_now") {
    await stripe.subscriptions.cancel(subscription.id);
  } else {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  await stripe.customers.update(id, {
    metadata: {
      last_event: `admin.${action}`,
      last_event_at: new Date().toISOString()
    }
  });
  return NextResponse.json({ ok: true });
}
