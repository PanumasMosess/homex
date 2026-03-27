"use server";

import prisma from "@/lib/prisma";
import { error } from "console";
import { deleteFileS3 } from "./actionIndex";

export async function getFloorPlansByProject(
  projectId: number,
  organizationId: number,
) {
  try {
    const floorPlans = await prisma.floorPlan.findMany({
      where: {
        projectId: Number(projectId),
        organizationId: Number(organizationId),
      },
      include: {
        points: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return { success: true, error: false, data: floorPlans };
  } catch (error: any) {
    console.error("❌ Error fetching floor plans:", error);
    return {
      success: false,
      error: true,
      data: "ดึงข้อมูลแปลนพื้นล้มเหลว กรุณาลองใหม่อีกครั้ง",
    };
  }
}

export async function createFloorPlan(data: {
  name: string;
  imageUrl: string;
  projectId: number;
  organizationId: number;
  userId: number;
}) {
  try {
    const newFloorPlan = await prisma.floorPlan.create({
      data: {
        name: data.name,
        imageUrl: data.imageUrl,
        projectId: data.projectId,
        organizationId: data.organizationId,
        userId: data.userId,
      },
      include: {
        points: true,
      },
    });

    return { success: true, error: false, data: newFloorPlan };
  } catch (error: any) {
    console.error("❌ Create Floor Plan Error:", error);
    return { success: false, error: true, data: "บันทึกแปลนพื้นไม่สำเร็จ" };
  }
}

export async function deleteFloorPlanAction(
  floorPlanId: number,
  imageUrl: string,
  projectId: number,
) {
  try {
    if (imageUrl) {
      const urlObj = new URL(imageUrl);
      let fileKey = urlObj.pathname.substring(1);
      if (fileKey.startsWith("homex/")) {
        fileKey = fileKey.replace("homex/", "");
      }
      await deleteFileS3(fileKey);
    }
    await prisma.floorPlan.delete({
      where: { id: floorPlanId },
    });

    return { success: true };
  } catch (error: any) {
    console.error("❌ Delete Floor Plan Error:", error);
    return {
      success: false,
      error: "ลบแปลนพื้นไม่สำเร็จ (อาจมีข้อผิดพลาดกับ S3 หรือ DB)",
    };
  }
}

// ==========================================
// 📍 1. ฟังก์ชันสร้างจุด 360
// ==========================================
export async function createPoint360Action(data: {
  title: string;
  location: string;
  thumbnail: string;
  x: number;
  y: number;
  floorPlanId: number;
  organizationId: number;
  projectId: number;
  userId: number;
}) {
  try {
    const newPoint = await prisma.point360.create({ data });
    return { success: true, data: newPoint };
  } catch (error: any) {
    console.error("❌ Create Point Error:", error);
    return { success: false, error: "บันทึกจุด 360 ไม่สำเร็จ" };
  }
}

// ==========================================
// 📍 2. ฟังก์ชันลบจุด 360 และลบไฟล์ใน S3
// ==========================================
export async function deletePoint360Action(
  pointId: number,
  thumbnail: string,
  projectId: number,
) {
  try {
    // 🚀 ลบไฟล์ใน S3 ก่อน
    if (thumbnail) {
      const urlObj = new URL(thumbnail);
      const s3Key = urlObj.pathname.substring(1);
      await deleteFileS3(s3Key);
    }

    // 🚀 ลบข้อมูลใน Database
    await prisma.point360.delete({ where: { id: pointId } });

    return { success: true };
  } catch (error: any) {
    console.error("❌ Delete Point Error:", error);
    return { success: false, error: "ลบจุด 360 ไม่สำเร็จ" };
  }
}
