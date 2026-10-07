import "./globals.css";

export const metadata = {
  title: "AutoPay Simple",
  description: "One link. Monthly autopay. Card and bank details stay on Stripe. Sponsored by CREIGNIFICENT LLC.",
  metadataBase: new URL("https://autopay-simple.vercel.app"),
  openGraph: {
    type: "website",
    url: "https://autopay-simple.vercel.app/",
    siteName: "AutoPay Simple",
    title: "AutoPay Simple",
    description: "One link. Monthly autopay. Card and bank details stay on Stripe.",
    images: [{ url: "https://cdn.jsdelivr.net/gh/CreigT/autopay-simple@main/og.png", width: 1200, height: 630 }]
  },
  twitter: {
    card: "summary_large_image",
    title: "AutoPay Simple",
    description: "One link. Monthly autopay. Card and bank details stay on Stripe.",
    images: ["https://cdn.jsdelivr.net/gh/CreigT/autopay-simple@main/og.png"]
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,560;9..144,640&family=Outfit:wght@400;550;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <div className="wrap">
          <header className="top">
            <a className="brand" href="/">
              <strong>AutoPay Simple</strong>
              <span className="sponsor">Sponsored by CREIGNIFICENT LLC</span>
            </a>
            <nav className="nav">
              <a href="/">Home</a>
            </nav>
          </header>
          {children}
          <footer>Card and bank details stay on Stripe. This app only stores name, email, amount, and status.</footer>
        </div>
      </body>
    </html>
  );
}
