"use client";

import React, {
  useEffect,
  useRef,
  useState,
  useTransition,
  useActionState
} from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Textarea,
} from "@heroui/react";
import {
  Building2,
  MapPin,
  Wallet,
  UploadCloud,
  User,
  Image as ImageIcon,
} from "lucide-react";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ProjectSchema, ProjectSchema_ } from "@/lib/formValidationSchemas";
import { createProject } from "@/lib/actions/actionProject";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { CreateProjectProps } from "@/lib/type";

export const CreateProject = ({
  isOpen,
  onOpenChange,
  organizationId,
  currentUserId,
}: CreateProjectProps) => {
  const router = useRouter();

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [coverImageUrl, setCoverImageUrl] = useState<string | undefined>(
    undefined
  );

  /**
   * ❌ ของเก่า (mock submit)
   *
   * const [isLoading, setIsLoading] = useState(false);
   *
   * const handleSubmit = (e: React.FormEvent, onClose: () => void) => {
   *   e.preventDefault();
   *   setIsLoading(true);
   *   setTimeout(() => {
   *     setIsLoading(false);
   *     onClose();
   *   }, 2000);
   * };
   */

  // ===============================
  // 🔹 REACT-HOOK-FORM
  // ===============================
  const formAddProject = useForm<ProjectSchema>({
    resolver: zodResolver(ProjectSchema_),
    defaultValues: {
      projectName: "",
      customerName: "",
      address: "",
      mapUrl: "",
      budget: 0,
      startPlanned: "",
      finishPlanned: "",
      projectDesc: "",
      coverImageUrl: "",
      createdById: currentUserId,
      organizationId: organizationId,
    },
  });

  const closeAndReset = () => {
    formAddProject.reset();
    setImagePreview(null);
    setCoverImageUrl(undefined);

    onOpenChange(false); 
  };

  const [state, formAction] = useActionState(createProject, {
    success: false,
    error: false,
    message: "",
  });

  const [isPending, startTransition] = useTransition();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImagePreview(URL.createObjectURL(file));

    setCoverImageUrl(undefined);
  };

  const onSubmit = async (dataForm: ProjectSchema, onClose: () => void) => {
    try {
      const finalData: ProjectSchema = {
        ...dataForm,
        createdById: currentUserId,
        organizationId: organizationId,
        coverImageUrl: coverImageUrl,
      };

      startTransition(() => {
        formAction(finalData);
      });

    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "เกิดข้อผิดพลาด"
      );
    }
  };

  const handledRef = useRef(false);

  useEffect(() => {
    if (state.success && !handledRef.current) {
      handledRef.current = true;

      toast.success("สร้างโครงการเรียบร้อย!");

      // เรียกครั้งเดียวพอ
      router.refresh();

      // ปิด + reset
      closeAndReset();
      return;
    }

    if (state.error && !handledRef.current) {
      handledRef.current = true;
      toast.error(state.message || "บันทึกไม่สำเร็จ");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success, state.error]);

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      scrollBehavior="inside" // ✅ ให้ Scroll แค่ Body (Header/Footer นิ่ง)
      placement="center"      // ✅ บังคับให้อยู่ตรงกลางทุกหน้าจอ
      backdrop="blur"         // ✅ พื้นหลังเบลอ
      classNames={{
        wrapper: "z-[9999]",
        base: `
            mx-4 w-full max-w-3xl      // มือถือ: มีขอบข้าง, จอใหญ่: กว้างสุด 3xl
            max-h-[90dvh]              // สูงไม่เกิน 90% ของจอ (กันล้น)
            rounded-2xl                // มุมโค้งมน
          bg-white dark:bg-[#18181b]
          shadow-2xl
        `,
        header: "border-b border-default-100 p-4 sm:p-6",
        body: "p-4 sm:p-6 gap-6",
        footer: "border-t border-default-100 p-4 sm:p-6",
        closeButton: "hover:bg-default-100 active:bg-default-200",
      }}
    >
      <ModalContent>
        {(onClose) => (
          <>
            {/* Header */}
            <ModalHeader className="flex flex-row items-center gap-3">
              <div className="p-2.5 bg-orange-50 dark:bg-orange-900/20 rounded-xl shrink-0 border border-orange-100 dark:border-orange-500/20">
                <Building2 className="text-orange-500" size={24} />
              </div>
              <div className="flex flex-col">
                <h2 className="text-lg sm:text-xl font-bold text-foreground">Create Project</h2>
                <p className="text-default-400 text-xs font-normal">สร้างโครงการใหม่</p>
              </div>
            </ModalHeader>

            {/* Body */}
            <form onSubmit={formAddProject.handleSubmit((d) => onSubmit(d, onClose))}className="flex flex-col flex-1 overflow-hidden">
              <ModalBody>

                {/* Image Upload */}
                <div className="relative group w-full h-48 sm:h-56 rounded-2xl border-2 border-dashed border-default-200 hover:border-primary transition-all bg-default-50/50 dark:bg-default-100/10 overflow-hidden cursor-pointer shrink-0">
                  <input type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 w-full h-full opacity-0 z-20 cursor-pointer" />

                  {imagePreview ? (
                    <>
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        <span className="text-white font-medium flex gap-2"><ImageIcon/> เปลี่ยนรูปภาพ</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-default-400 gap-3">
                      <div className="p-4 bg-white dark:bg-zinc-800 rounded-full shadow-sm"><UploadCloud size={32} className="text-primary"/></div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-foreground">อัปโหลดรูปหน้างาน</p>
                        <p className="text-xs">JPG, PNG ไม่เกิน 10MB</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* ✅ Mobile Responsive Grid: 
                   - grid-cols-1 (มือถือ): เรียงลงมา 
                   - sm:grid-cols-2 (แท็บเล็ต+): เรียงคู่
                */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <Input
                    isRequired label="ชื่อโครงการ" placeholder="ระบุชื่อโครงการ" labelPlacement="outside"
                    variant="bordered"
                    startContent={<Building2 className="text-default-400" size={18} />}
                    {...formAddProject.register("projectName")}
                  />
                  <Input
                    isRequired label="ชื่อลูกค้า" placeholder="ระบุชื่อลูกค้า" labelPlacement="outside"
                    variant="bordered"
                    startContent={<User className="text-default-400" size={18} />}
                    {...formAddProject.register("customerName")}
                  />
                </div>

                {/* ---------- LOCATION / BUDGET ---------- */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <Input
                    label="สถานที่" placeholder="ระบุพิกัด" labelPlacement="outside"
                    variant="bordered"
                    startContent={<MapPin className="text-default-400" size={18} />}
                    {...formAddProject.register("address")}
                  />
                  <Input
                    isRequired type="number" label="งบประมาณ" placeholder="0.00" labelPlacement="outside"
                    variant="bordered"
                    startContent={<Wallet className="text-default-400" size={18} />}
                    endContent={<span className="text-default-400 text-xs">THB</span>}
                    {...formAddProject.register("budget")}
                  />
                </div>

                {/* ---------- DATE ---------- */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <Input
                    isRequired type="date" label="เริ่มสัญญา" labelPlacement="outside" variant="bordered"
                    {...formAddProject.register("startPlanned")}
                  />
                  <Input
                    isRequired type="date" label="สิ้นสุดสัญญา" labelPlacement="outside" variant="bordered"
                    {...formAddProject.register("finishPlanned")}
                  />
                </div>

                {/* ---------- DESC ---------- */}
                <Textarea
                  label="รายละเอียด" placeholder="ระบุขอบเขตงาน..." labelPlacement="outside" variant="bordered" minRows={3}
                  {...formAddProject.register("projectDesc")}
                />

              </ModalBody>

              {/* ================= FOOTER ================= */}
              <ModalFooter className="flex flex-col-reverse sm:flex-row gap-3">
                <Button variant="light" color="danger" radius="full" onPress={closeAndReset}
                >
                  ยกเลิก
                </Button>
                <Button
                  type="submit"
                  color="primary"
                  radius="full"
                  className="w-full sm:w-auto h-12 sm:h-10 font-medium bg-black text-white dark:bg-white dark:text-black shadow-lg"
                  isLoading={isPending}
                >
                  {isPending ? "กำลังบันทึก..." : "สร้างโครงการ"}
                </Button>
              </ModalFooter>
            </form>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default CreateProject;