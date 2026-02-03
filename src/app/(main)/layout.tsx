import type { Metadata } from "next";
import "../globals.css";
import MainLayoutClient from "./MainLayoutClient";

export const metadata: Metadata = {
  title: "Homex - Dashboard",
  description: "Construction Management System",
  icons: {
    icon: "/logo.png",
  },
};

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <MainLayoutClient>{children}</MainLayoutClient>;
}
