"use client";

import { useIdleTimeout } from "@/lib/useIdleTimeout";

export default function IdleTimeoutHandler() {
  useIdleTimeout(3600000);
  return null;
}
