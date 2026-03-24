"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { EzvizCameraProps } from "@/lib/type";

export default function EzvizCamera({
  accessToken,
  ezopenUrl,
}: EzvizCameraProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [PlayerConstructor, setPlayerConstructor] = useState<any>(null); // 🌟 เก็บ Constructor ไว้ใน State
  const playerRef = useRef<any>(null);

  const containerId = useRef(
    `ezviz-player-${Math.random().toString(36).substring(2, 9)}`,
  );

  // 1. 🌟 โหลด Library แบบ Dynamic และเจาะจงชั้นของ Constructor
  useEffect(() => {
    const loadLibrary = async () => {
      try {
        const EZUIKit = await import("ezuikit-js");

        // 🔍 เจาะหา Constructor: Turbopack มักจะซ้อน default ไว้
        // ลองไล่เช็คตามลำดับความน่าจะเป็น
        const Constructor =
          EZUIKit.EZUIKitPlayer ||
          EZUIKit.default?.EZUIKitPlayer ||
          EZUIKit.default ||
          EZUIKit;

        if (
          typeof Constructor === "function" ||
          (typeof Constructor === "object" && Constructor !== null)
        ) {
          setPlayerConstructor(() => Constructor);
        } else {
          console.error(
            "Could not find EZUIKitPlayer constructor in the module",
            EZUIKit,
          );
        }
      } catch (err) {
        console.error("Failed to load ezuikit-js", err);
      }
    };

    if (typeof window !== "undefined") {
      loadLibrary();
    }
  }, []);

  // 2. ฟังก์ชัน InitPlayer (เรียกใช้เมื่อ Constructor พร้อม)
  const initPlayer = useCallback(() => {
    if (!PlayerConstructor || !ezopenUrl || !accessToken) return;

    try {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }

      playerRef.current = new PlayerConstructor({
        id: containerId.current,
        url: ezopenUrl.trim(),
        accessToken: accessToken.trim(),
        template: "pcLive",
        width: 800,
        height: 450,
        language: "en",
        scaleMode: 1,
        env: { domain: "https://open.ezviz.com" },
        staticPath: "https://unpkg.com/ezuikit-js@7.7.2/ezuikit_static",
        handleError: (err: any) => console.error("❌ Error:", err),
        handleSuccess: () => console.log("✅ Play Success!"),
      });
    } catch (error) {
      console.error("Init Error:", error);
    }
  }, [PlayerConstructor, ezopenUrl, accessToken]);

  // 3. รัน Init เมื่อทุกอย่างพร้อม
  useEffect(() => {
    if (PlayerConstructor && typeof window !== "undefined") {
      const timer = setTimeout(() => initPlayer(), 300);
      return () => clearTimeout(timer);
    }
  }, [PlayerConstructor, initPlayer]);

  useEffect(() => {
    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, []);

  return (
    <div className="w-full flex flex-col bg-black rounded-xl overflow-hidden shadow-2xl relative">
      <div className="aspect-video relative w-full flex justify-center items-center">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-zinc-900 text-white">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-zinc-700 border-t-primary mb-3"></div>
            <span className="text-xs text-zinc-500">Loading Player...</span>
          </div>
        )}
        <div id={containerId.current} className="w-full h-full" />
      </div>
    </div>
  );
}
