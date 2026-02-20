"use server";

import prisma from "@/lib/prisma";
import { MainTaskSchema, ProjectSchema } from "@/lib/formValidationSchemas";
import { calcDurationDays } from "../setting_data";

type ActionState = {
  success: boolean;
  error: boolean;
  message?: string;
};

export async function createProject(
  _prevState: ActionState,
  data: ProjectSchema,
): Promise<ActionState> {
  try {
    const startPlanned = data.startPlanned ? new Date(data.startPlanned) : null;
    const finishPlanned = data.finishPlanned
      ? new Date(data.finishPlanned)
      : null;
    const durationDays = calcDurationDays(startPlanned, finishPlanned);

    await prisma.$transaction(async (tx) => {
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const dateStr = `${year}${month}${day}`;

      const prefix = `PJ-${data.organizationId}-${dateStr}-`;
      const lastProject = await tx.project.findFirst({
        where: {
          projectCode: {
            startsWith: prefix,
          },
        },
        orderBy: {
          projectCode: "desc",
        },
        select: {
          projectCode: true,
        },
      });

      let nextSequence = 1;
      if (lastProject?.projectCode) {
        const lastSequenceStr = lastProject.projectCode.replace(prefix, "");
        const lastSequence = parseInt(lastSequenceStr, 10);

        if (!isNaN(lastSequence)) {
          nextSequence = lastSequence + 1;
        }
      }
      const runningNumber = String(nextSequence).padStart(4, "0");
      const newProjectCode = `${prefix}${runningNumber}`;

      await tx.projects_running.create({
        data: {
          runningCode: newProjectCode,
          organizationId: data.organizationId,
        },
      });

      await tx.project.create({
        data: {
          projectName: data.projectName,
          customerName: data.customerName,
          projectDesc: data.projectDesc ?? null,
          address: data.address ?? null,
          mapUrl: data.mapUrl ?? null,
          coverImageUrl: data.coverImageUrl ?? null,
          budget: data.budget,
          startPlanned,
          finishPlanned,
          durationDays,
          organization: {
            connect: {
              id: data.organizationId,
            },
          },
          creator: {
            connect: {
              id: data.createdById,
            },
          },
          code: {
            connect: {
              runningCode: newProjectCode,
            },
          },
        },
      });
    });

    return { success: true, error: false };
  } catch (e: unknown) {
    console.error(e);
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

export async function createMainTask(
  _prevState: ActionState,
  data: MainTaskSchema,
): Promise<ActionState> {
  try {
    const startPlanned = data.startPlanned ? new Date(data.startPlanned) : null;
    const finishPlanned = data.finishPlanned
      ? new Date(data.finishPlanned)
      : null;
    const durationDays = calcDurationDays(startPlanned, finishPlanned);
    await prisma.task.create({
      data: {
        taskName: data.taskName,
        taskDesc: data.taskDesc ?? null,
        status: data.status ?? "todo",
        progressPercent: Number(data.progressPercent) || 0,
        coverImageUrl: data.coverImageUrl ?? null,

        startPlanned: startPlanned,
        finishPlanned: finishPlanned,
        durationDays: durationDays,

        organization: {
          connect: {
            id: Number(data.organizationId),
          },
        },
        project: {
          connect: {
            id: Number(data.projectId),
          },
        },
        creator: {
          connect: {
            id: Number(data.createdById),
          },
        },
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
      message: "ไม่สามารถสร้าง Task ได้",
    };
  }
}

export async function updateVdoProject(
  projectId: number,
  videoUrl: string,
): Promise<ActionState> {
  try {
    await prisma.project.update({
      where: {
        id: projectId,
      },
      data: {
        coverVideoUrl: videoUrl,
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
      message: "ไม่สามารถสร้าง Task ได้",
    };
  }
}

export async function deleteProject(projectId: number): Promise<ActionState> {
  try {
    await prisma.project.update({
      where: {
        id: projectId,
      },
      data: {
        status: "DELETED",
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
      message: "ไม่สามารถลบโครงการได้",
    };
  }
}
