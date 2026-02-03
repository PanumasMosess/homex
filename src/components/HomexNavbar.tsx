"use client";
import { Navbar, NavbarContent, NavbarItem } from "@heroui/navbar";
import { Button } from "@heroui/button";
import { Menu, ChevronLeft, ChevronRight, Bell, Search } from "lucide-react";
import { ThemeSwitcher } from "./ThemeSwitcher";
import { NavbarProps } from "@/lib/type";
import { Avatar } from "@heroui/avatar";
import { Input } from "@heroui/input";
import { linkUserTemp } from "@/lib/setting_data";

export const HomexNavbar = ({
  onMenuClick,
  onToggleCollapse,
  isCollapsed,
}: NavbarProps) => {
  return (
    <Navbar
      isBordered
      maxWidth="full"
      className="bg-background/70 backdrop-blur-xl border-b-small border-default-100 sticky top-0 z-30"
      classNames={{
        wrapper: "px-4 sm:px-6 h-16",
      }}
    >
      <NavbarContent justify="start" className="gap-2">
        <Button
          isIconOnly
          variant="light"
          radius="full"
          className="md:hidden text-default-500"
          onPress={onMenuClick}
        >
          <Menu size={24} />
        </Button>

        <Button
          isIconOnly
          variant="light"
          radius="full"
          className="hidden md:flex text-default-500 hover:text-foreground"
          onPress={onToggleCollapse}
        >
          {isCollapsed ? <ChevronRight size={22} /> : <ChevronLeft size={22} />}
        </Button>
        <Input
          id="search-bar"
          classNames={{
            base: "max-w-full sm:max-w-[12rem] h-10 ml-2 hidden sm:flex",
            mainWrapper: "h-full",
            input: "text-small",
            inputWrapper:
              "h-full font-normal text-default-500 bg-default-400/20 dark:bg-default-500/20 rounded-full",
          }}
          placeholder="Type to search..."
          size="sm"
          startContent={<Search size={18} />}
          type="search"
        />
      </NavbarContent>

      <NavbarContent justify="end" className="gap-3">
        <NavbarItem className="hidden sm:flex">
          <Button
            isIconOnly
            radius="full"
            variant="light"
            className="text-default-500"
          >
            <Bell size={20} />
          </Button>
        </NavbarItem>

        <NavbarItem>
          <ThemeSwitcher />
        </NavbarItem>

        <NavbarItem>
          <Avatar
            isBordered
            as="button"
            className="transition-transform hover:scale-105 ring-2 ring-offset-2 ring-primary/30"       
            size="sm"
            src={linkUserTemp[0].path}
          />
        </NavbarItem>
      </NavbarContent>
    </Navbar>
  );
};
