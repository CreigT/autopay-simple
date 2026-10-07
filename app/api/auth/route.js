import { NextResponse } from "next/server";
import { passwordsMatch, setAdminCookie, clearAdminCookie, isAdmin } from "../../../lib/auth";

export async function GET() {
  return NextResponse.json({ ok: await isAdmin() });
}

export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  if (body.action === "logout") {
    await clearAdminCookie();
    return NextResponse.json({ ok: true });
  }
  if (!passwordsMatch(body.password || "")) {
    return NextResponse.json({ error: "Wrong password" }, { status: 401 });
  }
  await setAdminCookie();
  return NextResponse.json({ ok: true });
}
