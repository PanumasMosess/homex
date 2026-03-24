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
  const playerRef = useRef<any>(null);

  const wrapperRef = useRef<HTMLDivElement>(null);

  const containerId = useRef(
    `ezviz-player-${Math.random().toString(36).substring(2, 9)}`,
  );

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

  const initPlayer = useCallback(() => {
    if (!PlayerConstructor || !ezopenUrl || !accessToken) return;

    const isMultiThread = typeof SharedArrayBuffer !== "undefined";
    const modeText = isMultiThread
      ? "🚀 Multi-threaded (ลื่นปื๊ด)"
      : "🐢 Single-threaded (ปกติ)";
    setThreadMode(modeText);

    try {
      if (playerRef.current) {
        if (typeof playerRef.current.destroy === "function") {
          playerRef.current.destroy();
        } else if (typeof playerRef.current.stop === "function") {
          playerRef.current.stop();
        }
        playerRef.current = null;
      }

      // const urlParts = ezopenUrl.replace("ezopen://", "").split("/");
      // const exactDomain = urlParts[0]; // จะได้ "isgpopen.ezvizlife.com"

      const currentWidth = wrapperRef.current?.clientWidth || 800;
      const currentHeight = wrapperRef.current?.clientHeight || 450;

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
          console.error("❌ Error:", err);
          setIsLoading(false);
        },
        handleSuccess: () => {
          console.log("✅ Play Success!");
          setIsLoading(false);
        },
      });

      setTimeout(() => setIsLoading(false), 3000);
    } catch (error) {
      console.error("Init Error:", error);
      setIsLoading(false);
    }
  }, [PlayerConstructor, ezopenUrl, accessToken]);

  useEffect(() => {
    if (PlayerConstructor && typeof window !== "undefined") {
      const timer = setTimeout(() => initPlayer(), 300);
      return () => clearTimeout(timer);
    }
  }, [PlayerConstructor, initPlayer]);

  useEffect(() => {
    const handleForceStop = () => {
      console.log(
        "🛑 ได้รับคำสั่งเปลี่ยน Tab: บังคับหยุดกล้องและปิดเสียงเดี๋ยวนี้!",
      );

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
        document.querySelectorAll("audio, video").forEach((media: any) => {
          media.pause();
          media.muted = true;
          media.removeAttribute("src");
          media.load();
        });
      } catch (e) {}
    };
    window.addEventListener("force-stop-camera", handleForceStop);
    return () =>
      window.removeEventListener("force-stop-camera", handleForceStop);
  }, []);

  return (
    <div
      ref={wrapperRef}
      className="w-full flex flex-col bg-black rounded-xl overflow-hidden shadow-2xl relative"
    >
      <div className="aspect-video relative w-full flex justify-center items-center">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-zinc-900 text-white">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-zinc-700 border-t-primary mb-3"></div>
            <span className="text-xs text-zinc-500">Loading Player...</span>
          </div>
        )}
        <div
          id={containerId.current}
          className="w-full h-full [&>div]:!w-full [&>div]:!h-full [&_canvas]:!w-full [&_canvas]:!h-full [&_video]:!w-full [&_video]:!h-full [&_video]:!object-contain"
        />
      </div>

      {/* 🌟 แสดงสถานะโหมดไว้มุมล่าง (เอาออกได้ถ้าไม่ต้องการ) */}
      <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 text-white text-[10px] rounded backdrop-blur-sm z-20 pointer-events-none">
        {threadMode}
      </div>
    </div>
  );
}
