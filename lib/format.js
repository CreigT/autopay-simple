import { APP_TAG } from "./stripe";

export function money(cents) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format((cents || 0) / 100);
}

export function when(unix) {
  if (!unix) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "America/Los_Angeles"
  }).format(new Date(unix * 1000));
}

export function statusOf(customer, subscription) {
  if (subscription?.pause_collection) return "Paused";
  const status = subscription?.status;
  if (status === "active" || status === "trialing") return "Active Autopay";
  if (status === "past_due" || status === "unpaid") return "Failed";
  if (status === "canceled" || status === "incomplete_expired") return "Cancelled";
  if (status === "incomplete") return "Awaiting bank";
  if (customer?.metadata?.status === "link_sent") return "Link sent";
  return "Not enrolled";
}

export function amountOf(customer, subscription) {
  const item = subscription?.items?.data?.[0];
  if (item?.price?.unit_amount) return item.price.unit_amount;
  return Number(customer?.metadata?.monthly_amount_cents || 0);
}

export function isOurs(obj) {
  return obj?.metadata?.app === APP_TAG;
}
