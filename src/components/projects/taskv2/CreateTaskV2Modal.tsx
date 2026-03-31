"use client";

import { useState, useTransition } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
} from "@heroui/react";
import { ClipboardList, Sparkles } from "lucide-react";
import Image from "next/image";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import type { CreateTaskV2ModalProps } from "@/lib/type";
import { createTaskV2, saveTaskV2AiData, createV2ChecklistAsSubtasks } from "@/lib/actions/actionTaskV2";
import { generateTaskV2Analysis } from "@/lib/ai/taskV2AI";
import { generationImage } from "@/lib/ai/geminiAI";

const CreateTaskV2Modal = ({
  isOpen,
  onOpenChange,
  projectId,
  organizationId,
  currentUserId,
  projectCode,
}: CreateTaskV2ModalProps) => {
  const router = useRouter();
  const [taskName, setTaskName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [step, setStep] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleCreate = async () => {
    if (!taskName.trim()) {
      toast.warning("กรุณากรอกชื่องาน");
      return;
    }

    setIsCreating(true);

    try {
      // Step 1: Generate cover image
      setStep("กำลังสร้างรูปภาพ...");
      const imgRes = await generationImage(taskName);

      // Step 2: Create task in DB
      setStep("กำลังบันทึกงาน...");
      const taskRes = await createTaskV2(
        taskName,
        projectId,
        organizationId,
        imgRes?.answer || ""
      );

      if (!taskRes.success || !taskRes.taskId) {
        throw new Error(taskRes.message || "สร้างงานไม่สำเร็จ");
      }

      // Step 3: AI Analysis
      setStep("AI กำลังวิเคราะห์งาน...");
      const aiData = await generateTaskV2Analysis(taskName);

      if (aiData) {
        // Step 4: Save AI data
        setStep("กำลังบันทึกข้อมูล AI...");
        await saveTaskV2AiData(taskRes.taskId, aiData);

        // Step 5: Create checklist as subtasks
        if (aiData.checklist && aiData.checklist.length > 0) {
          setStep("กำลังสร้าง Checklist...");
          await createV2ChecklistAsSubtasks(
            taskRes.taskId,
            projectId,
            organizationId,
            aiData.checklist
          );
        }
      }

      toast.success("สร้างงานและวิเคราะห์ข้อมูล AI สำเร็จ!");

      startTransition(() => {
        router.refresh();
      });

      setTaskName("");
      setStep("");
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "เกิดข้อผิดพลาดในการสร้างงาน");
    } finally {
      setIsCreating(false);
      setStep("");
    }
  };

  const handleClose = () => {
    if (isCreating) return;
    setTaskName("");
    setStep("");
    onOpenChange(false);
  };

  const isBusy = isCreating || isPending;

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) handleClose();
        else onOpenChange(true);
      }}
      placement="center"
      backdrop="blur"
      isDismissable={false}
      hideCloseButton={isBusy}
      classNames={{
        wrapper: "z-[9999]",
        base: "mx-4 w-full max-w-lg rounded-2xl bg-white dark:bg-[#18181b] shadow-2xl",
        header: "border-b border-default-100 p-4 sm:p-6",
        body: "p-4 sm:p-6 gap-4",
        footer: "border-t border-default-100 p-4 sm:p-6",
      }}
    >
      <ModalContent>
        {() => (
          <>
            <ModalHeader className="flex flex-col items-center gap-4 pb-4">
              <div className="flex justify-center">
                <Image
                  src="/logo.png"
                  alt="HomeX"
                  width={120}
                  height={40}
                  className="object-contain"
                />
              </div>
              <h2 className="text-lg sm:text-xl font-bold gradientText text-center">
                สร้าง Task
              </h2>
              <p className="text-default-400 text-xs font-normal text-center">
                ใส่ชื่องาน → AI วิเคราะห์ข้อมูลให้อัตโนมัติ (CODE: {projectCode})
              </p>
              <hr className="w-full border-default-100" />
            </ModalHeader>

            <ModalBody>
              <Input
                isRequired
                label="ชื่องาน"
                placeholder="เช่น งานทำหลังคา Metalsheet 0.40 พร้อม PU 50 มม. 334.00 ตร.ม."
                labelPlacement="outside"
                variant="bordered"
                value={taskName}
                onValueChange={setTaskName}
                isDisabled={isBusy}
                startContent={
                  <ClipboardList className="text-default-400" size={18} />
                }
                classNames={{
                  input: "text-sm",
                }}
              />

              {step && (
                <div className="flex items-center gap-3 p-3 bg-violet-50 dark:bg-violet-900/20 rounded-xl border border-violet-100 dark:border-violet-500/20 animate-pulse">
                  <Sparkles className="text-violet-500 animate-spin" size={18} />
                  <p className="text-sm text-violet-600 dark:text-violet-400 font-medium">
                    {step}
                  </p>
                </div>
              )}

              <div className="p-3 bg-default-50 dark:bg-zinc-800/50 rounded-xl text-xs text-default-500 space-y-1">
                <p className="font-semibold text-default-600">AI จะวิเคราะห์ให้อัตโนมัติ:</p>
                <p>• ประเมินงบประมาณ (ค่าวัสดุ / ค่าแรง / ค่าเครื่องจักร)</p>
                <p>• ระยะเวลาดำเนินงาน</p>
                <p>• ความเสี่ยงและแนวทางป้องกัน</p>
                <p>• Checklist ขั้นตอนการทำงาน</p>
                <p>• รายการวัสดุสำหรับจัดซื้อ</p>
              </div>
            </ModalBody>

            <ModalFooter className="flex flex-col-reverse sm:flex-row gap-3">
              {/* <Button
                variant="light"
                color="danger"
                radius="full"
                onPress={handleClose}
                isDisabled={isBusy}
              >
                ยกเลิก
              </Button> */}
              <Button
                color="primary"
                radius="full"
                className="w-full sm:w-auto h-12 sm:h-10 font-medium bg-black text-white dark:bg-white dark:text-black shadow-lg"
                isLoading={isBusy}
                onPress={handleCreate}
              >
                {isBusy ? step || "กำลังสร้าง..." : "สร้าง Task"}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default CreateTaskV2Modal;
