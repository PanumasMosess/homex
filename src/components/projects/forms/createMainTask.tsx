"use client";

import { useTransition, useEffect, useState } from "react";
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
  Banknote,
  AlertCircle,
  Clock,
  User,
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
  const [isCreateTask, setIsCreateTask] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [durationDays, setDurationDays] = useState<number | "">("");

  const formAddTask = useForm<MainTaskSchema>({
    resolver: zodResolver(MainTaskSchema_),
    defaultValues: {
      taskName: "",
      taskDesc: "",
      status: "TODO",
      budget: "" as unknown as number,
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

      formAddTask.setValue("finishPlanned", finishStr, {
        shouldValidate: true,
      });
    } else {
      formAddTask.setValue("finishPlanned", "");
    }
  }, [startPlannedValue, durationDays, formAddTask]);

  const resetFormState = () => {
    formAddTask.reset();
    setDurationDays("");
  };

  const handleModalClose = () => {
    resetFormState();
    onOpenChange(false);
  };

  const onSubmit = async (dataForm: any) => {
    // ใช้ any ชั่วคราวรับ budget
    if (!dataForm.startPlanned || !dataForm.finishPlanned) {
      toast.warning("กรุณาระบุวันเริ่มงานและระยะเวลาให้ครบถ้วน");
      return;
    }

    setIsCreateTask(true);
    try {
      const url = await generationImage(dataForm.taskName);

      const finalData: any = {
        ...dataForm,
        createdById: Number(currentUserId) || 0,
        organizationId: Number(organizationId) || 0,
        projectId: Number(projectId) || 0,
        progressPercent: 0, 
        budget: Number(dataForm.budget) || 0, 
        coverImageUrl: url?.answer || "",
      };

      const dummyState = { success: false, error: false, message: "" };

      startTransition(async () => {
        const res = await createMainTask(dummyState, finalData);

        if (res?.success) {
          toast.success("บันทึกงานใหม่เรียบร้อย!");
          router.refresh();
          handleModalClose();
        } else {
          toast.error(res?.message || "บันทึกไม่สำเร็จ");
        }
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

            <form
              onSubmit={formAddTask.handleSubmit(onSubmit, onError)}
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
                  </Select>

                  <Input
                    type="number"
                    label="งบประมาณ"
                    placeholder="0"
                    labelPlacement="outside"
                    variant="bordered"
                    min={0}
                    endContent={
                      <span className="text-default-400 text-xs">บาท</span>
                    }
                    isInvalid={!!errors.budget}
                    errorMessage={errors.budget?.message}
                    startContent={
                      <Banknote className="text-default-400" size={18} />
                    }
                    {...formAddTask.register("budget" as any, {
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
                    onValueChange={(val) =>
                      setDurationDays(val ? Number(val) : "")
                    }
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

                {/* 4. Dummy Assignee */}
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
