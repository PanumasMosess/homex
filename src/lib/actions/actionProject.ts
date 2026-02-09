"use server";

import prisma from "@/lib/prisma";
import { ProjectSchema } from "@/lib/formValidationSchemas";

type ActionState = {
  success: boolean;
  error: boolean;
  message?: string;
};

export async function createProject(
  _prevState: ActionState,
  data: ProjectSchema
): Promise<ActionState> {
  try {
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
        startPlanned: data.startPlanned
          ? new Date(data.startPlanned)
          : null,
        finishPlanned: data.finishPlanned
          ? new Date(data.finishPlanned)
          : null,
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
