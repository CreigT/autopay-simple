import crypto from "crypto";
import { NextResponse } from "next/server";
import { isAdmin } from "../../../lib/auth";
import { getStripe, appUrl, APP_TAG } from "../../../lib/stripe";

export async function POST(req) {
  if (!(await isAdmin())) return NextResponse.json({error:"Unauthorized"}, {status:401});
  const body=await req.json().catch(()=>({}));
  const name=String(body.name||"").trim();
  const email=String(body.email||"").trim().toLowerCase();
  const dollars=Number(body.amount);
  if (!name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || !Number.isFinite(dollars) || dollars<1 || dollars>100000)
    return NextResponse.json({error:"Valid name, email, and amount are required"},{status:400});
  try {
    const stripe=getStripe();
    const customer=await stripe.customers.create({name,email,metadata:{app:APP_TAG,payment_type:"one_time"}});
    const session=await stripe.checkout.sessions.create({
      mode:"payment",customer:customer.id,
      line_items:[{price_data:{currency:"usd",unit_amount:Math.round(dollars*100),product_data:{name:"Cleaning service — "+name}},quantity:1}],
      payment_intent_data:{metadata:{app:APP_TAG,customer_id:customer.id}},
      metadata:{app:APP_TAG,customer_id:customer.id,payment_type:"one_time"},
      success_url:appUrl()+"/success?session_id={CHECKOUT_SESSION_ID}",
      cancel_url:appUrl()+"/cancelled",
      expires_at:Math.floor(Date.now()/1000)+60*60*24
    },{idempotencyKey:crypto.randomUUID()});
    return NextResponse.json({url:session.url});
   } catch (e) {
    const reference = crypto.randomUUID().slice(0, 8);
    console.error("AutoPay checkout creation failed", { reference, type: e.type, code: e.code, message: e.message });
    const known = e.type === "StripeInvalidRequestError" || e.type === "StripeAuthenticationError" || e.type === "StripePermissionError";
    const message = known && typeof e.message === "string"
      ? e.message
      : `Payment setup failed. Reference: ${reference}`;
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
