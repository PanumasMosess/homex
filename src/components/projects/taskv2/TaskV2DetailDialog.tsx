"use client";

import { useState, useCallback } from "react";
import {
  Modal,
  ModalContent,
  ModalBody,
  Chip,
  Progress,
} from "@heroui/react";
import {
  FileText,
  ShoppingCart,
  CheckSquare,
  Clock,
  CalendarDays,
} from "lucide-react";
import type {
  TaskV2DetailDialogProps,
  TaskV2ChecklistItem,
} from "@/lib/type";
import TaskV2CardTab from "./TaskV2CardTab";
import TaskV2ProcurementTab from "./TaskV2ProcurementTab";
import TaskV2QCFieldTab from "./TaskV2QCFieldTab";

type V2Tab = "card" | "prpo" | "qcfield";

const TaskV2DetailDialog = ({
  task,
  aiData,
  isOpen,
  onClose,
  projectInfo,
  onChecklistChange,
  onReorderChecklist,
  onEditSubtask,
  onAddToProcurement,
}: TaskV2DetailDialogProps) => {
  const [activeTab, setActiveTab] = useState<V2Tab>("card");

  const handleChecklistToggle = useCallback(
    (index: number) => {
      if (!aiData?.checklist) return;
      const updated: TaskV2ChecklistItem[] = aiData.checklist.map((item, i) =>
        i === index ? { ...item, checked: !item.checked } : item
      );
      onChecklistChange(updated, index);
    },
    [aiData, onChecklistChange]
  );

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case "TODO":
        return "default";
      case "PROGRESS":
        return "primary";
      case "DONE":
        return "success";
      default:
        return "default";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status?.toUpperCase()) {
      case "TODO":
        return "To Do (รอเริ่มงาน)";
      case "PROGRESS":
        return "Doing (กำลังดำเนินการ)";
      case "DONE":
        return "Done (เสร็จแล้ว)";
      default:
        return status;
    }
  };

  const tabs = [
    {
      key: "card" as V2Tab,
      label: "ข้อมูลการ์ด (Task Card)",
      icon: <FileText size={16} />,
    },
    {
      key: "prpo" as V2Tab,
      label: "ระบบจัดซื้อ (PR/PO)",
      icon: <ShoppingCart size={16} />,
    },
    {
      key: "qcfield" as V2Tab,
      label: "อัปเดตหน้างาน (QC Field)",
      icon: <CheckSquare size={16} />,
    },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
          setActiveTab("card");
        }
      }}
      isDismissable={false}
      isKeyboardDismissDisabled={true}
      size="4xl"
      placement="center"
      scrollBehavior="inside"
      classNames={{
        base: "max-h-[92vh] md:max-h-[88vh] rounded-2xl mx-2 sm:mx-auto overflow-hidden",
        closeButton:
          "top-3 right-3 bg-default-100 hover:bg-default-200 z-50",
        body: "p-0",
      }}
    >
      <ModalContent className="flex flex-col overflow-hidden bg-[#0f1117] text-white">
        {task && (
          <ModalBody className="overflow-y-auto scrollbar-hide flex-1 mt-2">
            {/* ===== HEADER ===== */}
            <div className="p-4 sm:p-6 space-y-3 border-b border-zinc-800">
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0 space-y-1">
                  <p className="text-xs text-zinc-400 flex items-center gap-1.5">
                    <CalendarDays size={12} />
                    {aiData?.phase || "—"} / {projectInfo.code}
                  </p>
                  <h2 className="text-lg sm:text-xl font-bold leading-tight break-words">
                    {task.taskName || "Untitled"}
                  </h2>
                  <p className="text-xs text-zinc-500">
                    Project: {projectInfo.name} ({projectInfo.code})
                  </p>
                </div>
                <Chip
                  color={getStatusColor(task.status)}
                  variant="flat"
                  size="sm"
                  className="shrink-0"
                  startContent={<Clock size={12} />}
                >
                  {getStatusLabel(task.status)}
                </Chip>
              </div>

              <div className="space-y-1 pt-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400">
                    ความคืบหน้าของงาน (อัปเดตจาก Checklist)
                  </span>
                  <span className="text-primary font-bold">
                    {task.progressPercent || 0}%
                  </span>
                </div>
                <Progress
                  value={task.progressPercent || 0}
                  color="primary"
                  size="sm"
                  className="w-full"
                />
              </div>
            </div>

            {/* ===== TAB NAVIGATION ===== */}
            <div className="px-4 sm:px-6 pt-4">
              <div className="flex gap-2 flex-wrap">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      activeTab === tab.key
                        ? "bg-primary text-white shadow-md"
                        : "bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                    }`}
                  >
                    {tab.icon}
                    <span className="hidden sm:inline">{tab.label}</span>
                    <span className="sm:hidden">
                      {tab.label.split("(")[0].trim()}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* ===== TAB CONTENT ===== */}
            <div className="p-4 sm:p-6">
              {!aiData ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                  <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center">
                    <FileText size={20} className="text-zinc-500" />
                  </div>
                  <p className="text-zinc-400 text-sm font-medium">
                    ยังไม่มีข้อมูล AI สำหรับงานนี้
                  </p>
                  <p className="text-zinc-600 text-xs max-w-xs">
                    งานที่สร้างด้วยระบบ V2 จะมีข้อมูลประมาณการต้นทุน ความเสี่ยง
                    และ Checklist จาก AI อัตโนมัติ
                  </p>
                </div>
              ) : (
                <>
                  {activeTab === "card" && <TaskV2CardTab aiData={aiData} />}
                  {activeTab === "prpo" && (
                    <TaskV2ProcurementTab
                      materials={aiData.materials}
                      taskId={task?.id}
                      onAddToProcurement={onAddToProcurement}
                    />
                  )}
                  {activeTab === "qcfield" && (
                    <TaskV2QCFieldTab
                      checklist={aiData.checklist}
                      taskName={task.taskName || ""}
                      onToggle={handleChecklistToggle}
                      onReorder={onReorderChecklist}
                      onEditSubtask={onEditSubtask}
                    />
                  )}
                </>
              )}
            </div>
          </ModalBody>
        )}
      </ModalContent>
    </Modal>
  );
};

export default TaskV2DetailDialog;
