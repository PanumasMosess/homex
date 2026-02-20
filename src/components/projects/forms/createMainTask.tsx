"use client";

import {
  useRef,
  useTransition,
  useActionState,
  useEffect,
  useState,
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
  Select,
  SelectItem,
} from "@heroui/react";
import {
  ClipboardList,
  CalendarDays,
  CheckCircle2,
  AlertCircle,
  Clock,
  User, // 🌟 เพิ่ม import User icon
} from "lucide-react";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MainTaskSchema, MainTaskSchema_ } from "@/lib/formValidationSchemas";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { CreateMainTaskProps } from "@/lib/type";
import { generationImage } from "@/lib/ai/geminiAI";
import { createMainTask } from "@/lib/actions/actionProject";

const CreateMainTask = ({
  isOpen,
  onOpenChange,
  projectId,
  organizationId,
  currentUserId,
  projectCode,
}: CreateMainTaskProps) => {
  const router = useRouter();
  const isSuccessRef = useRef(false);
  const [isCreateTask, setIsCreateTask] = useState(false);
  const [isPending, startTransition] = useTransition();
  
  // State สำหรับเก็บจำนวนวันที่คาดว่าจะใช้
  const [durationDays, setDurationDays] = useState<number | "">("");

  const formAddTask = useForm<MainTaskSchema>({
    resolver: zodResolver(MainTaskSchema_),
    defaultValues: {
      taskName: "",
      taskDesc: "",
      status: "TODO",
      progressPercent: 0,
      startPlanned: "",
      finishPlanned: "",
      coverImageUrl: "",
      createdById: Number(currentUserId) || 0,
      organizationId: Number(organizationId) || 0,
      projectId: Number(projectId) || 0,
    },
  });

  const startPlannedValue = formAddTask.watch("startPlanned");

  useEffect(() => {
    if (startPlannedValue && durationDays) {
      const startDate = new Date(startPlannedValue);
      startDate.setDate(startDate.getDate() + Number(durationDays));
      const finishStr = startDate.toISOString().split("T")[0];
      
      formAddTask.setValue("finishPlanned", finishStr, { shouldValidate: true });
    } else {
      formAddTask.setValue("finishPlanned", "");
    }
  }, [startPlannedValue, durationDays, formAddTask]);

  const resetFormState = () => {
    formAddTask.reset();
    setDurationDays(""); 
    isSuccessRef.current = false;
  };

  const handleModalClose = () => {
    if (isSuccessRef.current) {
      onOpenChange(false);
      resetFormState();
      return;
    }
    resetFormState();
    onOpenChange(false);
  };

  const [state, formAction] = useActionState(createMainTask, {
    success: false,
    error: false,
  });

  useEffect(() => {
    const handled = isSuccessRef.current;

    if (state.success && !handled) {
      toast.success("บันทึกงานใหม่เรียบร้อย!");
      router.refresh();
      isSuccessRef.current = true;
      handleModalClose();
    } else if (state.error && !handled) {
      toast.error(state.message || "บันทึกไม่สำเร็จ");
    }
  }, [state.success, state.error]);

  const onSubmit = async (dataForm: MainTaskSchema) => {
    // ดักเช็คเผื่อคนกรอกจำนวนวัน แต่ลืมใส่วันเริ่ม
    if (!dataForm.startPlanned || !dataForm.finishPlanned) {
      toast.warning("กรุณาระบุวันเริ่มงานและระยะเวลาให้ครบถ้วน");
      return;
    }

    setIsCreateTask(true);
    try {
      const url = await generationImage(dataForm.taskName);
      
      const finalData: MainTaskSchema = {
        ...dataForm,
        createdById: Number(currentUserId) || 0,
        organizationId: Number(organizationId) || 0,
        projectId: Number(projectId) || 0,
        progressPercent: Number(dataForm.progressPercent) || 0,
        coverImageUrl: url?.answer || "",
      };

      startTransition(() => {
        formAction(finalData);
        setIsCreateTask(false);
      });
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการเตรียมข้อมูล");
      setIsCreateTask(false);
    }
  };

  const onError = (errors: any) => {
    console.error("⚠️ Form Validation Errors:", errors);
    toast.warning("กรุณากรอกข้อมูลให้ครบถ้วน");
  };

  const isBusy = isPending || isCreateTask;
  const errors = formAddTask.formState.errors;

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) handleModalClose();
        else onOpenChange(true);
      }}
      scrollBehavior="inside"
      placement="center"
      backdrop="blur"
      isDismissable={false}
      hideCloseButton={isBusy}
      classNames={{
        wrapper: "z-[9999]",
        base: `mx-4 w-full max-w-2xl max-h-[90dvh] rounded-2xl bg-white dark:bg-[#18181b] shadow-2xl`,
        header: "border-b border-default-100 p-4 sm:p-6",
        body: "p-4 sm:p-6 gap-6",
        footer: "border-t border-default-100 p-4 sm:p-6",
        closeButton: "hover:bg-default-100 active:bg-default-200",
      }}
    >
      <ModalContent>
        {(onClose) => (
          <>
            {/* --- HEADER --- */}
            <ModalHeader className="flex flex-row items-center gap-3">
              <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-xl shrink-0 border border-blue-100 dark:border-blue-500/20">
                <ClipboardList className="text-blue-500" size={24} />
              </div>
              <div className="flex flex-col">
                <h2 className="text-lg sm:text-xl font-bold text-foreground">
                  Create New Task
                </h2>
                <p className="text-default-400 text-xs font-normal">
                  เพิ่มรายการงานใหม่ (Project CODE: {projectCode})
                </p>
              </div>
            </ModalHeader>

            {/* --- FORM --- */}
            <form
              onSubmit={formAddTask.handleSubmit(
                (data) => onSubmit(data),
                onError,
              )}
              className="flex flex-col flex-1 overflow-hidden"
            >
              <ModalBody>
                {/* 1. Task Name */}
                <Input
                  isRequired
                  label="ชื่อหัวข้อ/งาน"
                  placeholder="เช่น งานวางฐานราก, งานระบบไฟฟ้า"
                  labelPlacement="outside"
                  variant="bordered"
                  isInvalid={!!errors.taskName}
                  errorMessage={errors.taskName?.message}
                  startContent={
                    <ClipboardList className="text-default-400" size={18} />
                  }
                  {...formAddTask.register("taskName")}
                />

                {/* 2. Status & Progress (Row) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <Select
                    label="สถานะงาน"
                    placeholder="เลือกสถานะ"
                    labelPlacement="outside"
                    variant="bordered"
                    defaultSelectedKeys={["TODO"]}
                    startContent={
                      <AlertCircle className="text-default-400" size={18} />
                    }
                    {...formAddTask.register("status")}
                  >
                    <SelectItem key="TODO">To Do (รอเริ่ม)</SelectItem>
                    <SelectItem key="PROGRESS">
                      In Progress (กำลังทำ)
                    </SelectItem>
                    <SelectItem key="DONE">Done (เสร็จสิ้น)</SelectItem>
                  </Select>

                  <Input
                    type="number"
                    label="ความคืบหน้า (%)"
                    placeholder="0"
                    labelPlacement="outside"
                    variant="bordered"
                    min={0}
                    max={100}
                    endContent={
                      <span className="text-default-400 text-xs">%</span>
                    }
                    isInvalid={!!errors.progressPercent}
                    errorMessage={errors.progressPercent?.message}
                    startContent={
                      <CheckCircle2 className="text-default-400" size={18} />
                    }
                    {...formAddTask.register("progressPercent", {
                      valueAsNumber: true,
                    })}
                  />
                </div>

                {/* 3. Dates (Row) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <Input
                    type="date"
                    isRequired
                    label="แผนวันเริ่มงาน"
                    labelPlacement="outside"
                    variant="bordered"
                    isInvalid={!!errors.startPlanned}
                    errorMessage={errors.startPlanned?.message}
                    startContent={
                      <CalendarDays className="text-default-400" size={18} />
                    }
                    {...formAddTask.register("startPlanned")}
                  />
                  
                  <Input
                    type="number"
                    isRequired
                    label="จำนวนวันทำงาน (วัน)"
                    placeholder="เช่น 7, 14, 30"
                    labelPlacement="outside"
                    variant="bordered"
                    min={1}
                    value={durationDays.toString()}
                    onValueChange={(val) => setDurationDays(val ? Number(val) : "")}
                    isInvalid={!!errors.finishPlanned}
                    errorMessage={errors.finishPlanned?.message}
                    startContent={
                      <Clock className="text-default-400" size={18} />
                    }
                    endContent={
                      <span className="text-default-400 text-xs">วัน</span>
                    }
                    description={
                      startPlannedValue && durationDays
                        ? `คาดว่าจะเสร็จ: ${formAddTask.getValues("finishPlanned")}`
                        : "เลือกวันเริ่มงานและใส่จำนวนวัน"
                    }
                  />
                </div>

                {/* 🌟 4. Dummy Assignee (ผู้รับผิดชอบ จำลอง) */}
                <Select
                  label="ผู้รับผิดชอบ (จำลอง)"
                  placeholder="เลือกผู้รับผิดชอบ"
                  labelPlacement="outside"
                  variant="bordered"
                  startContent={<User className="text-default-400" size={18} />}
                >
                  <SelectItem key="somchai">สมชาย (หัวหน้าช่าง)</SelectItem>
                  <SelectItem key="somying">สมหญิง (แอดมินโครงการ)</SelectItem>
                </Select>

                {/* 5. Description */}
                <Textarea
                  label="รายละเอียดเพิ่มเติม"
                  placeholder="รายละเอียดเนื้องาน, หมายเหตุ..."
                  labelPlacement="outside"
                  variant="bordered"
                  minRows={3}
                  {...formAddTask.register("taskDesc")}
                />
              </ModalBody>

              {/* --- FOOTER --- */}
              <ModalFooter className="flex flex-col-reverse sm:flex-row gap-3">
                <Button
                  variant="light"
                  color="danger"
                  radius="full"
                  onPress={handleModalClose}
                  isDisabled={isBusy}
                >
                  ยกเลิก
                </Button>
                <Button
                  type="submit"
                  color="primary"
                  radius="full"
                  className="w-full sm:w-auto h-12 sm:h-10 font-medium bg-black text-white dark:bg-white dark:text-black shadow-lg"
                  isLoading={isBusy}
                >
                  {isCreateTask ? "กำลังบันทึก..." : "สร้าง Task"}
                </Button>
              </ModalFooter>
            </form>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default CreateMainTask;