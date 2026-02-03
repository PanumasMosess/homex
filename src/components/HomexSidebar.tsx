"use client";

import { Home, Settings, Users, Box, LogOut, X } from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { SidebarProps } from "@/lib/type";
import { Tooltip } from "@heroui/tooltip";
import { Button } from "@heroui/button";
import Image from "next/image";
import { menuItems } from "@/lib/setting_data";

export const HomexSidebar = ({
  isOpen,
  isCollapsed,
  setIsOpen,
}: SidebarProps) => {
  const pathname = usePathname();

  const sidebarClasses = `
    fixed z-50 h-screen bg-background/90 backdrop-blur-xl border-r-small border-default-100 
    transition-all duration-300 ease-in-out shadow-xl
    ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"} 
    ${isCollapsed ? "md:w-[80px]" : "md:w-[280px]"} 
    w-[280px] flex flex-col rounded-r-3xl
  `;

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity duration-300 md:hidden
        ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={() => setIsOpen(false)}
      />

      <aside className={sidebarClasses}>
        <div
          className={`h-20 flex items-center ${isCollapsed ? "justify-center" : "px-20 justify-between"}`}
        >
          {isCollapsed ? (
            <Image
              src="/logo.png"
              alt="HOMEX Logo"
              width={40}
              height={40}
              className="rounded-full object-cover dark:invert font-sans"
            />
          ) : (
            <div className="flex items-center gap-3">
              <Image
                src="/logo.png"
                alt="HOMEX Logo"
                width={32}
                height={32}
                className="rounded-full object-cover dark:invert "
              />
              <span className="text-xl font-bold bg-gradient-to-tr from-slate-200 to-slate-500 text-transparent bg-clip-text tracking-wide">
                HOMEX
              </span>
            </div>
          )}

          <Button
            isIconOnly
            variant="light"
            radius="full"
            className="md:hidden text-default-400"
            onPress={() => setIsOpen(false)}
          >
            <X size={22} />
          </Button>
        </div>

        <div className="flex flex-col gap-2 p-4 flex-1 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = pathname === item.path;

            const LinkContent = (
              <Link
                href={item.path}
                className={`
                  flex items-center gap-4 p-3.5 transition-all duration-300 group relative overflow-hidden
                  rounded-full
                  ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/30"
                      : "text-default-500 hover:bg-default-100 hover:text-foreground"
                  }
                  ${isCollapsed ? "justify-center aspect-square p-0 w-12 h-12 mx-auto" : ""}
                `}
              >
                <item.icon
                  size={isCollapsed ? 22 : 20}
                  strokeWidth={isActive ? 2.5 : 2}
                  className="transition-transform group-hover:scale-110 z-10"
                />
                {!isCollapsed && (
                  <span className="text-sm font-medium z-10">{item.name}</span>
                )}
              </Link>
            );

            return isCollapsed ? (
              <Tooltip
                key={item.path}
                content={item.name}
                placement="right"
                color="primary"
                offset={10}
              >
                <div className="w-full flex justify-center">{LinkContent}</div>
              </Tooltip>
            ) : (
              <div key={item.path}>{LinkContent}</div>
            );
          })}
        </div>

        <div
          className={`flex items-center w-full pb-6 ${isCollapsed ? "justify-center" : "px-6"}`}
        >
          {isCollapsed ? (
            <Tooltip content="Logout" placement="right" color="danger">
              <Button
                as={Link}
                href="/"
                isIconOnly
                variant="flat"
                color="danger"
                radius="full"
                className="w-9 h-9 min-w-9"
              >
                <LogOut size={16} />
              </Button>
            </Tooltip>
          ) : (
            <Button
              as={Link}
              href="/"
              variant="flat"
              color="danger"
              radius="full"
              className="w-full justify-center gap-2 h-8"
              startContent={<LogOut size={16} />}
            >
              <span className="font-medium text-xs">Logout</span>
            </Button>
          )}
        </div>
      </aside>
    </>
  );
};
