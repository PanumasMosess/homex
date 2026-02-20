import { auth } from "@/auth";
import ProjectDetail from "@/components/projects/ProjectDetail";
import prisma from "@/lib/prisma";

const Page = async () => {
  const session = await auth();

  const currentUserId = session?.user?.id ? parseInt(session.user.id) : 0;
  const organizationId = session?.user.organizationId ?? 0;

  const mainTasks = await prisma.task.findMany({
    where: {
      organizationId: organizationId,
      status: { not: "DELETED" },
    },
    orderBy: { id: "desc" },
    select: {
      id: true,
      taskName: true,
      taskDesc: true,
      status: true,
      progressPercent: true,
      coverImageUrl: true,
      startPlanned: true,
      finishPlanned: true,
      durationDays: true,
      startActual: true,
      finishActual: true,
      createdAt: true,
      updatedAt: true,
      projectId: true,
      organizationId: true,
      createdById: true,
      details: true,
    },
  });

  return (
    <ProjectDetail
      organizationId={organizationId}
      currentUserId={currentUserId}
      dataDetail={mainTasks}
    />
  );
};

export default Page;
