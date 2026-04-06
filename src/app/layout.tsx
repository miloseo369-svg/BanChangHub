import type { Metadata } from "next";
import "./globals.css";
import { organizationJsonLd, websiteJsonLd } from "@/lib/jsonld";

export const metadata: Metadata = {
  title: {
    default: "BanChangHub - ศูนย์รวมบ้านมือหนึ่งและงานสร้างคุณภาพ แห่งอีสานตอนบน",
    template: "%s | BanChangHub",
  },
  description:
    "บ้านช่างฮับ แพลตฟอร์มอสังหาริมทรัพย์และรับเหมาก่อสร้างพรีเมียม อีสานตอนบน บ้านอุดรธานี เซ้งร้านหนองคาย รับเหมาอีสานบน",
  keywords: ["บ้านอุดรธานี", "อสังหาริมทรัพย์อีสาน", "รับเหมาก่อสร้าง", "เซ้งร้าน", "หนองคาย", "ขอนแก่น", "BanChangHub"],
  openGraph: {
    type: "website",
    locale: "th_TH",
    siteName: "BanChangHub",
    title: "BanChangHub - ศูนย์รวมบ้านมือหนึ่งและงานสร้างคุณภาพ แห่งอีสานตอนบน",
    description: "แพลตฟอร์มอสังหาริมทรัพย์และรับเหมาก่อสร้างครบวงจร สำหรับอีสานตอนบน",
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: process.env.NEXT_PUBLIC_APP_URL ?? "https://banchanghub.com",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className="h-full antialiased">
      <head>
        {/* Thai font preload — ลด LCP */}
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
        />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          as="style"
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@400;500;600;700;800;900&display=swap"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@400;500;600;700;800;900&display=swap"
        />

        {/* Google Search Console — ใส่ค่าจริงใน .env */}
        {process.env.NEXT_PUBLIC_GSC_VERIFICATION && (
          <meta name="google-site-verification" content={process.env.NEXT_PUBLIC_GSC_VERIFICATION} />
        )}

        {/* PWA */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#1e3a5f" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="BanChangHub" />

        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd()) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd()) }}
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
