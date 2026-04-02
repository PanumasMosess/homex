"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { EzvizCameraProps } from "@/lib/type";

export default function EzvizCamera({
  cameraId,
  accessToken,
  ezopenUrl,
  areaDomain = "https://open.ezviz.com",
}: EzvizCameraProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [PlayerConstructor, setPlayerConstructor] = useState<any>(null);
  const [threadMode, setThreadMode] = useState<string>("Loading Mode...");
  const [playerError, setPlayerError] = useState<string>("");

  const playerRef = useRef<any>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const containerId = useRef(
    `ezviz-player-${Math.random().toString(36).substring(2, 9)}`,
  );

  // 1. โหลด Library EZUIKit
  useEffect(() => {
    const loadLibrary = async () => {
      try {
        const EZUIKit = await import("ezuikit-js");
        const Constructor =
          EZUIKit.EZUIKitPlayer ||
          EZUIKit.default?.EZUIKitPlayer ||
          EZUIKit.default ||
          EZUIKit;
        if (
          typeof Constructor === "function" ||
          typeof Constructor === "object"
        ) {
          setPlayerConstructor(() => Constructor);
        }
      } catch (err) {
        setPlayerError("ไม่สามารถโหลดไลบรารีเครื่องเล่นวิดีโอได้");
      }
    };
    if (typeof window !== "undefined") loadLibrary();
  }, []);

  // 2. ฟังก์ชันเริ่มเล่นวิดีโอ
  const initPlayer = useCallback(() => {
    if (!PlayerConstructor || !ezopenUrl || !accessToken) return;

    const container = document.getElementById(containerId.current);
    if (!container) {
      setTimeout(initPlayer, 100);
      return;
    }

    const isMultiThread = typeof SharedArrayBuffer !== "undefined";
    setThreadMode(isMultiThread ? "🚀 Multi-threaded" : "🐢 Single-threaded");

    try {
      // เคลียร์ Player เก่าทิ้งก่อนสร้างใหม่
      if (playerRef.current) {
        try {
          if (typeof playerRef.current.destroy === "function")
            playerRef.current.destroy();
          else if (typeof playerRef.current.stop === "function")
            playerRef.current.stop();
        } catch (e) {}
        playerRef.current = null;
      }

      const currentWidth = wrapperRef.current?.clientWidth || 800;
      const currentHeight = wrapperRef.current?.clientHeight || 450;

      setPlayerError("");
      setIsLoading(true);

      // สร้าง Player ตัวใหม่
      playerRef.current = new PlayerConstructor({
        id: containerId.current,
        url: ezopenUrl.trim(),
        accessToken: accessToken.trim(),
        template: "simple",
        width: currentWidth,
        height: currentHeight,
        language: "en",
        scaleMode: 1,
        env: { domain: areaDomain },
        staticPath: "/ezuikit_static/v65",
        handleError: (err: any) => {
          setPlayerError("เกิดข้อผิดพลาดในการดึงสตรีมวิดีโอ");
          setIsLoading(false);
        },
        handleSuccess: () => {
          console.log("✅ Camera Play Success!");
          setPlayerError("");
          setIsLoading(false);
        },
      });

      // ดักจับ Timeout กรณีเน็ตช้ามากๆ หรือโหลดไม่ขึ้น
      setTimeout(() => setIsLoading(false), 5000);
    } catch (error: any) {
      setPlayerError(error?.message || "เกิดข้อผิดพลาดในการสร้างตัวเล่น");
      setIsLoading(false);
    }
  }, [PlayerConstructor, ezopenUrl, accessToken, areaDomain]);

  // 3. ควบคุมการ Mount/Unmount ของ Component
  useEffect(() => {
    if (PlayerConstructor && typeof window !== "undefined") {
      const timer = setTimeout(initPlayer, 500);
      return () => clearTimeout(timer);
    }
  }, [PlayerConstructor, initPlayer]);

  useEffect(() => {
    return () => {
      // สั่งหยุดวิดีโอตอนผู้ใช้เปลี่ยนหน้าเว็บ
      if (playerRef.current) {
        try {
          if (typeof playerRef.current.stop === "function") {
            playerRef.current.stop();
          }
        } catch (e) {}
      }
    };
  }, []);

  return (
    <div
      ref={wrapperRef}
      className="w-full flex flex-col bg-black rounded-xl overflow-hidden shadow-2xl relative border border-white/5"
    >
      <div className="aspect-video relative w-full flex justify-center items-center bg-zinc-950 overflow-hidden">
        
        {/* Loading Overlay */}
        {isLoading && !playerError && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-zinc-900/90 text-white backdrop-blur-sm">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-zinc-700 border-t-primary mb-3"></div>
            <span className="text-[10px] text-zinc-400 font-mono tracking-[0.2em] uppercase">
              Connecting Camera
            </span>
          </div>
        )}

        {/* Video Player Container */}
        <div
          className={`relative w-full h-full overflow-hidden transition-opacity duration-500 ${playerError ? "opacity-0" : "opacity-100"}`}
        >
          <div
            id={containerId.current}
            key={containerId.current}
            className="absolute inset-0 w-full h-full overflow-hidden [&_*]:!overflow-hidden [&>div]:!w-full [&>div]:!h-full [&_video]:!w-full [&_video]:!h-full [&_video]:!object-contain"
          />
        </div>

        {/* Error Overlay (ถ้ามี) */}
        {playerError && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-zinc-950 text-white p-4 text-center">
            <div className="text-red-500 mb-2">⚠️</div>
            <p className="text-xs text-red-400">{playerError}</p>
            <button 
              onClick={initPlayer}
              className="mt-4 px-4 py-1 text-xs border border-white/20 rounded hover:bg-white/10 transition"
            >
              Retry
            </button>
          </div>
        )}

      </div>

      {/* Info Badge (บอกโหมดการเล่น) */}
      <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/60 text-white text-[9px] font-mono rounded border border-white/10 backdrop-blur-md z-30 pointer-events-none uppercase tracking-tighter">
        {threadMode}
      </div>
    </div>
  );
}