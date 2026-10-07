import { ownerOk, stripe } from "../../../lib/stripe";

export async function POST(request) {
  if (!ownerOk(request)) return Response.json({ error: "Owner login required" }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const amount = Math.round(Number(body.amount) * 100);
  if (!body.name || !body.email || !amount) return Response.json({ error: "Name, email, and amount are required" }, { status: 400 });
  try {
    const customer = await stripe("/customers", "POST", {
      name: body.name,
      email: body.email,
      "metadata[app]": "autopay-simple",
      "metadata[amount]": String(amount),
      "metadata[billing_day]": String(body.day || "1")
    });
    const origin = process.env.NEXT_PUBLIC_APP_URL || "https://autopay-simple.vercel.app";
    const session = await stripe("/checkout/sessions", "POST", {
      mode: "subscription",
      customer: customer.id,
      "payment_method_types[0]": "card",
      "payment_method_types[1]": "us_bank_account",
      "line_items[0][quantity]": "1",
      "line_items[0][price_data][currency]": "usd",
      "line_items[0][price_data][unit_amount]": String(amount),
      "line_items[0][price_data][recurring][interval]": "month",
      "line_items[0][price_data][product_data][name]": "Monthly autopay",
      success_url: origin + "/?paid=1",
      cancel_url: origin + "/?cancelled=1"
    });
    return Response.json({ url: session.url });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
