export const metadata = { title: "AutoPay Simple", description: "Monthly autopay. Sponsored by CREIGNIFICENT LLC." };
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "Arial, sans-serif", background: "#f4f1ea", color: "#17231c" }}>
        <main style={{ width: "min(720px, calc(100% - 24px))", margin: "0 auto", padding: "28px 0" }}>{children}</main>
      </body>
    </html>
  );
}
