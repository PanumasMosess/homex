import prisma from "@/lib/prisma";
import MainPageProject from "@/components/projects/MainPageProject";
import { Metadata } from "next";
import { auth } from "@/auth";

export const metadata: Metadata = {
  title: "Projects",
};

const Project = async () => {
  const session = await auth();
  const currentUserId = session?.user?.id ? parseInt(session.user.id) : 0;
  const organizationId = session?.user.organizationId ?? 0;

  // ดึงข้อมูลจริงจาก DB
  const projects = await prisma.project.findMany({
    where: {
      organizationId: organizationId,
      status: { not: "DELETED" },
    },
    orderBy: { id: "desc" },
    // select ตามที่หน้า UI ต้องใช้
    select: {
      id: true,
      projectCode: true,
      projectName: true,
      customerName: true,
      address: true,
      status: true,
      progressPercent: true,
      startPlanned: true,
      finishPlanned: true,
      coverImageUrl: true,
      durationDays: true,
      budget: true,
      mapUrl: true,
      startActual: true,
    },
  });

  // แปลงรูปแบบให้ตรงกับ UI เดิม (projects mock)
  const uiProjects = projects.map((p) => ({
    id: p.id,
    name: p.projectName,
    client: p.customerName ?? "-",
    address: p.address ?? "-",
    status: p.status ?? "PLANNING",
    progress: p.progressPercent ?? 0,
    // dueDate: p.finishPlanned
    //   ? new Date(p.finishPlanned).toLocaleDateString("en-GB", {
    //     day: "2-digit",
    //     month: "short",
    //     year: "numeric",
    //   })
    //   : "-",
    image:
      p.coverImageUrl ??
      "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=2070&auto=format&fit=crop",
    budget: p.budget ? p.budget.toNumber() : null,
    startPlanned: p.startPlanned ?? null,
    finishPlanned: p.finishPlanned ?? null,
    durationDays: p.durationDays ?? null,
    startActual: p.startActual ?? null,
    mapUrl: p.mapUrl ?? null,
    projectsCode: p.projectCode ?? "",
    customerName: p.customerName ?? "",
  }));

  return (
    <MainPageProject
      organizationId={organizationId}
      currentUserId={currentUserId}
      projects={uiProjects}
    ></MainPageProject>
  );
};

export default Project;
