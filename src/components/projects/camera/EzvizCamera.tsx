"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { EzvizCameraProps } from "@/lib/type";

import * as tf from "@tensorflow/tfjs";
import * as cocossd from "@tensorflow-models/coco-ssd";
import { savePersonCountAction } from "@/lib/actions/actionCamera";

export default function EzvizCamera({
  cameraId,
  accessToken,
  ezopenUrl,
  areaDomain = "https://open.ezviz.com",
}: EzvizCameraProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [PlayerConstructor, setPlayerConstructor] = useState<any>(null);
  const [threadMode, setThreadMode] = useState<string>("Detecting Mode...");
  const [playerError, setPlayerError] = useState<string>("");

  const [personCount, setPersonCount] = useState<number>(0);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(true);

  const playerRef = useRef<any>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const aiModelRef = useRef<cocossd.ObjectDetection | null>(null);
  const requestRef = useRef<number>(0);

  const maxCountRef = useRef<number>(0);

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

  useEffect(() => {
    const loadAiModel = async () => {
      try {
        await tf.ready();
        const model = await cocossd.load();
        aiModelRef.current = model;
        setIsAiLoading(false);
        console.log("🤖 AI Model Loaded Successfully!");
      } catch (error) {
        console.error("❌ Failed to load AI Model", error);
        setIsAiLoading(false);
      }
    };
    loadAiModel();
  }, []);

  const detectPersons = useCallback(async () => {
    if (!aiModelRef.current || !wrapperRef.current || !overlayCanvasRef.current)
      return;
    const mediaElement = wrapperRef.current.querySelector("video, canvas") as
      | HTMLVideoElement
      | HTMLCanvasElement;

    if (mediaElement && mediaElement.clientWidth > 0) {
      try {
        const predictions = await aiModelRef.current.detect(mediaElement);

        const people = predictions.filter((p) => p.class === "person");
        const currentCount = people.length;

        setPersonCount(currentCount);

        if (currentCount > maxCountRef.current) {
          maxCountRef.current = currentCount;
        }

        const canvas = overlayCanvasRef.current;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          canvas.width = mediaElement.clientWidth;
          canvas.height = mediaElement.clientHeight;
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          const scaleX =
            canvas.width /
            (mediaElement instanceof HTMLVideoElement
              ? mediaElement.videoWidth
              : mediaElement.width || canvas.width);
          const scaleY =
            canvas.height /
            (mediaElement instanceof HTMLVideoElement
              ? mediaElement.videoHeight
              : mediaElement.height || canvas.height);

          people.forEach((person) => {
            const [x, y, width, height] = person.bbox;
            ctx.strokeStyle = "#00FF00";
            ctx.lineWidth = 2;
            ctx.strokeRect(
              x * scaleX,
              y * scaleY,
              width * scaleX,
              height * scaleY,
            );

            ctx.fillStyle = "#00FF00";
            ctx.font = "14px Arial";
            ctx.fillText(
              `Person ${Math.round(person.score * 100)}%`,
              x * scaleX,
              y * scaleY - 5,
            );
          });
        }
      } catch (error) {
        // อาจเกิด Error ได้ถ้าภาพยังไม่โหลดสมบูรณ์
      }
    }

    requestRef.current = requestAnimationFrame(detectPersons);
  }, []);

  useEffect(() => {
    if (!cameraId) return;

    const SAVE_INTERVAL_MS = 5 * 60 * 1000;

    const intervalId = setInterval(async () => {
      const highestCount = maxCountRef.current;

      console.log(
        `📊 กำลังบันทึกสถิติ: กล้อง ID ${cameraId} ยอดคนสูงสุด ${highestCount} คน`,
      );

      try {
        await savePersonCountAction(cameraId, highestCount);
      } catch (error) {
        console.error("❌ บันทึกสถิติไม่สำเร็จ:", error);
      }

      maxCountRef.current = 0;
    }, SAVE_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [cameraId]);

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
          setPlayerError("เกิดข้อผิดพลาดในการเล่นวิดีโอ");
          setIsLoading(false);
        },
        handleSuccess: () => {
          console.log("✅ Play Success!");
          setPlayerError("");
          setIsLoading(false);
          if (requestRef.current) cancelAnimationFrame(requestRef.current);
          requestRef.current = requestAnimationFrame(detectPersons);
        },
      });

      setTimeout(() => setIsLoading(false), 5000);
    } catch (error: any) {
      setPlayerError(error?.message || "เกิดข้อผิดพลาดในการสร้างตัวเล่น");
      setIsLoading(false);
    }
  }, [PlayerConstructor, ezopenUrl, accessToken, areaDomain, detectPersons]);

  useEffect(() => {
    if (PlayerConstructor && typeof window !== "undefined") {
      const timer = setTimeout(initPlayer, 500);
      return () => clearTimeout(timer);
    }
  }, [PlayerConstructor, initPlayer]);

  useEffect(() => {
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  return (
    <div
      ref={wrapperRef}
      className="w-full flex flex-col bg-black rounded-xl overflow-hidden shadow-2xl relative border border-white/5"
    >
      <div className="aspect-video relative w-full flex justify-center items-center bg-zinc-950 overflow-hidden">
        {isLoading && !playerError && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-zinc-900/90 text-white backdrop-blur-sm">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-zinc-700 border-t-primary mb-3"></div>
            <span className="text-[10px] text-zinc-400 font-mono tracking-[0.2em] uppercase">
              Connecting
            </span>
          </div>
        )}
        <div
          className={`relative w-full h-full overflow-hidden transition-opacity duration-500 ${playerError ? "opacity-0" : "opacity-100"}`}
        >
          <div
            id={containerId.current}
            key={containerId.current}
            className="absolute inset-0 w-full h-full overflow-hidden [&_*]:!overflow-hidden [&>div]:!w-full [&>div]:!h-full [&_canvas]:!w-full [&_canvas]:!h-full [&_video]:!w-full [&_video]:!h-full [&_video]:!object-contain"
          />
          <canvas
            ref={overlayCanvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none z-20"
          />
        </div>
      </div>
      {!playerError && (
        <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/70 border border-white/10 px-3 py-1.5 rounded-lg backdrop-blur-md z-30">
          <div
            className={`w-2 h-2 rounded-full ${isAiLoading ? "bg-warning animate-pulse" : "bg-success"}`}
          ></div>
          <span className="text-white text-xs font-bold font-mono">
            {isAiLoading ? "AI LOADING..." : `PERSON: ${personCount}`}
          </span>
        </div>
      )}

      <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/60 text-white text-[9px] font-mono rounded border border-white/10 backdrop-blur-md z-30 pointer-events-none uppercase tracking-tighter">
        {threadMode}
      </div>
    </div>
  );
}
