import { Box, Home, Settings, Users } from "lucide-react";

export const menuItems = [
  { name: "Dashboard", icon: Home, path: "/dashboard" },
  { name: "Projects", icon: Box, path: "/projects" },
  { name: "Customers", icon: Users, path: "/customers" },
  { name: "Settings", icon: Settings, path: "/settings" },
];

export const linkUserTemp = [{ name: "Profile", path: "/profile_temp.png" }];

export const getStatusProjectColor = (status: string) => {
  switch ((status ?? "").toUpperCase()) {
    case "DONE":
      return "success";
    case "IN_PROGRESS":
      return "primary";
    case "ON_HOLD":
      return "danger";
    case "PLANNING":
      return "warning";
    default:
      return "default";
  }
};

export const fmtDate = (d?: any) => {
  if (!d) return "-";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "-";
  return dt.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export const diffDaysInclusive = (from?: any, to?: any) => {
  if (!from || !to) return null;
  const a = new Date(from);
  const b = new Date(to);
  const a0 = new Date(a.getFullYear(), a.getMonth(), a.getDate());
  const b0 = new Date(b.getFullYear(), b.getMonth(), b.getDate());
  const ms = b0.getTime() - a0.getTime();
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  if (days < 0) return null;
  return days + 1; // ✅ รวมวันเริ่มด้วย
};

export const dayStart = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate());

export const daysDiff = (from: Date, to: Date) => {
  const ms = dayStart(to).getTime() - dayStart(from).getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
};

export const getDueInfo = (
  finishPlanned?: any,
  status?: string,
  progress?: number,
) => {
  // Completed condition
  if (status === "DONE" || (progress ?? 0) >= 100) {
    return { label: "Completed", tone: "success" as const };
  }

  if (!finishPlanned) {
    return { label: "No deadline", tone: "default" as const };
  }

  const today = new Date();
  const finish = new Date(finishPlanned);
  if (Number.isNaN(finish.getTime())) {
    return { label: "Invalid deadline", tone: "default" as const };
  }

  const diff = daysDiff(today, finish); 

  if (diff > 0)
    return { label: `Due in ${diff} days`, tone: "primary" as const };
  if (diff === 0) return { label: "Due today", tone: "warning" as const };
  return { label: `Overdue ${Math.abs(diff)} days`, tone: "danger" as const };
};

export const fmtMoney = (v?: any) => {
  if (v == null || v === "" || v === "-") return "-";
  const n = typeof v === "string" ? Number(v) : Number(v);
  if (Number.isNaN(n)) return String(v);
  return new Intl.NumberFormat("th-TH", { maximumFractionDigits: 2 }).format(n);
};
