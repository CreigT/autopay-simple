import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "AutoPay Simple. One link. Monthly autopay. Sponsored by CREIGNIFICENT LLC.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#f4f1ea",
          color: "#17231c",
          fontFamily: "Georgia, serif"
        }}
      >
        <div style={{ width: 18, height: "100%", background: "#114831" }} />
        <div style={{ display: "flex", flexDirection: "column", padding: "92px 64px", justifyContent: "space-between" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 84, fontWeight: 700, letterSpacing: -2 }}>AutoPay Simple</div>
            <div style={{ marginTop: 28, fontSize: 32, color: "#5d6b62" }}>One link. Monthly autopay.</div>
            <div style={{ marginTop: 16, fontSize: 32, color: "#5d6b62" }}>Card and bank details stay on Stripe.</div>
          </div>
          <div style={{ fontSize: 24, letterSpacing: 2, color: "#1c6b45", fontWeight: 700 }}>
            SPONSORED BY CREIGNIFICENT LLC
          </div>
        </div>
      </div>
    ),
    size
  );
}
