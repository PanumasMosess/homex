"use client";

import { useState, useTransition, useMemo } from "react";
import {
  Button,
  Chip,
  Tooltip,
  Input,
} from "@heroui/react";
import {
  Link2,
  Unlink,
  Sparkles,
  Check,
  X,
  Search,
  Calendar,
  CheckCircle2,
  ImageIcon,
} from "lucide-react";
import { toast } from "react-toastify";
import type { ProcurementItemData, ProcurementTaskLinkData } from "@/lib/type";
import {
  linkProcurementTask,
  unlinkProcurementTask,
  confirmProcurementTaskLink,
} from "@/lib/actions/actionProcurement";
import { suggestTasksForMaterial } from "@/lib/ai/geminiAI";

interface TaskLinkPanelProps {
  item: ProcurementItemData;
  tasks: { id: number; taskName: string | null; status: string; startPlanned: string | Date | null; coverImageUrl: string | null }[];
  onRefresh: () => void;
}


const TaskLinkPanel = ({ item, tasks, onRefresh }: TaskLinkPanelProps) => {
  const [isPending, startTransition] = useTransition();
  const [isLinking, setIsLinking] = useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<number>>(new Set());
  const [taskSearch, setTaskSearch] = useState("");
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestions, setSuggestions] = useState<
    { taskId: number; confidence: number; reason: string }[]
  >([]);

  const linkedTaskIds = new Set(item.taskLinks.map((tl) => tl.taskId));

  const availableTasks = useMemo(() => {
    let filtered = tasks.filter((t) => !linkedTaskIds.has(t.id));
    if (taskSearch.trim()) {
      const q = taskSearch.toLowerCase();
      filtered = filtered.filter(
        (t) => t.taskName?.toLowerCase().includes(q) || String(t.id).includes(q),
      );
    }
    return filtered;
  }, [tasks, linkedTaskIds, taskSearch]);

  const toggleTask = (id: number) => {
    setSelectedTaskIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleLinkSelected = async () => {
    if (selectedTaskIds.size === 0) {
      toast.warning("กรุณาเลือกอย่างน้อย 1 Task");
      return;
    }

    startTransition(async () => {
      let successCount = 0;
      for (const taskId of selectedTaskIds) {
        const res = await linkProcurementTask(item.id, taskId, "MANUAL");
        if (res.success) successCount++;
      }
      if (successCount > 0) {
        toast.success(`ผูก ${successCount} Task สำเร็จ`);
        setIsLinking(false);
        setSelectedTaskIds(new Set());
        setTaskSearch("");
        onRefresh();
      } else {
        toast.error("ผูก Task ไม่สำเร็จ");
      }
    });
  };

  const handleUnlink = async (linkId: number) => {
    startTransition(async () => {
      const res = await unlinkProcurementTask(linkId);
      if (res.success) {
        toast.success("ยกเลิกการผูก Task สำเร็จ");
        onRefresh();
      } else {
        toast.error(res.message || "ยกเลิกไม่สำเร็จ");
      }
    });
  };

  const handleConfirmLink = async (linkId: number) => {
    startTransition(async () => {
      const res = await confirmProcurementTaskLink(linkId);
      if (res.success) {
        toast.success("ยืนยัน Task link สำเร็จ");
        onRefresh();
      } else {
        toast.error(res.message || "ยืนยันไม่สำเร็จ");
      }
    });
  };

  const handleAiSuggest = async () => {
    setIsSuggesting(true);
    setSuggestions([]);
    try {
      const result = await suggestTasksForMaterial(
        item.materialName,
        item.specification || "",
        tasks.map((t) => ({ id: t.id, taskName: t.taskName, status: t.status })),
      );
      if (result.length > 0) {
        setSuggestions(result);
        toast.success(`AI แนะนำ ${result.length} Task`);
      } else {
        toast.info("AI ไม่พบ Task ที่เกี่ยวข้อง");
      }
    } catch {
      toast.error("AI แนะนำ Task ไม่สำเร็จ");
    } finally {
      setIsSuggesting(false);
    }
  };

  const handleAcceptSuggestion = async (taskId: number, confidence: number) => {
    startTransition(async () => {
      const res = await linkProcurementTask(
        item.id,
        taskId,
        "AI_SUGGESTED",
        confidence,
      );
      if (res.success) {
        toast.success("เพิ่ม Task link สำเร็จ");
        setSuggestions((prev) => prev.filter((s) => s.taskId !== taskId));
        onRefresh();
      } else {
        toast.error(res.message || "เพิ่มไม่สำเร็จ");
      }
    });
  };

  const getReadinessStatus = (tl: ProcurementTaskLinkData) => {
    const taskStart = tl.task.startPlanned
      ? new Date(tl.task.startPlanned)
      : null;
    if (!taskStart) return { label: "ไม่มีแผน", color: "default" as const };

    const now = new Date();
    const daysUntilStart = Math.ceil(
      (taskStart.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (item.status === "ARRIVED") {
      return { label: "พร้อม", color: "success" as const };
    }
    if (daysUntilStart <= 0) {
      return { label: "ล่าช้า", color: "danger" as const };
    }
    if (daysUntilStart <= (item.leadTimeDays || 7)) {
      return { label: "เสี่ยง", color: "warning" as const };
    }
    return { label: "รอ", color: "primary" as const };
  };

  const formatDate = (d: string | Date | null) => {
    if (!d) return null;
    return new Date(d).toLocaleDateString("th-TH", {
      day: "2-digit",
      month: "short",
    });
  };

  return (
    <div className="space-y-3 mt-3 pt-3 border-t border-default-200">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h5 className="text-xs font-bold text-default-500 uppercase flex items-center gap-1">
          <Link2 size={14} /> Task ที่ผูกกับวัสดุนี้
        </h5>
        <div className="flex gap-1">
          <Tooltip content="AI แนะนำ Task">
            <Button
              size="sm"
              variant="flat"
              color="secondary"
              startContent={<Sparkles size={12} />}
              onPress={handleAiSuggest}
              isLoading={isSuggesting}
            >
              AI แนะนำ
            </Button>
          </Tooltip>
          <Button
            size="sm"
            variant="flat"
            color="primary"
            startContent={<Link2 size={12} />}
            onPress={() => {
              setIsLinking(!isLinking);
              setSelectedTaskIds(new Set());
              setTaskSearch("");
            }}
          >
            {isLinking ? "ปิด" : "ผูก Task"}
          </Button>
        </div>
      </div>

      {/* AI Suggestions */}
      {suggestions.length > 0 && (
        <div className="bg-secondary-50/50 dark:bg-secondary-900/10 rounded-xl p-3 space-y-2">
          <p className="text-[10px] font-bold text-secondary-600 uppercase">
            AI แนะนำ Task ที่เกี่ยวข้อง
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {suggestions.map((s) => {
              const task = tasks.find((t) => t.id === s.taskId);
              if (!task || linkedTaskIds.has(s.taskId)) return null;
              return (
                <div
                  key={s.taskId}
                  className="flex items-center justify-between bg-white dark:bg-zinc-800 rounded-lg p-3 border border-secondary-200 dark:border-secondary-800"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">
                      {task.taskName || `Task #${s.taskId}`}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Chip size="sm" variant="flat" color="secondary" className="text-[10px]">
                        {Math.round(s.confidence * 100)}%
                      </Chip>
                      <span className="text-[10px] text-default-400 truncate">
                        {s.reason}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1 ml-2 shrink-0">
                    <Button
                      isIconOnly
                      size="sm"
                      color="success"
                      variant="flat"
                      onPress={() => handleAcceptSuggestion(s.taskId, s.confidence)}
                      isLoading={isPending}
                    >
                      <Check size={14} />
                    </Button>
                    <Button
                      isIconOnly
                      size="sm"
                      variant="flat"
                      onPress={() =>
                        setSuggestions((prev) => prev.filter((x) => x.taskId !== s.taskId))
                      }
                    >
                      <X size={14} />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Card Multi-Select for Linking */}
      {isLinking && (
        <div className="bg-primary-50/30 dark:bg-primary-900/5 rounded-xl p-3 space-y-3">
          <div className="flex items-center gap-2">
            <Input
              placeholder="ค้นหา Task..."
              value={taskSearch}
              onValueChange={setTaskSearch}
              isClearable
              size="sm"
              startContent={<Search size={14} />}
              className="flex-1"
            />
            <Chip size="sm" variant="flat" color="primary">
              เลือก {selectedTaskIds.size}
            </Chip>
          </div>

          {availableTasks.length === 0 ? (
            <p className="text-xs text-default-400 text-center py-4">
              {taskSearch ? "ไม่พบ Task ที่ตรงกัน" : "ไม่มี Task ที่ยังไม่ได้ผูก"}
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[240px] overflow-y-auto pr-1">
              {availableTasks.map((task) => {
                const isSelected = selectedTaskIds.has(task.id);
                return (
                  <div
                    key={task.id}
                    onClick={() => toggleTask(task.id)}
                    className={`
                      relative cursor-pointer rounded-lg border-2 p-2.5 transition-all
                      hover:shadow-sm
                      ${isSelected
                        ? "border-primary bg-primary-50 dark:bg-primary-900/20 shadow-sm"
                        : "border-default-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:border-primary-300"
                      }
                    `}
                  >
                    {isSelected && (
                      <div className="absolute top-2 right-2 z-10">
                        <CheckCircle2 size={16} className="text-primary" />
                      </div>
                    )}
                    <div className="flex items-start gap-2 pr-5">
                      {task.coverImageUrl ? (
                        <img
                          src={task.coverImageUrl}
                          alt=""
                          className="w-10 h-10 rounded object-cover border border-default-200 shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded bg-default-100 dark:bg-zinc-700 flex items-center justify-center shrink-0">
                          <ImageIcon size={14} className="text-default-300" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium truncate leading-tight">
                          {task.taskName || `Task #${task.id}`}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <Chip size="sm" variant="flat" className="text-[10px] h-4">
                            {task.status === "IN_PROGRESS" ? "กำลังทำ" : task.status === "COMPLETED" ? "เสร็จ" : "ยังไม่เริ่ม"}
                          </Chip>
                          {task.startPlanned && (
                            <span className="text-[10px] text-default-400 flex items-center gap-0.5">
                              <Calendar size={10} />
                              {formatDate(task.startPlanned)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button
              size="sm"
              variant="flat"
              onPress={() => {
                setIsLinking(false);
                setSelectedTaskIds(new Set());
                setTaskSearch("");
              }}
            >
              ยกเลิก
            </Button>
            <Button
              size="sm"
              color="primary"
              startContent={<Link2 size={14} />}
              onPress={handleLinkSelected}
              isLoading={isPending}
              isDisabled={selectedTaskIds.size === 0}
            >
              ผูก {selectedTaskIds.size} Task
            </Button>
          </div>
        </div>
      )}

      {/* Linked Tasks */}
      {item.taskLinks.length > 0 ? (
        <div className="space-y-1">
          {item.taskLinks.map((tl) => {
            const readiness = getReadinessStatus(tl);
            return (
              <div
                key={tl.id}
                className="flex items-center justify-between bg-white dark:bg-zinc-800/50 rounded-lg px-3 py-2 border border-default-100"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <Chip size="sm" color={readiness.color} variant="flat" className="text-[10px]">
                    {readiness.label}
                  </Chip>
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate">
                      {tl.task.taskName || `Task #${tl.taskId}`}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-default-400">
                      <span>
                        {tl.linkedBy === "AI_SUGGESTED" ? "🤖 AI" : "👤 Manual"}
                      </span>
                      {tl.aiConfidence != null && (
                        <span>{Math.round(tl.aiConfidence * 100)}%</span>
                      )}
                      {tl.linkedBy === "AI_SUGGESTED" && !tl.confirmedAt && (
                        <Chip size="sm" color="warning" variant="flat" className="text-[10px]">
                          ยังไม่ยืนยัน
                        </Chip>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-1 ml-2 shrink-0">
                  {tl.linkedBy === "AI_SUGGESTED" && !tl.confirmedAt && (
                    <Tooltip content="ยืนยัน">
                      <Button
                        isIconOnly
                        size="sm"
                        color="success"
                        variant="flat"
                        onPress={() => handleConfirmLink(tl.id)}
                        isLoading={isPending}
                      >
                        <Check size={12} />
                      </Button>
                    </Tooltip>
                  )}
                  <Tooltip content="ยกเลิกการผูก" color="danger">
                    <Button
                      isIconOnly
                      size="sm"
                      color="danger"
                      variant="light"
                      onPress={() => handleUnlink(tl.id)}
                    >
                      <Unlink size={12} />
                    </Button>
                  </Tooltip>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        !isLinking && (
          <p className="text-[10px] text-default-400 text-center py-2">
            ยังไม่ได้ผูกกับ Task ใด
          </p>
        )
      )}
    </div>
  );
};

export default TaskLinkPanel;
