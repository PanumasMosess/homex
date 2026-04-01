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
  Progress,
} from "@heroui/react";
import { ClipboardList, Sparkles, Check, Loader2 } from "lucide-react";
import Image from "next/image";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import type { CreateTaskV2ModalProps } from "@/lib/type";
import { createTaskV2, saveTaskV2AiData, createV2ChecklistAsSubtasks } from "@/lib/actions/actionTaskV2";
import { generateTaskV2Analysis } from "@/lib/ai/taskV2AI";
import { generationImage } from "@/lib/ai/geminiAI";

const AI_STEPS = [
  { label: "สร้างรูปภาพปกงาน" },
  { label: "บันทึกข้อมูลงานลงระบบ" },
  { label: "AI วิเคราะห์งบประมาณ ระยะเวลา & ความเสี่ยง" },
  { label: "บันทึกผลวิเคราะห์ AI" },
  { label: "สร้าง Checklist ขั้นตอนการทำงาน" },
];

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
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [isPending, startTransition] = useTransition();

  const aiProgress = currentStepIndex < 0 ? 0 : Math.min(Math.round(((currentStepIndex + 1) / AI_STEPS.length) * 100), 100);

  const handleCreate = async () => {
    if (!taskName.trim()) {
      toast.warning("กรุณากรอกชื่องาน");
      return;
    }

    setIsCreating(true);
    setCurrentStepIndex(0);

    try {
      // Step 0: Generate cover image (non-blocking — fail gracefully)
      let coverUrl = "";
      try {
        const imgRes = await generationImage(taskName);
        coverUrl = imgRes?.answer || "";
      } catch {
        // Image generation failed — continue without cover image
      }

      // Step 1: Create task in DB
      setCurrentStepIndex(1);
      const taskRes = await createTaskV2(
        taskName,
        projectId,
        organizationId,
        coverUrl
      );

      if (!taskRes.success || !taskRes.taskId) {
        throw new Error(taskRes.message || "สร้างงานไม่สำเร็จ");
      }

      // Step 2: AI Analysis (budget, duration & risk)
      setCurrentStepIndex(2);
      const aiData = await generateTaskV2Analysis(taskName);

      if (aiData) {
        // Step 3: Save AI data
        setCurrentStepIndex(3);
        await saveTaskV2AiData(taskRes.taskId, aiData);

        // Step 4: Create checklist as subtasks
        if (aiData.checklist && aiData.checklist.length > 0) {
          setCurrentStepIndex(4);
          await createV2ChecklistAsSubtasks(
            taskRes.taskId,
            projectId,
            organizationId,
            aiData.checklist
          );
        }
      } else {
        toast.warning("AI วิเคราะห์ไม่สำเร็จ — งานถูกสร้างแล้วแต่ยังไม่มีข้อมูล AI");
      }

      setCurrentStepIndex(AI_STEPS.length);
      toast.success("สร้างงานและวิเคราะห์ข้อมูล AI สำเร็จ!");

      startTransition(() => {
        router.refresh();
      });

      setTaskName("");
      setCurrentStepIndex(-1);
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "เกิดข้อผิดพลาดในการสร้างงาน");
    } finally {
      setIsCreating(false);
      setCurrentStepIndex(-1);
    }
  };

  const handleClose = () => {
    if (isCreating) return;
    setTaskName("");
    setCurrentStepIndex(-1);
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
                {isCreating ? "AI กำลังวิเคราะห์งาน" : "สร้าง Task"}
              </h2>
              <p className="text-default-400 text-xs font-normal text-center">
                {isCreating ? "กรุณาอย่าปิดหน้าต่างนี้" : `ใส่ชื่องาน → AI วิเคราะห์ข้อมูลให้อัตโนมัติ (CODE: ${projectCode})`}
              </p>
            </ModalHeader>

            <ModalBody>
              {!isCreating ? (
                <>
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
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !isBusy) handleCreate();
                    }}
                  />

                  <div className="p-3 bg-default-50 dark:bg-zinc-800/50 rounded-xl text-xs text-default-500 space-y-1">
                    <p className="font-semibold text-default-600">AI จะวิเคราะห์ให้อัตโนมัติ:</p>
                    <p>• ประเมินงบประมาณ (ค่าวัสดุ / ค่าแรง / ค่าเครื่องจักร)</p>
                    <p>• ระยะเวลาดำเนินงาน</p>
                    <p>• ความเสี่ยงและแนวทางป้องกัน</p>
                    <p>• Checklist ขั้นตอนการทำงาน</p>
                    <p>• รายการวัสดุสำหรับจัดซื้อ</p>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center space-y-5 py-4">
                  {/* Progress bar */}
                  <div className="w-full max-w-xs space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-default-400">กำลังดำเนินการ...</span>
                      <span className="font-bold text-primary">{aiProgress}%</span>
                    </div>
                    <Progress value={aiProgress} color="primary" size="sm" />
                  </div>

                  {/* Step list */}
                  <div className="w-full max-w-xs space-y-2">
                    {AI_STEPS.map((s, i) => {
                      const isDone = currentStepIndex > i;
                      const isActive = currentStepIndex === i;
                      if (currentStepIndex < i) return null;

                      return (
                        <div
                          key={i}
                          className="flex items-center gap-2.5 animate-in fade-in slide-in-from-left-2"
                          style={{ animationDuration: "300ms" }}
                        >
                          {isDone ? (
                            <div className="w-5 h-5 rounded-full bg-success/20 flex items-center justify-center shrink-0">
                              <Check size={12} className="text-success" />
                            </div>
                          ) : isActive ? (
                            <div className="w-5 h-5 flex items-center justify-center shrink-0">
                              <Loader2 size={14} className="text-primary animate-spin" />
                            </div>
                          ) : null}
                          <span
                            className={`text-xs ${
                              isDone
                                ? "text-success"
                                : isActive
                                ? "text-primary font-medium"
                                : "text-default-400"
                            }`}
                          >
                            {s.label}
                          </span>
                        </div>
                      );
                    })}

                    {currentStepIndex >= AI_STEPS.length && (
                      <div
                        className="flex items-center gap-2.5 animate-in fade-in slide-in-from-left-2"
                        style={{ animationDuration: "300ms" }}
                      >
                        <div className="w-5 h-5 rounded-full bg-success/20 flex items-center justify-center shrink-0">
                          <Check size={12} className="text-success" />
                        </div>
                        <span className="text-xs font-medium text-success">
                          ดำเนินการเสร็จสิ้น!
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
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
              {!isCreating && (
                <Button
                  color="primary"
                  radius="full"
                  className="w-full h-12 sm:h-10 font-medium bg-black text-white dark:bg-white dark:text-black shadow-lg"
                  isLoading={isBusy}
                  onPress={handleCreate}
                >
                  สร้าง Task
                </Button>
              )}
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default CreateTaskV2Modal;
