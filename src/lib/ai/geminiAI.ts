"use server";

import { GoogleGenAI } from "@google/genai";
import {
  sendbase64toS3Data,
  sendbase64toS3DataVdo,
} from "../actions/actionIndex";

const ai_gemini = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API_KEY,
});

const model_version = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const model_version_img =
  process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";
const model_visesion_video =
  process.env.GEMINI_VIDEO_MODEL || "veo-3.1-generate-preview";

export async function startVideoJob(prompt: string, img_Url: string) {
  try {
    const API_KEY =
      process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!API_KEY) throw new Error("ไม่พบ API KEY ในระบบ");

    const imageResponse = await fetch(img_Url);
    if (!imageResponse.ok)
      throw new Error(`ไม่สามารถโหลดรูปภาพได้: ${imageResponse.statusText}`);

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
    console.log(`✅ เริ่มสร้างวิดีโอสำเร็จ... บัตรคิวเลขที่: ${operationName}`);

    return {
      success: true,
      operationName: operationName,
    };
  } catch (error: any) {
    console.error("Start Job Error:", error);
    return { success: false, error: error.message };
  }
}

export async function checkVideoStatus(operationName: string) {
  try {
    const API_KEY =
      process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!API_KEY) throw new Error("ไม่พบ API KEY ในระบบ");

    const checkUrl = `https://generativelanguage.googleapis.com/v1beta/${operationName}?key=${API_KEY}`;
    const res = await fetch(checkUrl, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) throw new Error(`HTTP Error ตอนเช็คสถานะ: ${res.status}`);

    const data = await res.json();

    if (!data.done) {
      console.log(`บัตรคิว ${operationName}: กำลังประมวลผล...`);
      return { status: "processing" };
    }

    console.log("✅ AI สร้างวิดีโอเสร็จแล้ว กำลังจัดการไฟล์...");

    if (data.error) {
      throw new Error(data.error.message || "เกิดข้อผิดพลาดจากฝั่ง AI");
    }

    const resBody = data.response || {};
    let finalVideoUri =
      resBody.generateVideoResponse?.generatedSamples?.[0]?.video?.uri ||
      resBody.generatedVideos?.[0]?.video?.uri ||
      resBody.videos?.[0]?.video?.uri;

    if (!finalVideoUri) {
      throw new Error(
        "ระบบ AI ทำงานเสร็จแต่ไม่พบวิดีโอ (อาจติด Safety Filter)",
      );
    }

    let downloadUrl = finalVideoUri;
    if (downloadUrl.includes("?")) {
      downloadUrl = `${downloadUrl}&key=${API_KEY}&alt=media`;
    } else {
      downloadUrl = `${downloadUrl}?key=${API_KEY}&alt=media`;
    }

    const videoFetchRes = await fetch(downloadUrl);
    if (!videoFetchRes.ok)
      throw new Error("ไม่สามารถดาวน์โหลดไฟล์วิดีโอจาก Google API ได้");

    const videoArrayBuffer = await videoFetchRes.arrayBuffer();
    
    const blob = new Blob([videoArrayBuffer], { type: "video/mp4" });
    const formData = new FormData();
    formData.append("file", blob, "ai_generated_video.mp4");

    console.log("ดาวน์โหลดไฟล์สำเร็จ! กำลังอัปโหลดขึ้น S3...");
    
    const s3Response = await sendbase64toS3DataVdo(
      formData,
      "vdo_projects",
    );

    if (s3Response && s3Response.url) {
      console.log(`✅ อัปโหลดขึ้น S3 สมบูรณ์! URL: ${s3Response.url}`);
      return {
        status: "success",
        videoUrl: s3Response.url,
      };
    } else {
      throw new Error("การอัปโหลดไฟล์ไปยัง S3 ล้มเหลว (ไม่พบ URL ตอบกลับ)");
    }
  } catch (error: any) {
    console.error("Check Status Error:", error);
    return { status: "error", error: error.message };
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

export const generationImage3D = async (img_Url: string, progress: number) => {
  let constructionStageDesc = "";

  const safeProgress = Math.max(0, Math.min(100, progress));

  if (safeProgress <= 25) {
    constructionStageDesc = `Early stage construction (around ${safeProgress}% complete). Groundworks and foundations are visible, heavy machinery like excavators are present, initial structural steel columns or concrete cores are just starting to rise from the ground level. The plot is mostly earth and materials.`;
  } else if (safeProgress <= 65) {
    constructionStageDesc = `Mid-stage construction active site (approximately ${safeProgress}% complete). The main structure of the building is prominent and rising. The building is heavily covered in scaffolding and safety netting. Tower cranes are actively moving materials. Concrete floors are visible, some exterior cladding might be starting on lower floors.`;
  } else {
    constructionStageDesc = `Late-stage construction nearing completion (around ${safeProgress}% complete). The exterior is mostly finished. Scaffolding is being removed in sections, revealing the final facade, glass windows, and balconies. Tower cranes might still be present but less activity on the structure itself. Focus is on finishing touches and ground level landscaping.`;
  }

  const promptText = `A professional architectural photograph of a busy construction site based on the reference image. The modern building is actively under construction. ${constructionStageDesc} Workers, construction vehicles, and building materials are busy on site. The surrounding environment, street, cars, and trees match the reference image exactly but adapted to the construction activity. Realistic daylight, highly detailed texture.`;

  try {
    let imagePart = null;
    if (img_Url) {
      const imageResponse = await fetch(img_Url);
      if (!imageResponse.ok) {
        throw new Error(`ไม่สามารถโหลดรูปภาพได้: ${imageResponse.statusText}`);
      }
      const mimeType =
        imageResponse.headers.get("content-type") || "image/jpeg";
      const arrayBuffer = await imageResponse.arrayBuffer();
      const imageBytesBase64 = Buffer.from(arrayBuffer).toString("base64");

      imagePart = {
        inlineData: {
          data: imageBytesBase64,
          mimeType: mimeType,
        },
      };
    }

    const contentsPayload = imagePart ? [promptText, imagePart] : promptText;

    const response = await ai_gemini.models.generateContent({
      model: model_version_img,
      contents: contentsPayload,
    });

    const parts = response.candidates?.[0]?.content?.parts;

    if (parts) {
      let url;
      let imageData: string | undefined;

      for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
          imageData = part.inlineData.data;

          if (imageData && imageData.startsWith("data:")) {
            imageData = imageData.replace(/^data:image\/\w+;base64,/, "");
          }
        }
      }

      if (imageData) {
        url = await sendbase64toS3Data(imageData, "vdo_projects");
      }

      return {
        success: true,
        error: false,
        answer: url?.url,
      };
    }

    return {
      success: false,
      error: "AI ประมวลผลสำเร็จ แต่ไม่พบข้อมูลรูปภาพตอบกลับมา",
    };
  } catch (error) {
    console.error("Gemini image generation error:", error);
    return { success: false, error: "Failed to process gen with AI." };
  }
};
