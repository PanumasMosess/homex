import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "../components/Providers/providers";
import {
  IBM_Plex_Sans_Thai,
  IBM_Plex_Sans_Thai_Looped,
} from "next/font/google";
import { ToastContainer } from "react-toastify";

const fontSans = IBM_Plex_Sans_Thai({
  subsets: ["thai", "latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "HomeX",
  description: "Construction Management System",
  icons: {
    icon: [
      {
        url: "/logo.png",
        href: "/logo.png",
      },
    ],
    apple: [
      {
        url: "/logo.png",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${fontSans.variable}  font-sans antialiased`}>
        <Providers>{children}</Providers>
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
          toastClassName="default-toast-body"
        />
      </body>
    </html>
  );
}
