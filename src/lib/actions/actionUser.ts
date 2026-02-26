"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

import {
  ActionState,
  CreateEmployeeData,
  CreateCustomerData,
} from "@/lib/type";

export async function createEmployee(
  _prevState: ActionState,
  data: CreateEmployeeData,
): Promise<ActionState> {
  try {
    const session = await auth();
    const organizationId = Number(session?.user.organizationId);

    if (!organizationId) {
      return { success: false, error: true, message: "ไม่พบ organization" };
    }

    if (!data.username || !data.password) {
      return {
        success: false,
        error: true,
        message: "กรอก username และ password",
      };
    }

    const hash = await bcrypt.hash(data.password, 10);
    console.log("CREATE DATA:", data);
    await prisma.user.create({
      data: {
        username: data.username,
        passwordHash: hash,
        displayName: data.displayName ?? null,
        phone: data.phone ?? null,
        email: data.email ?? null,
        address: data.address ?? null,
        note: data.note ?? null,
        avatarUrl:
          data.avatarUrl && data.avatarUrl !== "$undefined"
            ? data.avatarUrl
            : null,
        organizationId,
        positionId: data.positionId,
      },
    });

    revalidatePath("/user");

    return { success: true, error: false };
  } catch (e: any) {
    console.log("ERROR CODE:", e.code);
    console.log("ERROR META:", e.meta);

    // 🔥 ดัก unique username เท่านั้น
    if (
      e.code === "P2002" &&
      e.meta?.target &&
      (Array.isArray(e.meta.target)
        ? e.meta.target.includes("username")
        : String(e.meta.target).includes("username"))
    ) {
      return {
        success: false,
        error: true,
        message: "Username นี้ถูกใช้แล้ว",
      };
    }

    return {
      success: false,
      error: true,
      message: "ไม่สามารถสร้างพนักงานได้",
    };
  }
}

export async function createCustomer(
  _prevState: ActionState,
  data: CreateCustomerData,
): Promise<ActionState> {
  try {
    const session = await auth();
    const organizationId = session?.user.organizationId;

    if (!organizationId) {
      return { success: false, error: true, message: "ไม่พบ organization" };
    }

    // 🔥 หา position "ลูกค้า" ในองค์กร
    const customerPosition = await prisma.position.findFirst({
      where: {
        positionName: "ลูกค้า",
        organizationId,
      },
      select: { id: true },
    });

    if (!customerPosition) {
      return {
        success: false,
        error: true,
        message: "ไม่พบตำแหน่งลูกค้าในระบบ",
      };
    }

    const hash = await bcrypt.hash(data.password, 10);

    await prisma.user.create({
      data: {
        username: data.username,
        passwordHash: hash,
        displayName: data.displayName ?? null,
        phone: data.phone ?? null,
        email: data.email ?? null,
        address: data.address ?? null,
        note: data.note ?? null,
        avatarUrl:
          data.avatarUrl && data.avatarUrl !== "$undefined"
            ? data.avatarUrl
            : null,
        organizationId,
        positionId: customerPosition.id,
      },
    });

    revalidatePath("/user");

    return { success: true, error: false };
  } catch (e: any) {
    console.log("ERROR CODE:", e.code);
    console.log("ERROR META:", e.meta);

    // 🔥 ดักเฉพาะ username ซ้ำ
    if (
      e.code === "P2002" &&
      (e.meta?.target?.includes("username") ||
        e.meta?.target === "user_username_key")
    ) {
      return {
        success: false,
        error: true,
        message: "Username นี้ถูกใช้แล้ว",
      };
    }

    // error อื่น
    return {
      success: false,
      error: true,
      message: "ไม่สามารถสร้างลูกค้าได้",
    };
  }
}
