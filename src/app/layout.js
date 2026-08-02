import "./globals.css";

export const metadata = {
  title: "Edgebook | Trading Journal",
  description: "A focused trading journal for sharper decisions.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="cs">
      <body>{children}</body>
    </html>
  );
}
