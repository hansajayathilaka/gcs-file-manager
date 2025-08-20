import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import NotificationContainer from "@/components/shared/NotificationContainer";

export const metadata: Metadata = {
  title: "GCS File Manager",
  description: "Manage your Google Cloud Storage buckets and files",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Runtime environment variables script */}
        <script src="/_next/static/runtime-env.js" async />
      </head>
      <body
        className="antialiased font-sans"
        suppressHydrationWarning={true}
      >
        <AuthProvider>
          <NotificationProvider>
            {children}
            <NotificationContainer />
          </NotificationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
