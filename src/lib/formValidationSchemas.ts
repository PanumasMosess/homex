import z from "zod";

export const ProjectSchema_ = z.object({
  id: z.number().optional(),

  projectName: z.string().min(1, { message: "กรุณากรอกชื่อโครงการ" }).max(255),
  customerName: z
    .string()
    .min(1, { message: "กรุณากรอกชื่อลูกค้า" })
    .max(255),

  address: z.string().optional(),
  mapUrl: z.string().optional(),

  // เงิน: ฟอร์มเป็น input number => coerce เป็น number
  budget: z.coerce.number().min(0, { message: "งบประมาณห้ามติดลบ" }),

  // date input: จะได้เป็น string (YYYY-MM-DD)
  startPlanned: z.string().optional(),
  finishPlanned: z.string().optional(),

  projectDesc: z.string().optional(),

  // รูป: ตอนนี้ยังไม่อัปโหลดจริง ก็ปล่อย any ไว้ก่อน
  coverImageUrl: z.string().optional(),
  coverImageFile: z.any().optional(),

  createdById: z.coerce.number().min(1, "ต้องมี ID ผู้สร้าง"),
  organizationId: z.coerce.number().min(1, "ต้องมีบริษัท"),
});

export type ProjectSchema = z.infer<typeof ProjectSchema_>;
