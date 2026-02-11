"use server";

import prisma from "@/lib/prisma";
import { ProjectSchema } from "@/lib/formValidationSchemas";

type ActionState = {
  success: boolean;
  error: boolean;
  message?: string;
};

function calcDurationDays(start?: string | Date | null, finish?: string | Date | null) {
  if (!start || !finish) return null;

  const s = new Date(start);
  const f = new Date(finish);

  // ตั้งเวลาเป็นเที่ยงคืน (local) เพื่อคำนวณเป็นวันแบบคงที่
  const s0 = new Date(s.getFullYear(), s.getMonth(), s.getDate());
  const f0 = new Date(f.getFullYear(), f.getMonth(), f.getDate());

  const diffMs = f0.getTime() - s0.getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (days < 0) return null;

  // ถ้าอยากนับ “รวมวันเริ่มด้วย” (inclusive) ให้เปลี่ยนเป็น days + 1
  return days + 1;
}

export async function createProject(
  _prevState: ActionState,
  data: ProjectSchema
): Promise<ActionState> {
  try {
    const startPlanned = data.startPlanned ? new Date(data.startPlanned) : null;
    const finishPlanned = data.finishPlanned ? new Date(data.finishPlanned) : null;
    const durationDays = calcDurationDays(startPlanned, finishPlanned);
    await prisma.project.create({
      data: {
        projectCode: `PJ-${Date.now()}`,
        projectName: data.projectName,
        customerName: data.customerName,
        projectDesc: data.projectDesc ?? null,
        address: data.address ?? null,
        mapUrl: data.mapUrl ?? null,
        coverImageUrl: data.coverImageUrl ?? null,
        budget: data.budget,
        // startPlanned: data.startPlanned
        //   ? new Date(data.startPlanned)
        //   : null,
        // finishPlanned: data.finishPlanned
        //   ? new Date(data.finishPlanned)
        //   : null,
        startPlanned,
        finishPlanned,
        durationDays,
        organizationId: data.organizationId,
        createdById: data.createdById,
      },
    });

    return { success: true, error: false };
  } catch (e: unknown) {
    if (e instanceof Error) {
      return {
        success: false,
        error: true,
        message: e.message,
      };
    }
    return {
      success: false,
      error: true,
      message: "ไม่สามารถสร้างโครงการได้",
    };
  }
}
