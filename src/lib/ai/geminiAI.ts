"use server";

import { GoogleGenAI } from "@google/genai";
import { sendbase64toS3Data, sendbase64toS3DataVdo } from "../actions/actionIndex";

const ai_gemini = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API_KEY,
});

const model_version = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const model_version_img =
  process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";
const model_visesion_video =
  process.env.GEMINI_VIDEO_MODEL || "veo-3.1-generate-preview";

export async function startVideoGeneration(prompt: string, img_Url: string) {
  try {
    const API_KEY =
      process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!API_KEY) {
      throw new Error("ไม่พบ API KEY ในระบบ");
    }

    const imageResponse = await fetch(img_Url);
    if (!imageResponse.ok) {
      throw new Error(`ไม่สามารถโหลดรูปภาพได้: ${imageResponse.statusText}`);
    }
    const mimeType = imageResponse.headers.get("content-type") || "image/jpeg";
    const arrayBuffer = await imageResponse.arrayBuffer();
    const imageBytesBase64 = Buffer.from(arrayBuffer).toString("base64");

    const initialOperation = await ai_gemini.models.generateVideos({
      model: model_visesion_video,
      prompt: prompt,
      image: {
        imageBytes: imageBytesBase64,
        mimeType: mimeType,
      },
    });

    const operationName = initialOperation.name;
    console.log(`เริ่มสร้างวิดีโอ... บัตรคิวเลขที่: ${operationName}`);

    let isDone = false;
    let finalVideoUri = null;
    while (!isDone) {
      console.log("กำลังสร้างวิดีโอ... รอ 10 วินาทีก่อนเช็คใหม่");
      await new Promise((resolve) => setTimeout(resolve, 10000));

      const checkUrl = `https://generativelanguage.googleapis.com/v1beta/${operationName}?key=${API_KEY}`;
      const res = await fetch(checkUrl, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        throw new Error(`HTTP Error ตอนเช็คสถานะ: ${res.status}`);
      }

      const data = await res.json();

      if (data.done) {
        isDone = true;

        console.log(
          "✅ ข้อมูลดิบที่ Google ส่งมาเมื่อเสร็จสิ้น:",
          JSON.stringify(data, null, 2),
        );

        if (data.error) {
          throw new Error(data.error.message || "เกิดข้อผิดพลาดจากฝั่ง AI");
        }

        const resBody = data.response || {};

        finalVideoUri =
          resBody.generateVideoResponse?.generatedSamples?.[0]?.video?.uri ||
          resBody.generatedVideos?.[0]?.video?.uri ||
          resBody.videos?.[0]?.video?.uri;

        if (!finalVideoUri) {
          throw new Error(
            "ระบบ AI ทำงานเสร็จแต่ไม่พบวิดีโอ (อาจติด Safety Filter, รูปไม่เหมาะสม, หรือรูปแบบ API เปลี่ยนไป ให้เช็ค Console)",
          );
        }
      }
    }

    if (finalVideoUri) {
      if (!finalVideoUri.includes("key=")) {
        finalVideoUri = `${finalVideoUri}&key=${API_KEY}`;
      }

      console.log(`กำลังดาวน์โหลดวิดีโอจาก Google...`);

      const videoFetchRes = await fetch(finalVideoUri);
      if (!videoFetchRes.ok) {
        throw new Error("ไม่สามารถดาวน์โหลดไฟล์วิดีโอจาก Google API ได้");
      }

      const videoArrayBuffer = await videoFetchRes.arrayBuffer();
      const videoBase64 = Buffer.from(videoArrayBuffer).toString("base64");

      console.log("แปลงไฟล์เป็น Base64 สำเร็จ! กำลังอัปโหลดขึ้น S3...");

      const s3Response = await sendbase64toS3DataVdo(videoBase64, "vdo_projects");

      if (s3Response && s3Response.url) {
        console.log(`✅ อัปโหลดขึ้น S3 สำเร็จสมบูรณ์! URL: ${s3Response.url}`);
        return {
          success: true,
          videoUrl: s3Response.url,
        };
      } else {
        throw new Error("การอัปโหลดไฟล์ไปยัง S3 ล้มเหลว (ไม่พบ URL ตอบกลับ)");
      }
    } else {
      throw new Error("วิดีโอสร้างเสร็จแล้ว แต่ไม่พบ URL ของวิดีโอในระบบ");
    }
  } catch (error: any) {
    console.error("Start Error:", error);
    return { success: false, error: error.message };
  }
}

export const generationImage = async (userCommand: string) => {
  const prompt = `A photorealistic, professional construction site photography of "${userCommand}", bright natural daylight, cinematic lighting, high detailed, optimized for web.`;

  try {
    const response = await ai_gemini.models.generateContent({
      model: model_version_img,
      contents: prompt,
    });

    const parts = response.candidates?.[0]?.content?.parts;

    if (parts) {
      let url;
      let imageData: string | undefined;
      for (const part of parts) {
        if (part.inlineData) {
          imageData = part.inlineData?.data;
        }
      }

      if (imageData) {
        url = await sendbase64toS3Data(imageData, "img_tasks");
      }

      return {
        success: true,
        answer: url?.url,
      };
    }

    return {
      success: false,
      error: "Failed to process gen with AI.",
    };
  } catch (error) {
    console.error("Gemini image generation error:", error);
    return { success: false, error: "Failed to process gen with AI." };
  }
};
