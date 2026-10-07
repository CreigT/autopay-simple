import Stripe from "stripe";

export const APP_TAG = "autopay-simple";
let stripeClient;
export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Missing STRIPE_SECRET_KEY");
  if (!stripeClient) stripeClient = new Stripe(key);
  return stripeClient;
}
export function appUrl() {
  const url = process.env.NEXT_PUBLIC_APP_URL || "https://autopay-simple-creigterrence-8552s-projects.vercel.app";
  return url.replace(/\/$/, "");
}
