"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import type { ActionState, TaskV2AIResponse } from "@/lib/type";

/* ====================================================== */
/* CREATE TASK V2 (simple: just name → AI fills the rest) */
/* ====================================================== */
export async function createTaskV2(
  taskName: string,
  projectId: number,
  organizationId: number,
  coverImageUrl?: string
): Promise<ActionState> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: true, message: "ไม่ได้เข้าสู่ระบบ" };
    }

    if (!taskName.trim()) {
      return { success: false, error: true, message: "กรุณากรอกชื่องาน" };
    }

    const task = await prisma.task.create({
      data: {
        taskName: taskName.trim(),
        status: "TODO",
        progressPercent: 0,
        coverImageUrl: coverImageUrl || "",
        organizationId,
        projectId,
        createdById: Number(session.user.id),
      },
    });

    return {
      success: true,
      error: false,
      message: "สร้างงานสำเร็จ",
      taskId: task.id,
    };
  } catch (error: any) {
    console.error("createTaskV2 error:", error);
    return {
      success: false,
      error: true,
      message: error.message || "สร้างงานไม่สำเร็จ",
    };
  }
}

/* ====================================================== */
/* SAVE AI DATA → เขียนลงฟิลด์ต่าง ๆ ใน task โดยตรง       */
/* ====================================================== */
export async function saveTaskV2AiData(
  taskId: number,
  aiData: TaskV2AIResponse
): Promise<ActionState> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: true, message: "ไม่ได้เข้าสู่ระบบ" };
    }

    await prisma.task.update({
      where: { id: taskId },
      data: {
        estimatedBudget: aiData.costEstimation.totalEstimate,
        aiMaterialPercent: aiData.costEstimation.breakdown.materialPercent,
        aiMaterialCost: aiData.costEstimation.breakdown.materialCost,
        aiLaborPercent: aiData.costEstimation.breakdown.laborPercent,
        aiLaborCost: aiData.costEstimation.breakdown.laborCost,
        aiMachineryPercent: aiData.costEstimation.breakdown.machineryPercent,
        aiMachineryCost: aiData.costEstimation.breakdown.machineryCost,
        estimatedDurationDays: aiData.durationEstimate.totalDays,
        aiDurationAssumptions: aiData.durationEstimate.assumptions,
        aiRisks: JSON.stringify(aiData.risks),
        aiMaterials: JSON.stringify(aiData.materials),
        phase: aiData.phase,
      },
    });

    return { success: true, error: false, message: "บันทึกข้อมูล AI สำเร็จ" };
  } catch (error: any) {
    console.error("saveTaskV2AiData error:", error);
    return {
      success: false,
      error: true,
      message: error.message || "บันทึกข้อมูล AI ไม่สำเร็จ",
    };
  }
}

/* ====================================================== */
/* GET AI DATA → อ่านจาก task แล้วประกอบเป็น TaskV2AIResponse */
/* ====================================================== */
export async function getTaskV2AiData(
  taskId: number
): Promise<TaskV2AIResponse | null> {
  try {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: {
        estimatedBudget: true,
        aiMaterialPercent: true,
        aiMaterialCost: true,
        aiLaborPercent: true,
        aiLaborCost: true,
        aiMachineryPercent: true,
        aiMachineryCost: true,
        estimatedDurationDays: true,
        aiDurationAssumptions: true,
        aiRisks: true,
        aiMaterials: true,
        phase: true,
      },
    });

    if (!task) return null;

    // ถ้ายังไม่เคยมี AI data (ฟิลด์หลัก ๆ เป็น null) ก็คืน null
    if (task.estimatedBudget == null && task.aiRisks == null) return null;

    let risks = [];
    try {
      risks = task.aiRisks ? JSON.parse(task.aiRisks) : [];
    } catch {
      risks = [];
    }

    let materials = [];
    try {
      materials = task.aiMaterials ? JSON.parse(task.aiMaterials) : [];
    } catch {
      materials = [];
    }

    return {
      costEstimation: {
        totalEstimate: Number(task.estimatedBudget) || 0,
        breakdown: {
          materialPercent: task.aiMaterialPercent ?? 0,
          materialCost: Number(task.aiMaterialCost) || 0,
          laborPercent: task.aiLaborPercent ?? 0,
          laborCost: Number(task.aiLaborCost) || 0,
          machineryPercent: task.aiMachineryPercent ?? 0,
          machineryCost: Number(task.aiMachineryCost) || 0,
        },
      },
      durationEstimate: {
        totalDays: task.estimatedDurationDays ?? 0,
        assumptions: task.aiDurationAssumptions || "",
      },
      risks,
      materials,
      checklist: [], // checklist ดึงจาก task_detail (subtasks) แทน
      phase: task.phase || "",
    };
  } catch {
    return null;
  }
}

/* ====================================================== */
/* UPDATE TASK PROGRESS จาก Checklist (subtask toggle)    */
/* ====================================================== */
export async function updateTaskV2Progress(
  taskId: number
): Promise<ActionState> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: true, message: "ไม่ได้เข้าสู่ระบบ" };
    }

    const subtasks = await prisma.task_detail.findMany({
      where: { taskId },
      select: { status: true },
    });

    const totalItems = subtasks.length;
    const checkedItems = subtasks.filter((s) => s.status === true).length;
    const progress =
      totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0;

    await prisma.task.update({
      where: { id: taskId },
      data: {
        progressPercent: progress,
        status:
          progress === 100 ? "DONE" : progress > 0 ? "PROGRESS" : "TODO",
      },
    });

    return {
      success: true,
      error: false,
      message: "อัปเดต Progress สำเร็จ",
      data: { progress },
    };
  } catch (error: any) {
    console.error("updateTaskV2Progress error:", error);
    return {
      success: false,
      error: true,
      message: error.message || "อัปเดตไม่สำเร็จ",
    };
  }
}

/* ====================================================== */
/* CREATE CHECKLIST AS SUBTASKS (task_detail)             */
/* ====================================================== */
export async function createV2ChecklistAsSubtasks(
  taskId: number,
  projectId: number,
  organizationId: number,
  checklist: { name: string; progressPercent: number }[]
): Promise<ActionState> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: true, message: "ไม่ได้เข้าสู่ระบบ" };
    }

    const data = checklist.map((item, index) => ({
      detailName: item.name,
      detailDesc: "",
      status: false,
      weightPercent: item.progressPercent,
      progressPercent: 0,
      sortOrder: index,
      taskId,
      projectId,
      organizationId,
    }));

    await prisma.task_detail.createMany({ data });

    return {
      success: true,
      error: false,
      message: "สร้าง Checklist สำเร็จ",
    };
  } catch (error: any) {
    console.error("createV2ChecklistAsSubtasks error:", error);
    return {
      success: false,
      error: true,
      message: error.message || "สร้าง Checklist ไม่สำเร็จ",
    };
  }
}
