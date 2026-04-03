"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { EzvizCameraProps } from "@/lib/type";
import * as tf from "@tensorflow/tfjs";
import * as cocossd from "@tensorflow-models/coco-ssd";
import { captureSnapshotAction } from "@/lib/camera/cameraGetToken";

interface ExtendedEzvizProps extends EzvizCameraProps {
  isAiEnabled?: boolean;
  isModalOpen?: boolean;
  onToggleModal?: () => void;
}

export default function EzvizCamera({
  cameraId,
  accessToken,
  ezopenUrl,
  areaDomain = "https://open.ezviz.com",
  isAiEnabled = false,
  isModalOpen = false,
  onToggleModal,
}: ExtendedEzvizProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [PlayerConstructor, setPlayerConstructor] = useState<any>(null);
  const [personCount, setPersonCount] = useState<number>(0);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(true);
  const [aiDebugMsg, setAiDebugMsg] = useState<string>("⏳ เตรียมระบบ AI...");
  const [isZoomed, setIsZoomed] = useState<boolean>(false);

  const playerRef = useRef<any>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const snapshotCanvasRef = useRef<HTMLCanvasElement>(null);
  const aiModelRef = useRef<cocossd.ObjectDetection | null>(null);

  const [containerId] = useState(`ez-video-${cameraId}`);
  const deviceSerial =
    ezopenUrl.match(/open\.ezviz\.com\/([a-zA-Z0-9]+)\//)?.[1] || "";

  // 1. โหลดไลบรารีกล้อง
  useEffect(() => {
    let isMounted = true;
    const loadLib = async () => {
      try {
        const EZUIKit = await import("ezuikit-js");
        const Constructor =
          EZUIKit.EZUIKitPlayer ||
          EZUIKit.default?.EZUIKitPlayer ||
          EZUIKit.default;
        if (isMounted && Constructor) setPlayerConstructor(() => Constructor);
      } catch (err) {}
    };
    loadLib();
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. โหลด AI Model
  useEffect(() => {
    const loadAi = async () => {
      try {
        await tf.ready();
        const model = await cocossd.load({ base: "mobilenet_v2" });
        aiModelRef.current = model;
        setIsAiLoading(false);
        setAiDebugMsg("✅ AI พร้อมทำงาน");
      } catch (e) {
        setAiDebugMsg("❌ โหลด AI ไม่สำเร็จ");
      }
    };
    loadAi();
  }, []);

  // 🌟 3. ฟังก์ชัน AI สแกนภาพ (ที่ผมเผลอลบไปรอบที่แล้ว เอากลับมาแล้วครับ!)
  const scanSnapshot = useCallback(async () => {
    if (
      !aiModelRef.current ||
      !deviceSerial ||
      !snapshotCanvasRef.current ||
      !isAiEnabled
    )
      return;

    try {
      setAiDebugMsg("📸 กำลังถ่ายภาพ...");
      const result = await captureSnapshotAction(accessToken, deviceSerial);

      if (result.success && result.imageUrl) {
        setAiDebugMsg("🔍 กำลังวิเคราะห์...");
        const img = new Image();
        img.src = result.imageUrl;
        img.onload = async () => {
          const pred = await aiModelRef.current!.detect(img);
          const people = pred.filter(
            (p) => p.class === "person" && p.score > 0.15,
          );
          setPersonCount(people.length);

          // วาดกรอบสีเขียวลง Canvas
          const canvas = snapshotCanvasRef.current;
          if (canvas) {
            const ctx = canvas.getContext("2d");
            canvas.width = img.width;
            canvas.height = img.height;
            if (ctx) {
              ctx.drawImage(img, 0, 0);
              people.forEach((p) => {
                const [x, y, w, h] = p.bbox;
                ctx.strokeStyle = "#22C55E";
                ctx.lineWidth = 6;
                ctx.strokeRect(x, y, w, h);
              });
            }
          }
          setAiDebugMsg(`✅ เจอคน ${people.length} คน`);
        };
      }
    } catch (e) {
      setAiDebugMsg("❌ ดึงภาพล้มเหลว");
    }
  }, [accessToken, deviceSerial, isAiEnabled]);

  // 🌟 4. สั่งรัน AI ทุกๆ 15 วินาที
  useEffect(() => {
    if (isAiEnabled && !isAiLoading) {
      scanSnapshot(); // รันทันทีที่เปิด AI
      const interval = setInterval(scanSnapshot, 15000);
      return () => clearInterval(interval);
    } else if (!isAiEnabled) {
      setPersonCount(0);
      setAiDebugMsg("⏸️ AI หยุดทำงาน");
      const canvas = snapshotCanvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        ctx?.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, [isAiEnabled, isAiLoading, scanSnapshot]);

  // 5. สร้างกล้อง EZVIZ
  const initPlayer = useCallback(() => {
    if (!PlayerConstructor || !ezopenUrl || !accessToken) return;

    if (playerRef.current) {
      try {
        playerRef.current.stop();
      } catch (e) {}
    }

    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = "";

    try {
      setIsLoading(true);
      playerRef.current = new PlayerConstructor({
        id: containerId,
        url: ezopenUrl.trim(),
        accessToken: accessToken.trim(),
        template: "simple",
        width: 800,
        height: 450,
        env: { domain: areaDomain },
        handleSuccess: () => setIsLoading(false),
        handleError: () => setIsLoading(false),
      });
    } catch (error) {
      setIsLoading(false);
    }
  }, [PlayerConstructor, ezopenUrl, accessToken, areaDomain, containerId]);

  useEffect(() => {
    if (PlayerConstructor) {
      const timer = setTimeout(() => {
        initPlayer();
      }, 300);
      return () => {
        clearTimeout(timer);
        if (playerRef.current) {
          try {
            playerRef.current.stop();
          } catch (e) {}
        }
      };
    }
  }, [PlayerConstructor, initPlayer]);

  return (
    <div
      ref={wrapperRef}
      className="w-full h-full relative bg-black overflow-hidden flex items-center justify-center"
    >
      {/* CSS ทะลวงเกราะ */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            #${containerId} { width: 100% !important; height: 100% !important; display: flex !important; align-items: center !important; justify-content: center !important; }
            #${containerId} > div { width: 100% !important; height: 100% !important; }
            #${containerId} video, #${containerId} iframe { width: 100% !important; height: 100% !important; object-fit: contain !important; background: black; }
      `,
        }}
      />

      {isLoading && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-zinc-950">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-[10px] text-zinc-400 font-mono animate-pulse uppercase tracking-widest">
            Connecting...
          </p>
        </div>
      )}

      {/* พื้นที่สำหรับกล้อง */}
      <div id={containerId} className="w-full h-full" />

      {/* ปุ่มกดสลับ Fullscreen */}
      <div className="absolute bottom-6 left-6 z-[100] flex gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleModal?.();
          }}
          className="px-5 py-2.5 bg-black/50 hover:bg-primary border border-white/20 text-white rounded-xl text-xs font-bold transition-all active:scale-95 backdrop-blur-md"
        >
          {isModalOpen ? "✕ ย่อหน้าจอ" : "⛶ ขยายเต็มจอ"}
        </button>
      </div>

      {/* สถานะ AI (ด้านบน) */}
      {!isAiLoading && isAiEnabled && (
        <div className="absolute top-6 left-6 flex items-center gap-2 bg-black/60 backdrop-blur-md border border-white/10 px-4 py-2 rounded-xl z-[70]">
          <div className="w-2 h-2 rounded-full bg-success animate-ping"></div>
          <span className="text-white text-xs font-bold font-mono tracking-tight">
            AI WORKERS: {personCount}
          </span>
        </div>
      )}

      {/* ข้อความ Debug (มุมบนขวา) */}
      <div className="absolute top-6 right-6 text-white text-[9px] font-mono bg-black/50 px-2 py-1 rounded z-[70]">
        {aiDebugMsg}
      </div>

      {/* หน้าต่างสแกน AI (มุมขวาล่าง) */}
      <div
        onClick={() => !isZoomed && setIsZoomed(true)}
        className={`absolute transition-all duration-300 overflow-hidden shadow-2xl z-[85] border-2 border-primary/50 rounded-lg cursor-pointer
          ${isAiEnabled && !isAiLoading ? "opacity-100" : "opacity-0 pointer-events-none"}
          ${isZoomed ? "inset-4 md:inset-10 bg-black" : isModalOpen ? "bottom-6 right-6 w-64 aspect-video" : "bottom-6 right-6 w-32 aspect-video"}
        `}
      >
        {isZoomed && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsZoomed(false);
            }}
            className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded z-[100] text-[10px] font-bold"
          >
            ✕ ปิดกรอบ
          </button>
        )}
        <canvas
          ref={snapshotCanvasRef}
          className="w-full h-full object-contain bg-black/50"
        />
      </div>
    </div>
  );
}
