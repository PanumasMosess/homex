"use server";

import { GoogleGenAI } from "@google/genai";

const ai_gemini = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API_KEY,
});

const model_version = process.env.GEMINI_MODEL || "gemini-2.5-flash";

const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("AI timeout: ใช้เวลานานเกินไป")), ms)
    ),
  ]);
};

export const generateTaskV2Analysis = async (taskName: string) => {
  const prompt = `ข้อมูลตั้งต้น (Task Name): "${taskName}"`;

  try {
    const result = await withTimeout(ai_gemini.models.generateContent({
      model: model_version,
      config: {
        systemInstruction: `
          คุณคือ AI ผู้เชี่ยวชาญระดับสูงด้านวิศวกรรมก่อสร้าง การประเมินราคา (Quantity Surveyor) และการบริหารโครงการ (Project Manager)

          Task: กรุณาวิเคราะห์รายการทำงานก่อสร้างที่ได้รับ และสร้างข้อมูลประกอบการบริหารโครงการ 4 มิติ อย่างละเอียดเพื่อนำไปใช้ในระบบแอปพลิเคชันบริหารการก่อสร้าง

          Requirement: กรุณาตอบกลับเป็น JSON Object ที่มีโครงสร้างดังนี้อย่างเคร่งครัด:

          {
            "costEstimation": {
              "totalEstimate": (number - ราคากลางรวมสุทธิ หน่วยบาท),
              "breakdown": {
                "materialPercent": (number - สัดส่วนค่าวัสดุ %),
                "materialCost": (number - ค่าวัสดุ บาท),
                "laborPercent": (number - สัดส่วนค่าแรง %),
                "laborCost": (number - ค่าแรง บาท),
                "machineryPercent": (number - สัดส่วนค่าเครื่องจักร %),
                "machineryCost": (number - ค่าเครื่องจักร บาท)
              }
            },
            "durationEstimate": {
              "totalDays": (number - จำนวนวันทำงานรวม),
              "assumptions": (string - สมมติฐาน เช่น "ช่าง 1 ทีม (6-7 คน)")
            },
            "risks": [
              {
                "name": (string - ชื่อความเสี่ยง),
                "description": (string - คำอธิบาย/เงื่อนไขที่ทำให้เกิด),
                "mitigation": (string - แนวทางป้องกัน),
                "status": "risk"
              }
            ],
            "checklist": [
              {
                "name": (string - ชื่อขั้นตอนการทำงาน),
                "progressPercent": (number - % ความคืบหน้าสะสมเมื่อเสร็จขั้นตอนนี้),
                "checked": false
              }
            ],
            "materials": [
              {
                "spec": (string - ชื่อ/สเปควัสดุ),
                "quantity": (string - ปริมาณ รวม waste เช่น "1,158 ตร.ม."),
                "unitPrice": (number - ราคาต่อหน่วย บาท),
                "unit": (string - หน่วย เช่น "ตร.ม.", "หลอด"),
                "totalPrice": (number - ราคารวม บาท)
              }
            ],
            "phase": (string - Phase ของงาน เช่น "Phase 3")
          }

          เงื่อนไขสำคัญ:
          - ถอดปริมาณวัสดุโดยเผื่อ Waste % ตามมาตรฐาน
          - ราคาอ้างอิงจากราคาตลาดวัสดุก่อสร้างในประเทศไทย
          - Checklist ต้องครอบคลุมตั้งแต่เตรียมงานจนส่งมอบ โดย progressPercent เรียงจากน้อยไปมาก
          - ความเสี่ยง 2-3 ข้อ พร้อมวิธีป้องกันจริง
          - ห้ามมีข้อความนำหรือคำลงท้าย ห้ามครอบด้วย Markdown format
        `,
        temperature: 0.7,
        responseMimeType: "application/json",
      },
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    }), 60000);

    const responseText = result.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!responseText) {
      console.error("AI Response is empty:", result);
      return null;
    }

    try {
      const data = JSON.parse(responseText);

      // Validate & normalize
      return {
        costEstimation: {
          totalEstimate: Number(data.costEstimation?.totalEstimate) || 0,
          breakdown: {
            materialPercent:
              Number(data.costEstimation?.breakdown?.materialPercent) || 0,
            materialCost:
              Number(data.costEstimation?.breakdown?.materialCost) || 0,
            laborPercent:
              Number(data.costEstimation?.breakdown?.laborPercent) || 0,
            laborCost: Number(data.costEstimation?.breakdown?.laborCost) || 0,
            machineryPercent:
              Number(data.costEstimation?.breakdown?.machineryPercent) || 0,
            machineryCost:
              Number(data.costEstimation?.breakdown?.machineryCost) || 0,
          },
        },
        durationEstimate: {
          totalDays: Number(data.durationEstimate?.totalDays) || 1,
          assumptions: data.durationEstimate?.assumptions || "",
        },
        risks: Array.isArray(data.risks)
          ? data.risks.map((r: any) => ({
            name: r.name || "",
            description: r.description || "",
            mitigation: r.mitigation || "",
            status: r.status === "mitigated" ? "mitigated" : "risk",
          }))
          : [],
        checklist: Array.isArray(data.checklist)
          ? data.checklist.map((c: any) => ({
            name: c.name || "",
            progressPercent: Number(c.progressPercent) || 0,
            checked: false,
          }))
          : [],
        materials: Array.isArray(data.materials)
          ? data.materials.map((m: any) => ({
            spec: m.spec || "",
            quantity: String(m.quantity || ""),
            unitPrice: Number(m.unitPrice) || 0,
            unit: m.unit || "",
            totalPrice: Number(m.totalPrice) || 0,
          }))
          : [],
        phase: data.phase || "Phase 1",
      };
    } catch (parseError) {
      console.error("JSON Parse Error:", responseText);
      return null;
    }
  } catch (error) {
    console.error("generateTaskV2Analysis error:", error);
    return null;
  }
};
