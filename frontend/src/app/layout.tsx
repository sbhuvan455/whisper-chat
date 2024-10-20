import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Navbar from '@/components/Navbar'
import {
  ClerkProvider,
} from '@clerk/nextjs'
import "./globals.css";
import { SocketProvider } from "@/context/socketProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <SocketProvider>
        <html lang="en">
          <body className={inter.className}>
            <Navbar />
            {children}
          </body>
        </html>
      </SocketProvider>
    </ClerkProvider>
  );
}
