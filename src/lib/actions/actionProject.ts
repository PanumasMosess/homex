"use server";

import prisma from "@/lib/prisma";
import {
  MainTaskSchema,
  ProjectSchema,
  SubTaskSchema,
} from "@/lib/formValidationSchemas";
import { calcDurationDays } from "../setting_data";

import { ActionState } from "@/lib/type";
import { createFeedPost } from "./actionFeed";
import { auth } from "@/auth";

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

      const lastRunning = await tx.projects_running.findFirst({
        where: {
          organizationId: data.organizationId,
          runningCode: {
            startsWith: prefix,
          },
        },
        orderBy: {
          runningCode: "desc",
        },
        select: {
          runningCode: true,
        },
      });

      let nextSequence = 1;
      if (lastRunning?.runningCode) {
        const lastSequenceStr = lastRunning.runningCode.replace(prefix, "");
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
    console.error("Create Project Error:", e);
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
    const task = await prisma.task.create({
      data: {
        taskName: data.taskName,
        taskDesc: data.taskDesc ?? null,
        status: data.status ?? "TODO",
        budget: Number(data.budget) || 0,
        coverImageUrl: data.coverImageUrl ?? null,

        estimatedBudget: data.estimatedBudget
          ? Number(data.estimatedBudget)
          : null,
        estimatedDurationDays: data.estimatedDurationDays
          ? Number(data.estimatedDurationDays)
          : null,
        startAiPlanned: startPlanned,

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

    await createFeedPost({
      feedType: "TASK_CREATED",
      content: `สร้าง Task "${data.taskName}"`,
      organizationId: Number(data.organizationId),
      projectId: Number(data.projectId),
      userId: Number(data.createdById),
      taskId: task.id,
    });

    return {
      success: true,
      error: false,
      taskId: task.id,
    };
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

export async function updateProject(
  id: number | string,
  data: ProjectSchema,
): Promise<ActionState> {
  try {
    const startPlanned = data.startPlanned ? new Date(data.startPlanned) : null;
    const finishPlanned = data.finishPlanned
      ? new Date(data.finishPlanned)
      : null;
    const durationDays = calcDurationDays(startPlanned, finishPlanned);

    await prisma.project.update({
      where: {
        id: Number(id),
      },
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
      },
    });

    return { success: true, error: false };
  } catch (e: unknown) {
    console.error("Update Project Error:", e);
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
      message: "ไม่สามารถแก้ไขโครงการได้",
    };
  }
}

export const updateTaskStatus = async (taskId: number, newStatus: string) => {
  try {
    await prisma.task.update({
      where: { id: taskId },
      data: { status: newStatus },
    });

    return { success: true };
  } catch (error: any) {
    console.error("Error updating task status:", error);
    return { success: false, error: "เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล" };
  }
};

export const updateMainTask = async (taskId: number, updateData: any) => {
  try {
    const dataToUpdate = {
      taskName: updateData.taskName,
      taskDesc: updateData.taskDesc || null,
      startPlanned: updateData.startPlanned
        ? new Date(updateData.startPlanned)
        : null,
      finishPlanned: updateData.finishPlanned
        ? new Date(updateData.finishPlanned)
        : null,
      durationDays: updateData.durationDays
        ? Number(updateData.durationDays)
        : null,
      status: updateData.status,
      budget: updateData.budget,
      progressPercent: updateData.progressPercent,
      updatedAt: new Date(),
    };

    await prisma.task.update({
      where: { id: taskId },
      data: dataToUpdate,
    });

    return { success: true };
  } catch (error: any) {
    console.error("Error updating task status:", error);
    return { success: false, error: "เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล" };
  }
};

export const updateMainTaskForm = async (taskId: number, updateData: any) => {
  try {
    const { assigneeIds, contractorIds, organizationId, ...rest } = updateData;

    const dataToUpdate = {
      taskName: rest.taskName,
      taskDesc: rest.taskDesc || null,
      startPlanned: rest.startPlanned ? new Date(rest.startPlanned) : null,
      finishPlanned: rest.finishPlanned ? new Date(rest.finishPlanned) : null,
      durationDays: rest.durationDays ? Number(rest.durationDays) : null,
      status: rest.status,
      budget: rest.budget ? Number(rest.budget) : 0,
      progressPercent: rest.progressPercent ? Number(rest.progressPercent) : 0,
      updatedAt: new Date(),
    };

    const result = await prisma.$transaction(async (tx) => {
      const updatedTask = await tx.task.update({
        where: { id: taskId },
        data: dataToUpdate,
      });

      if (assigneeIds !== undefined) {
        await tx.task_user.deleteMany({
          where: { taskId: taskId },
        });
        if (assigneeIds.length > 0) {
          await tx.task_user.createMany({
            data: assigneeIds.map((uid: number) => ({
              taskId: taskId,
              userId: uid,
              organizationId: organizationId || updatedTask.organizationId,
            })),
          });
        }
      }

      if (contractorIds !== undefined) {
        // ลบของเก่าออกก่อน
        await tx.task_contractor.deleteMany({
          where: { taskId: taskId },
        });
        if (contractorIds.length > 0) {
          await tx.task_contractor.createMany({
            data: contractorIds.map((cid: number) => ({
              taskId: taskId,
              contractorId: cid,
              organizationId: organizationId || updatedTask.organizationId,
            })),
          });
        }
      }

      const task = await tx.task.findUnique({
        where: { id: taskId },
        include: {
          taskUsers: { include: { user: true } },
          taskContractors: { include: { contractor: true } },
          details: true,
        },
      });
      return JSON.parse(JSON.stringify(task));
    });

    return { success: true, data: result };
  } catch (error: any) {
    console.error("Error updating main task:", error);
    return {
      success: false,
      error: "เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง",
    };
  }
};

export async function createSubTask(data: any) {
  try {
    const startPlanned = data.startPlanned ? new Date(data.startPlanned) : null;
    let finishPlanned = data.finishPlanned
      ? new Date(data.finishPlanned)
      : null;

    if (startPlanned && data.durationDays && !finishPlanned) {
      finishPlanned = new Date(startPlanned);
      finishPlanned.setDate(finishPlanned.getDate() + data.durationDays);
    }

    const newTaskDetail = await prisma.task_detail.create({
      data: {
        detailName: data.detailName,
        detailDesc: data.detailDesc || null,
        weightPercent: data.weightPercent || 0,
        startPlanned,
        finishPlanned,
        durationDays: data.durationDays || null,
        sortOrder: data.sortOrder || 0,
        status: data.status || false,
        organization: { connect: { id: data.organizationId } },
        project: { connect: { id: data.projectId } },
        task: { connect: { id: data.taskId } },
      },
    });

    if (!newTaskDetail || !newTaskDetail.id) {
      return {
        success: false,
        error: true,
        message: "เกิดข้อผิดพลาด: ไม่สามารถสร้างรายการย่อยได้",
      };
    }

    const session = await auth();
    const feedUserId = session?.user?.id ? parseInt(session.user.id) : 0;

    if (feedUserId) {
      await createFeedPost({
        feedType: "SUBTASK_UPDATED",
        content: `เพิ่มรายการย่อย "${data.detailName}"`,
        organizationId: data.organizationId,
        projectId: data.projectId,
        userId: feedUserId,
        taskId: data.taskId,
        subtaskId: newTaskDetail.id,
      });
    }

    return {
      success: true,
      error: false,
      message: "สร้างรายการย่อยสำเร็จ",
      data: newTaskDetail,
    };
  } catch (error: any) {
    console.error("Create Task Detail Error:", error);
    return {
      success: false,
      error: true,
      message: error.message || "ไม่สามารถสร้างรายการย่อยได้",
    };
  }
}

export async function toggleSubtaskStatus(
  subtaskId: number,
  newStatus: boolean,
) {
  try {
    const detail = await prisma.task_detail.update({
      where: { id: subtaskId },
      data: { status: newStatus },
      include: { task: { select: { id: true, coverImageUrl: true } } },
    });

    if (newStatus === true) {
      const session = await auth();
      const feedUserId = session?.user?.id ? parseInt(session.user.id) : 0;

      if (feedUserId) {
        await createFeedPost({
          feedType: "SUBTASK_COMPLETED",
          content: `สำเร็จรายการย่อย "${detail.detailName}"`,
          organizationId: detail.organizationId,
          projectId: detail.projectId,
          userId: feedUserId,
          taskId: detail.taskId,
          subtaskId: detail.id,
          imageUrl: detail.task?.coverImageUrl || undefined,
        });
      }
    }

    return { success: true };
  } catch (error: any) {
    console.error("Toggle Subtask Error:", error);
    return { success: false, error: "เกิดข้อผิดพลาดในการอัปเดตสถานะ" };
  }
}

export async function updateSubtask(subtaskId: number, data: any) {
  try {
    const startPlanned = data.startPlanned ? new Date(data.startPlanned) : null;
    let finishPlanned = data.finishPlanned
      ? new Date(data.finishPlanned)
      : null;

    if (startPlanned && data.durationDays && !finishPlanned) {
      finishPlanned = new Date(startPlanned);
      finishPlanned.setDate(
        finishPlanned.getDate() + Number(data.durationDays),
      );
    }

    const updatedDetail = await prisma.task_detail.update({
      where: { id: subtaskId },
      data: {
        detailName: data.detailName,
        detailDesc: data.detailDesc || null,
        weightPercent: data.weightPercent ? Number(data.weightPercent) : 0,
        startPlanned,
        finishPlanned,
        durationDays: data.durationDays ? Number(data.durationDays) : null,
      },
    });

    return { success: true, data: updatedDetail };
  } catch (error: any) {
    console.error("Update Subtask Error:", error);
    return { success: false, error: "เกิดข้อผิดพลาดในการแก้ไขรายการย่อย" };
  }
}

export async function updateProjectProgressDB(
  projectId: number,
  progressPercent: number,
  status: string,
) {
  try {
    await prisma.project.update({
      where: { id: projectId },
      data: {
        progressPercent: Number(progressPercent),
        status: status,
        updatedAt: new Date(),
      },
    });
    return {
      success: true,
      error: false,
      message: "เกิดข้อผิดพลาด: ไม่สามารถสร้างรายการย่อยได้",
    };
  } catch (error) {
    console.error("Update Project Progress Error:", error);
    return {
      success: false,
      error: false,
      message: "ไม่สามารถบันทึกเปอร์เซ็นต์โปรเจกต์ได้",
    };
  }
}

export async function deleteSubtask(subtaskId: number) {
  try {
    const detail = await prisma.task_detail.findUnique({
      where: { id: subtaskId },
    });

    await prisma.task_detail.delete({
      where: { id: subtaskId },
    });

    if (detail) {
      const session = await auth();
      const feedUserId = session?.user?.id ? parseInt(session.user.id) : 0;

      if (feedUserId) {
        await createFeedPost({
          feedType: "SUBTASK_DELETED",
          content: `ลบรายการย่อย "${detail.detailName}"`,
          organizationId: detail.organizationId,
          projectId: detail.projectId,
          userId: feedUserId,
          taskId: detail.taskId,
        });
      }
    }

    return { success: true };
  } catch (error: any) {
    console.error("Delete Subtask Error:", error);
    return { success: false, error: "เกิดข้อผิดพลาดในการลบรายการย่อย" };
  }
}

export async function createDocFile(data: any) {
  try {
    if (!data.fileUrl || !data.projectId) {
      return { success: false, error: "ข้อมูลไม่ครบถ้วน" };
    }

    const newFile = await prisma.project_file.create({
      data: {
        fileName: data.fileName,
        fileUrl: data.fileUrl,
        fileType: data.fileType,
        note: data.note || "",
        organizationId: Number(data.organizationId),
        projectId: Number(data.projectId),
        uploadedById: Number(data.uploadedById),
      },
    });

    return {
      success: true,
      error: false,
      message: "เพิ่มเอกสารสำเร็จ",
      data: JSON.parse(JSON.stringify(newFile)),
    };
  } catch (error: any) {
    console.error("❌ Error in createDocFile:", error);
    return {
      success: false,
      error: true,
      message: error.message || "ไม่สามารถบันทึกข้อมูลไฟล์ได้",
    };
  }
}

export async function getAllDoc(projectId: number, organizationId: number) {
  try {
    if (!projectId || !organizationId) {
      return {
        success: false,
        error: "ข้อมูลโครงการหรือองค์กรไม่ถูกต้อง",
        data: [],
      };
    }

    const files = await prisma.project_file.findMany({
      where: {
        projectId: Number(projectId),
        organizationId: Number(organizationId),
        fileStatus: "ACTIVE",
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return {
      success: true,
      error: false,
      data: JSON.parse(JSON.stringify(files)),
    };
  } catch (error: any) {
    console.error("❌ Fetch Docs Error:", error);
    return {
      success: false,
      error: "ไม่สามารถดึงข้อมูลเอกสารได้",
      data: [],
    };
  }
}

export async function deleteDocFile(id: number, organizationId: number) {
  try {
    const fileData = await prisma.project_file.findFirst({
      where: { id, organizationId },
    });

    if (!fileData) throw new Error("ไม่พบข้อมูลไฟล์");

    // try {
    //   const urlObj = new URL(fileData.fileUrl);
    //   let fileKey = urlObj.pathname.substring(1);

    //   if (fileKey.startsWith("homex/")) {
    //     fileKey = fileKey.replace("homex/", "");
    //   }

    //   if (fileKey) {
    //     const s3Res = await deleteFileS3(decodeURIComponent(fileKey));

    //     if (!s3Res.success) {
    //       console.error("S3 Delete Error:", s3Res.error);
    //     }
    //   }
    // } catch (urlError) {
    //   console.error("URL Parsing Error:", urlError);
    // }

    await prisma.project_file.update({
      where: { id },
      data: {
        fileStatus: "ARCHIVED", // หรือ "ARCHIVED" ตามที่คุณกำหนดไว้
      },
    });

    return { success: true, error: false, message: "ลบไฟล์เรียบร้อยแล้ว" };
  } catch (error: any) {
    return {
      success: false,
      error: true,
      message: error.message || "ลบไม่สำเร็จ",
    };
  }
}
