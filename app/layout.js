import "./globals.css";

export const metadata = {
  title: "OneGovAI",
  description: "One profile. One login. Every government service."
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
