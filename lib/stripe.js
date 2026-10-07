import crypto from "crypto";

function secret() {
  return process.env.APP_SECRET || process.env.ADMIN_PASSWORD || "";
}

export function ownerOk(request) {
  const header = request.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  const expected = crypto.createHmac("sha256", secret()).update("owner").digest("hex");
  return token.length === expected.length && crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));
}

export function stripeKey() {
  return process.env.STRIPE_SECRET_KEY || process.env.STRIP_SECRET_KEY || "";
}

export async function stripe(path, method, params) {
  const key = stripeKey();
  if (!key) throw new Error("Stripe key is missing in Vercel");
  const response = await fetch("https://api.stripe.com/v1" + path, {
    method,
    headers: { Authorization: "Bearer " + key, "Content-Type": "application/x-www-form-urlencoded" },
    body: params ? new URLSearchParams(params).toString() : undefined
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || "Stripe request failed");
  return data;
}
