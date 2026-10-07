const crypto = require("crypto");

function stripeKey() {
  return process.env.STRIPE_SECRET_KEY || process.env.STRIP_SECRET_KEY || "";
}

function appSecret() {
  return process.env.APP_SECRET || process.env.ADMIN_PASSWORD || "autopay-simple";
}

function send(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8");
      if (!raw) return resolve({});
      try { resolve(JSON.parse(raw)); } catch (error) { reject(error); }
    });
    req.on("error", reject);
  });
}

function ownerOk(req) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  const expected = crypto.createHmac("sha256", appSecret()).update("owner").digest("hex");
  return token && crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));
}

function ownerToken() {
  return crypto.createHmac("sha256", appSecret()).update("owner").digest("hex");
}

async function stripe(path, method, params) {
  const key = stripeKey();
  if (!key) throw new Error("Stripe key is missing");
  const response = await fetch("https://api.stripe.com/v1" + path, {
    method,
    headers: {
      Authorization: "Bearer " + key,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: params ? new URLSearchParams(params).toString() : undefined
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || "Stripe request failed");
  return data;
}

module.exports = async function handler(req, res) {
  try {
    if (req.method === "POST" && req.url.startsWith("/api/login")) {
      const body = await readBody(req);
      if (!process.env.ADMIN_PASSWORD || body.password !== process.env.ADMIN_PASSWORD) {
        return send(res, 401, { error: "Wrong password" });
      }
      return send(res, 200, { token: ownerToken() });
    }

    if (req.method === "POST" && req.url.startsWith("/api/checkout")) {
      if (!ownerOk(req)) return send(res, 401, { error: "Owner login required" });
      const body = await readBody(req);
      const amount = Math.round(Number(body.amount) * 100);
      const day = Math.min(28, Math.max(1, Number(body.day || 1)));
      if (!body.name || !body.email || !amount) return send(res, 400, { error: "Name, email, and amount are required" });
      const customer = await stripe("/customers", "POST", {
        name: body.name,
        email: body.email,
        "metadata[app]": "autopay-simple",
        "metadata[billing_day]": String(day),
        "metadata[amount]": String(amount)
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
        "line_items[0][price_data][product_data][name]": "Monthly autopay for " + body.name,
        success_url: origin + "/?paid=1",
        cancel_url: origin + "/?cancelled=1",
        "metadata[app]": "autopay-simple"
      });
      return send(res, 200, { url: session.url, customer: customer.id });
    }

    if (req.method === "GET" && req.url.startsWith("/api/clients")) {
      if (!ownerOk(req)) return send(res, 401, { error: "Owner login required" });
      const list = await stripe("/customers/search?query=" + encodeURIComponent("metadata['app']:'autopay-simple'"), "GET");
      const clients = [];
      for (const customer of list.data || []) {
        const subs = await stripe("/subscriptions?customer=" + customer.id + "&status=all&limit=1", "GET");
        const sub = (subs.data || [])[0];
        clients.push({
          id: customer.id,
          name: customer.name,
          email: customer.email,
          amount: Number(customer.metadata.amount || 0) / 100,
          day: customer.metadata.billing_day || "",
          status: sub ? sub.status : "link sent",
          subscription: sub ? sub.id : ""
        });
      }
      return send(res, 200, { clients });
    }

    if (req.method === "POST" && req.url.startsWith("/api/subscription")) {
      if (!ownerOk(req)) return send(res, 401, { error: "Owner login required" });
      const body = await readBody(req);
      if (!body.subscription) return send(res, 400, { error: "No subscription yet" });
      if (body.action === "pause") {
        await stripe("/subscriptions/" + body.subscription, "POST", { pause_collection: "keep_as_draft" });
      } else if (body.action === "resume") {
        await stripe("/subscriptions/" + body.subscription, "POST", { pause_collection: "" });
      } else if (body.action === "cancel") {
        await stripe("/subscriptions/" + body.subscription, "DELETE");
      }
      return send(res, 200, { ok: true });
    }

    return send(res, 404, { error: "Not found" });
  } catch (error) {
    return send(res, 500, { error: error.message });
  }
};
