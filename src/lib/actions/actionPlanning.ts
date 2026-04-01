"use server";

import prisma from "@/lib/prisma";

export async function getPlanningData(projectId: number) {
  try {
    const tasks = await prisma.task.findMany({
      where: {
        projectId,
        isPlanned: true,
        status: {
          not: "DELETED",
        },
      },
      orderBy: {
        orderAi: "asc",
      },
      select: {
        id: true,
        taskName: true,
        progressPercent: true,
        startAiPlanned: true,
        estimatedDurationDays: true,
        orderAi: true,
        phaseAi: true,
      },
    });

    if (!tasks.length) {
      return { success: true, data: [] };
    }

    // ✅ กัน null
    const validTasks = tasks.filter((t) => t.startAiPlanned);

    if (!validTasks.length) {
      return { success: true, data: [] };
    }

    const projectStart = new Date(
      Math.min(...validTasks.map((t) => new Date(t.startAiPlanned!).getTime())),
    );

    const mapped = validTasks.map((t) => {
      const start = new Date(t.startAiPlanned!);

      const diffDays =
        (start.getTime() - projectStart.getTime()) / (1000 * 60 * 60 * 24);

      return {
        id: t.id,
        name: t.taskName || "ไม่มีชื่อ",
        progress: t.progressPercent || 0,

        startDay: diffDays,
        durationDay: Math.max(1, t.estimatedDurationDays || 1),

        phase: t.phaseAi || "ไม่มี Phase",
        order: t.orderAi || 0,

        startDate: t.startAiPlanned,
      };
    });

    // ✅ sort (กันมั่ว)
mapped.sort((a, b) => {
  return (
    (a.order ?? 0) - (b.order ?? 0) ||
    (a.startDate?.getTime() ?? 0) - (b.startDate?.getTime() ?? 0)
  );
});

    // ✅ group phase
    const grouped: Record<string, any[]> = {};

    mapped.forEach((t) => {
      if (!grouped[t.phase]) grouped[t.phase] = [];
      grouped[t.phase].push(t);
    });

    // ✅ ใส่สี
    const colors = ["bg-emerald-500", "bg-blue-500", "bg-purple-500"];

    const ganttData = Object.keys(grouped).map((phase, i) => ({
      id: `phase-${i}`,
      title: phase,
      color: colors[i % colors.length],
      tasks: grouped[phase],
    }));

    return {
      success: true,
      data: ganttData,
    };
  } catch (error) {
    console.error("Planning Error:", error);
    return {
      success: false,
      data: [],
    };
  }
}

export async function getPlanningTasksForAI(projectId: number) {
  const tasks = await prisma.task.findMany({
    where: {
      projectId,
      status: {
        not: "DELETED",
      },
    },
    select: {
      id: true,
      taskName: true,
      estimatedDurationDays: true,
    },
  });

  return tasks.map((t) => ({
    id: t.id,
    name: t.taskName,
    estimatedDurationDays: t.estimatedDurationDays,
  }));
}

export async function getProjectStart(projectId: number) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      startPlanned: true,
    },
  });

  return project?.startPlanned ?? null;
}

export async function updatePlanningFromAI(aiData: any[]) {
  try {
    await Promise.all(
      aiData.map((item) =>
        prisma.task.update({
          where: { id: item.id },
          data: {
            orderAi: item.orderAi,
            phaseAi: item.phaseAi,
            estimatedDurationDays: item.estimatedDurationDays,
            startAiPlanned: item.startAiPlanned
              ? new Date(item.startAiPlanned)
              : null,
            isPlanned: true,
          },
        }),
      ),
    );

    return { success: true };
  } catch (error) {
    console.error("UPDATE AI ERROR:", error);
    return { success: false };
  }
}
