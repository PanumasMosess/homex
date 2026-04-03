"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { EzvizCameraProps } from "@/lib/type";

// 🌟 Import TensorFlow และ Action ของคุณ
import * as tf from "@tensorflow/tfjs";
import * as cocossd from "@tensorflow-models/coco-ssd";
import { savePersonCountAction } from "@/lib/actions/actionCamera";
import { captureSnapshotAction } from "@/lib/camera/cameraGetToken";

export default function EzvizCamera({
  cameraId,
  accessToken,
  ezopenUrl,
  areaDomain = "https://open.ezviz.com",
}: EzvizCameraProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [PlayerConstructor, setPlayerConstructor] = useState<any>(null);
  const [playerError, setPlayerError] = useState<string>("");

  const [personCount, setPersonCount] = useState<number>(0);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(true);
  const [aiDebugMsg, setAiDebugMsg] = useState<string>("⏳ กำลังรอระบบ...");

  const playerRef = useRef<any>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const snapshotCanvasRef = useRef<HTMLCanvasElement>(null);

  const aiModelRef = useRef<cocossd.ObjectDetection | null>(null);
  const maxCountRef = useRef<number>(0);

  const containerId = useRef(
    `ezviz-player-${Math.random().toString(36).substring(2, 9)}`,
  );

  // ดึง Serial Number จาก ezopenUrl
  const deviceSerial =
    ezopenUrl.match(/open\.ezviz\.com\/([a-zA-Z0-9]+)\//)?.[1] || "";

  // 1. โหลดไลบรารีกล้อง (EZUIKit)
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
        setPlayerError("โหลดไลบรารีกล้องไม่สำเร็จ");
      }
    };
    if (typeof window !== "undefined") loadLibrary();
  }, []);

  // 2. โหลด TensorFlow (รุ่นมาตรฐานเพื่อความแม่นยำระยะไกล)
  useEffect(() => {
    const loadAiModel = async () => {
      try {
        setAiDebugMsg("⏳ กำลังเตรียมสมองกล (TF.js)...");
        await tf.ready();
        await tf.setBackend("webgl");
        const model = await cocossd.load({ base: "mobilenet_v2" });
        aiModelRef.current = model;
        setIsAiLoading(false);
        setAiDebugMsg("✅ AI พร้อมทำงาน (โหมด Action Snapshot)");
      } catch (error: any) {
        setIsAiLoading(false);
        setAiDebugMsg(`❌ โหลด AI พัง: ${error.message}`);
      }
    };
    loadAiModel();
  }, []);

  // 🌟 3. ฟังก์ชันสแกนภาพ HD ผ่าน Server Action
  const scanSnapshot = useCallback(async () => {
    if (!aiModelRef.current || !deviceSerial || !snapshotCanvasRef.current)
      return;

    try {
      setAiDebugMsg("📸 สั่งกล้องถ่ายรูปผ่าน Server Action...");

      // เรียกใช้ Server Action แทน API Route
      const result = await captureSnapshotAction(accessToken, deviceSerial);

      if (!result.success || !result.imageUrl) {
        throw new Error(result.error || "Action คืนค่าไม่สำเร็จ");
      }

      setAiDebugMsg("🔍 AI กำลังวิเคราะห์ภาพความละเอียดสูง...");

      const img = new Image();
      img.src = result.imageUrl;

      img.onload = async () => {
        // สแกนหาคน (Threshold 0.3 เพื่อระยะไกล)
        const predictions = await aiModelRef.current!.detect(img);
        const people = predictions.filter(
          (p) => p.class === "person" && p.score > 0.3,
        );

        const currentCount = people.length;
        setPersonCount(currentCount);
        if (currentCount > maxCountRef.current)
          maxCountRef.current = currentCount;

        // วาดรูปพร้อมกรอบลงจอมุมขวาล่าง
        const canvas = snapshotCanvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext("2d");
          canvas.width = img.width;
          canvas.height = img.height;
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            people.forEach((person) => {
              const [x, y, width, height] = person.bbox;
              ctx.strokeStyle = "#22C55E";
              ctx.lineWidth = 6;
              ctx.strokeRect(x, y, width, height);
              ctx.fillStyle = "#22C55E";
              ctx.font = "bold 35px Arial";
              ctx.fillText(
                `${Math.round(person.score * 100)}%`,
                x,
                y > 35 ? y - 10 : y + 40,
              );
            });
          }
        }
        setAiDebugMsg(`✅ เจอคนหน้างาน ${currentCount} คน`);
      };
    } catch (error: any) {
      setAiDebugMsg(`❌ ระบบติดขัด: ${error.message}`);
    }
  }, [accessToken, deviceSerial]);

  // ตั้งเวลาสแกนทุกๆ 10-15 วินาที (เพื่อให้ Server Action ไม่ทำงานหนักเกินไป)
  useEffect(() => {
    if (isAiLoading || !deviceSerial) return;
    scanSnapshot();
    const interval = setInterval(scanSnapshot, 15000);
    return () => clearInterval(interval);
  }, [isAiLoading, scanSnapshot, deviceSerial]);

  // บันทึกสถิติลง DB ทุก 5 นาที
  useEffect(() => {
    if (!cameraId) return;
    const intervalId = setInterval(
      async () => {
        if (maxCountRef.current > 0) {
          try {
            await savePersonCountAction(cameraId, maxCountRef.current);
            maxCountRef.current = 0;
          } catch (error) {}
        }
      },
      5 * 60 * 1000,
    );
    return () => clearInterval(intervalId);
  }, [cameraId]);

  // เริ่มตัวเล่นวิดีโอ EZVIZ (โชว์ภาพ SD เพื่อประหยัดเน็ต)
  const initPlayer = useCallback(() => {
    if (!PlayerConstructor || !ezopenUrl || !accessToken) return;
    const container = document.getElementById(containerId.current);
    if (!container) return;

    try {
      if (playerRef.current) playerRef.current.stop();
      setIsLoading(true);

      playerRef.current = new PlayerConstructor({
        id: containerId.current,
        url: ezopenUrl.trim(), // แนะนำให้ใช้ .sd.live เพื่อความลื่นไหล
        accessToken: accessToken.trim(),
        template: "simple",
        width: wrapperRef.current?.clientWidth || 800,
        height: wrapperRef.current?.clientHeight || 450,
        env: { domain: areaDomain },
        handleSuccess: () => setIsLoading(false),
        handleError: () => setIsLoading(false),
      });
    } catch (error) {
      setIsLoading(false);
    }
  }, [PlayerConstructor, ezopenUrl, accessToken, areaDomain]);

  useEffect(() => {
    if (PlayerConstructor) {
      const timer = setTimeout(initPlayer, 500);
      return () => clearTimeout(timer);
    }
  }, [PlayerConstructor, initPlayer]);

  return (
    <div
      ref={wrapperRef}
      className="w-full flex flex-col bg-black rounded-xl overflow-hidden shadow-2xl relative border border-white/5"
    >
      <div className="aspect-video relative w-full flex justify-center items-center bg-zinc-950">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-zinc-900/90 text-white">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-zinc-700 border-t-primary mb-3"></div>
            <span className="text-[10px] uppercase tracking-widest">
              Connecting Camera
            </span>
          </div>
        )}
        <div
          id={containerId.current}
          className="absolute inset-0 w-full h-full [&_video]:!object-contain"
        />
      </div>

      {/* สถิติคนงาน */}
      {!isAiLoading && (
        <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/80 border border-white/20 px-4 py-2 rounded-lg backdrop-blur-md z-[70]">
          <div className="w-3 h-3 rounded-full bg-success shadow-[0_0_10px_#22c55e]"></div>
          <span className="text-white text-sm font-bold font-mono">
            WORKERS: {personCount}
          </span>
        </div>
      )}

      {/* 🌟 จอภาพหลักฐาน HD มุมขวาล่าง */}
      {!isAiLoading && (
        <div className="absolute bottom-10 right-4 w-44 aspect-video bg-black border-2 border-primary/50 rounded-lg overflow-hidden shadow-2xl z-[70]">
          <div className="absolute top-0 left-0 bg-primary/80 px-1.5 py-0.5 text-[8px] font-bold text-white uppercase z-10">
            HD AI Scanner
          </div>
          <canvas
            ref={snapshotCanvasRef}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="absolute bottom-2 right-4 text-white text-[9px] font-mono bg-black/40 px-2 py-0.5 rounded z-[70]">
        {aiDebugMsg}
      </div>
    </div>
  );
}
