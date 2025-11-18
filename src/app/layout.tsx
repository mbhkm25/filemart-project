import "./globals.css";
import { IBM_Plex_Sans_Arabic } from "next/font/google";

const ibmArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-ibm-arabic",
  display: "swap",
});

export const metadata = {
  title: "Filemart",
  description: "Filemart MVP",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl" className={ibmArabic.variable}>
      <body>{children}</body>
    </html>
  );
}
