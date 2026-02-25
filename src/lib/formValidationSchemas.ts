import z from "zod";

export const signInSchema_ = z.object({
  username: z.string().min(1, { message: "กรุณากรอก Username" }).max(50),
  passwordHash: z.string().min(1, { message: "กรุณากรอกรหัสผ่าน" }).max(50),
});
export type SignInSchema = z.infer<typeof signInSchema_>;

export const ProjectSchema_ = z.object({
  id: z.number().optional(),

  projectName: z.string().min(1, { message: "กรุณากรอกชื่อโครงการ" }).max(255),
  customerName: z.string().min(1, { message: "กรุณากรอกชื่อลูกค้า" }).max(255),

  address: z.string().optional(),
  mapUrl: z.string().optional(),

  budget: z.coerce
    .number({ invalid_type_error: "กรุณาระบุตัวเลข" })
    .min(1, "กรุณาระบุงบประมาณ (ต้องมากกว่า 0)")
    .nonnegative("งบประมาณต้องไม่ติดลบ"),

  startPlanned: z.string().optional(),
  finishPlanned: z.string().optional(),

  projectDesc: z.string().optional(),

  coverImageUrl: z.string().optional(),
  coverImageFile: z.any().optional(),

  createdById: z.coerce.number().min(1, "ต้องมี ID ผู้สร้าง"),
  organizationId: z.coerce.number().min(1, "ต้องมีบริษัท"),
});
export type ProjectSchema = z.infer<typeof ProjectSchema_>;

export const MainTaskSchema_ = z.object({
  id: z.number().optional(),
  taskName: z.string().min(1, { message: "กรุณากรอกชื่อหัวข้อ/งาน" }).max(191),
  taskDesc: z.string().optional(),
  status: z.string().optional(),
  progressPercent: z.coerce
    .number()
    .min(0, "ความคืบหน้าต้องไม่ต่ำกว่า 0%")
    .max(100, "ความคืบหน้าต้องไม่เกิน 100%")
    .default(0)
    .optional(),
  startPlanned: z.string().optional(),
  finishPlanned: z.string().optional(),
  startActual: z.string().optional(),
  finishActual: z.string().optional(),
  durationDays: z.coerce.number().optional(),
  coverImageUrl: z.string().optional(),
  coverImageFile: z.any().optional(),
  projectId: z.number().optional(),
  createdById: z.coerce.number().min(1, "ต้องมี ID ผู้สร้าง"),
  organizationId: z.coerce.number().min(1, "ต้องมีบริษัท"),
});

export type MainTaskSchema = z.infer<typeof MainTaskSchema_>;

export const SubTaskSchema_ = z.object({
  id: z.number().optional(),
  detailName: z
    .string()
    .min(1, { message: "กรุณากรอกชื่อรายการย่อย" })
    .max(191),
  detailDesc: z.string().optional(),
  status: z.boolean().default(false).optional(),
  weightPercent: z.coerce
    .number()
    .min(0, "น้ำหนักต้องไม่ต่ำกว่า 0%")
    .max(100, "น้ำหนักต้องไม่เกิน 100%")
    .default(0)
    .optional(),

  progressPercent: z.coerce
    .number()
    .min(0, "ความคืบหน้าต้องไม่ต่ำกว่า 0%")
    .max(100, "ความคืบหน้าต้องไม่เกิน 100%")
    .default(0)
    .optional(),

  startPlanned: z.string().optional(),
  finishPlanned: z.string().optional(),
  startActual: z.string().optional(),
  finishActual: z.string().optional(),
  durationDays: z.coerce.number().optional(),

  sortOrder: z.coerce.number().default(0).optional(),

  organizationId: z.coerce.number().min(1, "ต้องมี ID บริษัท"),
  projectId: z.coerce.number().min(1, "ต้องมี ID โครงการ"),
  taskId: z.coerce.number().min(1, "ต้องมี ID งานหลัก (Task)"),
});

export type SubTaskSchema = z.infer<typeof SubTaskSchema_>;

export const EmployeeSchema_ = z.object({
  id: z.number().optional(),
  username: z.string().min(1, { message: "กรุณากรอก Username" }).max(50),
  password: z.string().min(1, { message: "กรุณากรอกรหัสผ่าน" }),
  displayName: z.string().optional(),
  phone: z.string().optional(),
  email: z
    .union([
      z.string().email({ message: "รูปแบบ Email ไม่ถูกต้อง" }),
      z.literal(""),
    ])
    .optional(),
  address: z.string().optional(),
  note: z.string().optional(),
  positionId: z.coerce
    .number({ invalid_type_error: "กรุณาเลือกตำแหน่ง" })
    .min(1, { message: "กรุณาเลือกตำแหน่ง" }),
  imageUrl: z.string().optional(),
});

export type EmployeeSchema = z.infer<typeof EmployeeSchema_>;

export const CustomerSchema_ = z.object({
  id: z.number().optional(),
  username: z.string().min(1, { message: "กรุณากรอก Username" }).max(50),
  password: z.string().min(1, { message: "กรุณากรอกรหัสผ่าน" }),
  displayName: z.string().optional(),
  phone: z.string().optional(),
  email: z
    .union([
      z.string().email({ message: "รูปแบบ Email ไม่ถูกต้อง" }),
      z.literal(""),
    ])
    .optional(),
  address: z.string().optional(),
  note: z.string().optional(),
  imageUrl: z.string().optional(),
});

export type CustomerSchema = z.infer<typeof CustomerSchema_>;