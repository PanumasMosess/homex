"use server";

import { GoogleGenAI } from "@google/genai";

const ai_gemini = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API_KEY,
});

const model_version = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const model_version_img =
  process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";
const model_visesion_video =
  process.env.GEMINI_VIDEO_MODEL || "veo-3.1-generate-preview";

export async function startVideoGeneration(prompt: string) {
  try {
    const operation = await ai_gemini.models.generateVideos({
      model: model_visesion_video,
      prompt: prompt,
    });

    return {
      success: true,
      operationName: operation.name,
    };
  } catch (error: any) {
    console.error("Start Error:", error);
    return { success: false, error: error.message };
  }
}

export async function checkVideoStatus(operationName: string) {
  try {
    
    const operation = await ai_gemini.operations.getVideosOperation({
      operation: { name: operationName } as any,
    });

    if (operation.done) {
      const videoData = operation.response?.generatedVideos?.[0]?.video;

      if (videoData && videoData.uri) {
        return { status: "completed", videoUrl: videoData.uri };
      } else {
        return {
          status: "error",
          message: "Video generated but URL not found",
        };
      }
    } else {
      return { status: "processing" };
    }
  } catch (error: any) {
    console.error("Check Error:", error);
    return { status: "error", error: error.message };
  }
}
