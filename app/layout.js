import "./globals.css";

export const metadata = {
  title: "AutoPay Simple",
  description: "Put a recurring service customer on autopay. Sponsored by CREIGNIFICENT LLC."
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
