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
          containerStyle={{
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
          toastOptions={{
            duration: 3000,
            style: {
              background: "rgba(13, 13, 13, 0.95)",
              color: "#F5F5F5",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(212,175,55,0.4)",
              borderRadius: "24px",
              padding: "20px 32px",
              fontWeight: 800,
              fontSize: "14px",
              textAlign: "center",
              letterSpacing: "0.02em",
              boxShadow: "0 20px 60px rgba(0,0,0,0.9), 0 0 40px rgba(212,175,55,0.2)",
              maxWidth: "400px",
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
