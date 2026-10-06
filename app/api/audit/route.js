import { NextResponse } from "next/server";
import { isAdmin } from "../../../lib/auth";
import { getStripe, APP_TAG } from "../../../lib/stripe";

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const stripe = getStripe();
  const events = await stripe.events.list({ limit: 30 });
  const rows = events.data
    .filter((event) => {
      const meta = event.data?.object?.metadata;
      return meta?.app === APP_TAG || ["invoice.paid", "invoice.payment_failed", "checkout.session.completed"].includes(event.type);
    })
    .map((event) => ({
      id: event.id,
      type: event.type,
      created: new Date(event.created * 1000).toISOString(),
      object: event.data?.object?.id || ""
    }));
  return NextResponse.json({ events: rows });
}
