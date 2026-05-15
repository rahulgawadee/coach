import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import TopNavHost from '@/components/layout/TopNavHost';
import ChatWidget from '@/components/ui/ChatWidget';

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata = {
  title: "Coach - Mentorship & Professional Development Platform",
  description: "Connect with mentors, develop skills, and advance your career.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} min-h-full flex flex-col antialiased transition-colors duration-300`}>
        <ThemeProvider>
          <AuthProvider>
            <main className="flex-1 w-full">
              <TopNavHost />
              {children}
            </main>
            <ChatWidget />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
