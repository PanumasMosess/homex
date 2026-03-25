"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { EzvizCameraProps } from "@/lib/type";

export default function EzvizCamera({
  accessToken,
  ezopenUrl,
  areaDomain = "https://open.ezviz.com",
}: EzvizCameraProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [PlayerConstructor, setPlayerConstructor] = useState<any>(null);
  const [threadMode, setThreadMode] = useState<string>("Detecting Mode...");
  const [playerError, setPlayerError] = useState<string>("");

  const playerRef = useRef<any>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // ใช้ ID แบบสุ่มเพื่อป้องกัน ID ซ้ำกรณีเปิดหลายกล้องพร้อมกัน
  const containerId = useRef(
    `ezviz-player-${Math.random().toString(36).substring(2, 9)}`,
  );

  // 1. โหลด Library ezuikit-js แบบ Dynamic
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
        console.warn("❌ Failed to load ezuikit-js", err);
        setPlayerError("ไม่สามารถโหลดไลบรารีเครื่องเล่นวิดีโอได้");
      }
    };

    if (typeof window !== "undefined") {
      loadLibrary();
    }
  }, []);

  // 2. ฟังก์ชันหลักในการเริ่มเล่นวิดีโอ
  const initPlayer = useCallback(() => {
    if (!PlayerConstructor || !ezopenUrl || !accessToken) return;

    // 🌟 เช็คว่า Element ปรากฏบน DOM จริงๆ หรือยัง (แก้บั๊ก setShapeType)
    const container = document.getElementById(containerId.current);
    if (!container) {
      console.warn("⏳ DOM Container not ready, retrying in 100ms...");
      setTimeout(initPlayer, 100);
      return;
    }

    const isMultiThread = typeof SharedArrayBuffer !== "undefined";
    setThreadMode(isMultiThread ? "🚀 Multi-threaded" : "🐢 Single-threaded");

    try {
      // ทำลาย Player เก่าก่อนสร้างใหม่
      if (playerRef.current) {
        try {
          if (typeof playerRef.current.destroy === "function")
            playerRef.current.destroy();
          else if (typeof playerRef.current.stop === "function")
            playerRef.current.stop();
        } catch (e) {
          /* ignore cleanup error */
        }
        playerRef.current = null;
      }

      const currentWidth = wrapperRef.current?.clientWidth || 800;
      const currentHeight = wrapperRef.current?.clientHeight || 450;

      setPlayerError("");
      setIsLoading(true);

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
          console.warn("⚠️ SDK Error:", err);
          let msg = "เกิดข้อผิดพลาดในการเล่นวิดีโอ";

          if (err && typeof err === "object") {
            const rawMsg = String(err.msg || "");
            if (rawMsg.toLowerCase().includes("illegal parameter ezopen")) {
              msg = "รูปแบบหมายเลขซีเรียล (SN) หรือ URL ไม่ถูกต้อง";
            } else if (Object.keys(err).length === 0) {
              msg =
                "เบราว์เซอร์ไม่รองรับวิดีโอ (แนะนำให้ปรับกล้องเป็น H.264 ในแอป)";
            } else if (err.msg) {
              msg = String(err.msg);
            }
          } else if (typeof err === "string") {
            msg = err;
          }

          setPlayerError(msg);
          setIsLoading(false);
        },
        handleSuccess: () => {
          console.log("✅ Play Success!");
          setPlayerError("");
          setIsLoading(false);
        },
      });

      setTimeout(() => setIsLoading(false), 5000);
    } catch (error: any) {
      console.warn("❌ Init Error:", error);
      setPlayerError(error?.message || "เกิดข้อผิดพลาดในการสร้างตัวเล่น");
      setIsLoading(false);
    }
  }, [PlayerConstructor, ezopenUrl, accessToken, areaDomain]);

  useEffect(() => {
    if (PlayerConstructor && typeof window !== "undefined") {
      const timer = setTimeout(initPlayer, 500);
      return () => clearTimeout(timer);
    }
  }, [PlayerConstructor, initPlayer]);

  useEffect(() => {
    const handleForceStop = () => {
      // console.log("🛑 ได้รับคำสั่งเปลี่ยน Tab: บังคับหยุดกล้องเฉพาะตัวนี้!");

      const player = playerRef.current;
      if (player) {
        try {
          if (typeof player.closeSound === "function") player.closeSound();
        } catch (e) {}
        try {
          if (typeof player.stop === "function") player.stop();
        } catch (e) {}
      }

      try {
        if (wrapperRef.current) {
          wrapperRef.current
            .querySelectorAll("audio, video")
            .forEach((media: any) => {
              media.pause();
              media.muted = true;
              media.removeAttribute("src");
              media.load();
            });
        }
      } catch (e) {}
    };

    window.addEventListener("force-stop-camera", handleForceStop);
    return () => {
      window.removeEventListener("force-stop-camera", handleForceStop);
      handleForceStop();
    };
  }, []);

  return (
    <div
      ref={wrapperRef}
      className="w-full flex flex-col bg-black rounded-xl overflow-hidden shadow-2xl relative border border-white/5"
    >
      <div className="aspect-video relative w-full flex justify-center items-center bg-zinc-950">
        {isLoading && !playerError && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-zinc-900/90 text-white backdrop-blur-sm">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-zinc-700 border-t-primary mb-3"></div>
            <span className="text-[10px] text-zinc-400 font-mono tracking-[0.2em] uppercase">
              Connecting
            </span>
          </div>
        )}

        {playerError && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/90 p-4 text-center animate-in fade-in duration-300">
            <div className="flex flex-col items-center max-w-[85%]">
              <div className="w-10 h-10 bg-red-500/10 rounded-full flex items-center justify-center mb-3 border border-red-500/20">
                <span className="text-red-500 text-xl">⚠️</span>
              </div>
              <p className="text-red-500 text-[11px] font-bold leading-relaxed">
                {String(playerError)}
              </p>
              <button
                onClick={() => {
                  setPlayerError("");
                  initPlayer();
                }}
                className="mt-5 px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white text-[10px] font-bold rounded-full transition-all border border-white/10"
              >
                ลองเชื่อมต่ออีกครั้ง
              </button>
            </div>
          </div>
        )}
        <div
          className={`w-full h-full transition-opacity duration-500 ${playerError ? "opacity-0" : "opacity-100"}`}
          suppressHydrationWarning
        >
          <div
            id={containerId.current}
            key={containerId.current}
            className="w-full h-full [&>div]:!w-full [&>div]:!h-full [&_canvas]:!w-full [&_canvas]:!h-full [&_video]:!w-full [&_video]:!h-full [&_video]:!object-contain"
          />
        </div>
      </div>
      <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/60 text-white text-[9px] font-mono rounded border border-white/10 backdrop-blur-md z-30 pointer-events-none uppercase tracking-tighter">
        {threadMode}
      </div>
    </div>
  );
}
