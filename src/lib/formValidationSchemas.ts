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
