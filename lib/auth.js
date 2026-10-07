import crypto from "crypto";
import { cookies } from "next/headers";

const COOKIE = "aps_admin";

function secret() {
  const value = process.env.APP_SECRET;
  if (!value) throw new Error("Missing APP_SECRET");
  return value;
}

function sign(value) {
  return crypto.createHmac("sha256", secret()).update(value).digest("base64url");
}

export function adminToken() {
  const exp = Date.now() + 12 * 60 * 60 * 1000;
  const payload = Buffer.from(JSON.stringify({ role: "admin", exp })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function verifyAdminToken(token) {
  if (!token || !token.includes(".")) return false;
  const [payload, sig] = token.split(".");
  const expected = sign(payload);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString());
    return data.role === "admin" && data.exp > Date.now();
  } catch {
    return false;
  }
}

export async function isAdmin() {
  const jar = await cookies();
  return verifyAdminToken(jar.get(COOKIE)?.value);
}

export async function setAdminCookie() {
  const jar = await cookies();
  jar.set(COOKIE, adminToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12
  });
}

export async function clearAdminCookie() {
  const jar = await cookies();
  jar.set(COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
}

export function passwordsMatch(input) {
  const expected = process.env.ADMIN_PASSWORD || "";
  const a = Buffer.from(String(input));
  const b = Buffer.from(expected);
  if (!expected || a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function signEnroll(customerId) {
  const exp = Date.now() + 14 * 24 * 60 * 60 * 1000;
  const payload = Buffer.from(JSON.stringify({ customerId, exp })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function readEnroll(token) {
  if (!token || !token.includes(".")) throw new Error("Invalid enrollment link");
  const [payload, sig] = token.split(".");
  const expected = sign(payload);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    throw new Error("Invalid enrollment link");
  }
  const data = JSON.parse(Buffer.from(payload, "base64url").toString());
  if (!data.customerId || data.exp < Date.now()) throw new Error("Enrollment link expired");
  return data;
}
