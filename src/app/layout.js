import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import TopNavHost from '@/components/layout/TopNavHost';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata = {
  title: "Coach - Mentorship & Professional Development Platform",
  description: "Connect with mentors, develop skills, and advance your career through our comprehensive mentorship platform.",
  keywords: ["mentorship", "coaching", "professional development", "career growth"],
  authors: [{ name: "Coach Platform" }],
  openGraph: {
    type: "website",
    url: "https://coach-platform.com",
    title: "Coach - Mentorship & Professional Development",
    description: "Connect with mentors and advance your career",
    images: [
      {
        url: "https://coach-platform.com/og-image.png",
        width: 1200,
        height: 630,
      },
    ],
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased scroll-smooth`}
    >
      <head>
        <meta charSet="utf-8" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="min-h-full flex flex-col bg-gray-50">
        <AuthProvider>
          <main className="flex-1 w-full">
            {/* Top navbar shown on public pages before login */}
            <TopNavHost />
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
