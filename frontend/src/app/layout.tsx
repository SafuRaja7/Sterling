import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import Header from "@/components/layout/Header";
import SupportWidget from "@/components/chat/SupportWidget";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Sterling Shopify Market | Global Hub",
  description: "A luxury VIP e-commerce fintech platform.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#0D0D0D] text-[#F5F5F5] antialiased overflow-x-hidden">
        <Header />
        {children}
        <Suspense fallback={null}>
          <SupportWidget />
        </Suspense>
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: "#1A1A1A",
              color: "#F5F5F5",
              border: "1px solid rgba(212,175,55,0.3)",
              borderRadius: "12px",
              fontWeight: 700,
              fontSize: "12px",
              letterSpacing: "0.05em",
              boxShadow: "0 8px 32px rgba(0,0,0,0.8), 0 0 20px rgba(212,175,55,0.1)",
            },
            success: {
              iconTheme: { primary: "#D4AF37", secondary: "#0D0D0D" },
            },
            error: {
              iconTheme: { primary: "#E53E3E", secondary: "#F5F5F5" },
            },
          }}
        />
      </body>
    </html>
  );
}
