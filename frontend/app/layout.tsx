import localFont from "next/font/local";
import { Geist_Mono } from "next/font/google";
import "./globals.css";

const teleNeoExtraBold = localFont({
  src: "./fonts/Tele Neo Extrabold.otf",
  variable: "--font-sans",
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <title>T-MoodBile - Customer Sentiment Dashboard</title>
        <meta name="description" content="Real-time customer sentiment analysis dashboard" />
        <link rel="icon" href="/TMoodBileLogo.svg" />
      </head>
      <body className={`${teleNeoExtraBold.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}