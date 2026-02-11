import type { Metadata } from "next";
import "../globals.css";
import MainLayoutClient from "./MainLayoutClient";
import IdleTimeoutHandler from "@/components/IdleTimeoutHandler";

export const metadata: Metadata = {
  title: {
    template: "HomeX | %s",
    default: "Homex",
  },
  description: "Construction Management System",
  icons: {
    icon: "/logo.png",
  },
};

export default async function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <MainLayoutClient>
      {children}
      <IdleTimeoutHandler />
    </MainLayoutClient>
  );
}
