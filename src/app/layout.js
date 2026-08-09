import "./globals.css";
import AuthWrapper from "@/components/auth/AuthWrapper";

export const metadata = {
  title: "Edgebook | Trading Journal",
  description: "A focused trading journal for sharper decisions.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="cs">
      <body>
        <AuthWrapper>{children}</AuthWrapper>
      </body>
    </html>
  );
}
