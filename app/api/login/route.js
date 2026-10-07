import crypto from "crypto";

function secret() {
  return process.env.APP_SECRET || process.env.ADMIN_PASSWORD || "";
}

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  if (!process.env.ADMIN_PASSWORD || body.password !== process.env.ADMIN_PASSWORD) {
    return Response.json({ error: "Wrong password" }, { status: 401 });
  }
  const token = crypto.createHmac("sha256", secret()).update("owner").digest("hex");
  return Response.json({ token });
}
