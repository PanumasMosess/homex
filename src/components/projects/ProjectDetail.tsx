"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { Plus, Search, Building2, Clock, Pencil } from "lucide-react";

import {
  Card,
  CardBody,
  Button,
  Chip,
  Progress,
  Modal,
  Input,
  ModalContent,
  ModalBody,
  useDisclosure,
  Checkbox,
  Spinner,
  Textarea,
} from "@heroui/react";

import {
  DndContext,
  closestCorners,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";

import type { Tab, Task, ProjectDetailProps } from "@/lib/type";
import { useRouter } from "next/navigation";
import CreateMainTask from "./forms/createMainTask";
import {
  calcProgress,
  calculateTaskProgress,
  formatDate,
  getMediaType,
} from "@/lib/setting_data";
import { EmptyStateCard } from "./EmptyStateCard";
import { DropColumn } from "./DropColumn";
import { toast } from "react-toastify";
import { deleteFileS3 } from "@/lib/actions/actionIndex";
import {
  createSubTask,
  toggleSubtaskStatus,
  updateMainTask,
  updateTaskStatus,
  updateVdoProject,
  updateSubtask,
  updateProjectProgressDB,
} from "@/lib/actions/actionProject";
import { checkVideoStatus, startVideoJob } from "@/lib/ai/geminiAI";
import MainTaskCard from "./MainTaskCard";

const ProjectDetail = ({
  organizationId,
  currentUserId,
  dataDetail,
}: ProjectDetailProps) => {
  const router = useRouter();
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  const [tasks, setTasks] = useState<any[]>([]);
  const [view, setView] = useState<"card" | "board">("card");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("all");
  const [priority, setPriority] = useState<"urgent" | "high" | "normal" | null>(
    null,
  );
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [projectInfo, setProjectInfo] = useState({
    id: "",
    code: "",
    name: "",
    customer: "",
    image: "",
    video: "",
  });

  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");

  const [isEditMode, setIsEditMode] = useState(false);
  const [editFormData, setEditFormData] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isDeletingTask, setIsDeletingTask] = useState(false);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isUpdatingStatusMainTask, setIsUpdatingStatusMainTask] =
    useState(false);

  // States for Subtask
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);
  const [isSavingSubtask, setIsSavingSubtask] = useState(false);
  const [newSubtask, setNewSubtask] = useState({
    detailName: "",
    detailDesc: "",
    startPlanned: "",
    durationDays: "",
    weightPercent: "",
  });
  const [updatingSubtaskId, setUpdatingSubtaskId] = useState<number | null>(
    null,
  );

  const [editingSubtaskId, setEditingSubtaskId] = useState<number | null>(null);
  const [editingSubtaskData, setEditingSubtaskData] = useState<any>({});
  const [isSavingSubtaskEdit, setIsSavingSubtaskEdit] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQ(q), 300);
    return () => clearTimeout(timer);
  }, [q]);

  useEffect(() => {
    const id = localStorage.getItem("currentProjectId");
    if (!id) {
      router.push("/projects");
      return;
    }

    setProjectInfo({
      id,
      code: localStorage.getItem("currentProjectCode") || "",
      name: localStorage.getItem("currentProjectName") || "",
      customer: localStorage.getItem("currentProjectCustomer") || "",
      image: localStorage.getItem("currentProjectImage") || "",
      video: localStorage.getItem("currentProjectVideo") || "",
    });

    const initialFilteredTasks = dataDetail.filter(
      (t: any) => t.projectId === Number(id),
    );
    setTasks(initialFilteredTasks);
  }, [dataDetail, router]);

  useEffect(() => {
    if (view === "board") {
      setActiveTab("all");
      setQ("");
    }
  }, [view]);

  const selected = useMemo(
    () => tasks.find((t) => t.id === selectedId) || null,
    [tasks, selectedId],
  );

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const matchTab =
        activeTab === "all" || (t.status || "").toUpperCase() === activeTab;
      const matchQ =
        debouncedQ === "" ||
        (t.taskName || "").toLowerCase().includes(debouncedQ.toLowerCase());
      return matchTab && matchQ;
    });
  }, [tasks, activeTab, debouncedQ]);

  const projectProgress = useMemo(() => {
    if (tasks.length === 0) return 0;
    const total = tasks.reduce((acc, t) => {
      if (t.status === "DONE") return acc + 100;
      return acc + (Number(t.progressPercent) || 0);
    }, 0);
    return Math.round(total / tasks.length);
  }, [tasks]);

  const lastSavedProgress = useRef<number | null>(null);

  useEffect(() => {
    if (!projectInfo.id || tasks.length === 0) return;

    const saveToDB = async () => {
      if (lastSavedProgress.current !== projectProgress) {
        const projectIdNum = parseInt(projectInfo.id);
        if (!isNaN(projectIdNum)) {
          const res = await updateProjectProgressDB(projectIdNum, projectProgress);
          if (res.success) {
            lastSavedProgress.current = projectProgress;
          }
        }
      }
    };

    const timer = setTimeout(() => {
      saveToDB();
    }, 1000); 

    return () => clearTimeout(timer);
  }, [projectProgress, projectInfo.id, tasks.length]);

  const handleSelectTask = useCallback((id: number) => {
    setSelectedId(id);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 5 },
    }),
  );

  const handleGenerateVideo = async () => {
    setIsGeneratingVideo(true);
    try {
      const prompt_vdo = `Locked-off camera. Time-lapse shows the rapid construction of the modern building from an empty plot. Active construction cranes, workers, and materials are visible and moving fast. The surrounding environment, including the street, cars, trees, and lighting, remains perfectly identical to the reference image throughout the entire video. The building finishes exactly as shown in the reference. Realistic. exactly 8 seconds duration, 720p resolution, 16:9 aspect ratio`;
      const startRes = await startVideoJob(prompt_vdo, projectInfo.image);

      if (!startRes.success || !startRes.operationName) {
        toast.error(startRes.error || "ไม่สามารถเริ่มสร้างวิดีโอได้");
        setIsGeneratingVideo(false);
        return;
      }

      toast.info(
        "กำลังสร้างวิดีโอด้วย AI (อาจใช้เวลา 1-3 นาที) โปรดรอสักครู่...",
      );
      let isDone = false;
      let finalVideoUrl = "";

      while (!isDone) {
        await new Promise((resolve) => setTimeout(resolve, 10000));
        const checkRes = await checkVideoStatus(startRes.operationName);
        if (checkRes.status === "success" && checkRes.videoUrl) {
          isDone = true;
          finalVideoUrl = checkRes.videoUrl;
        } else if (checkRes.status === "error") {
          isDone = true;
          throw new Error(checkRes.error || "เกิดข้อผิดพลาดระหว่างสร้างวิดีโอ");
        }
      }

      if (finalVideoUrl) {
        if (projectInfo.video) {
          try {
            const urlObj = new URL(projectInfo.video);
            let fileKey = urlObj.pathname.substring(1);
            if (fileKey.startsWith("homex/"))
              fileKey = fileKey.replace("homex/", "");
            await deleteFileS3(fileKey);
          } catch (err) {}
        }
        setProjectInfo((prev) => ({ ...prev, video: finalVideoUrl }));
        await updateVdoProject(parseInt(projectInfo.id), finalVideoUrl);
        toast.success("สร้างและบันทึกสำเร็จ!");
      }
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการสร้างวิดีโอ");
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  const handleDragEnd = useCallback(
    async (e: DragEndEvent) => {
      const { active, over } = e;
      if (!over) return;
      const taskId = active.id as number;
      const newStatus = over.id as string;
      const taskToUpdate = tasks.find((t) => t.id === taskId);
      if (!taskToUpdate || taskToUpdate.status === newStatus) return;

      const newProgress =
        newStatus === "DONE" ? 100 : taskToUpdate.progressPercent;

      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? { ...t, status: newStatus, progressPercent: newProgress }
            : t,
        ),
      );

      try {
        const res = await updateTaskStatus(taskId, newStatus);
        if (!res.success) throw new Error(res.error || "บันทึกไม่สำเร็จ");

        if (newStatus === "DONE") {
          await updateMainTask(taskId, { progressPercent: 100 });
        }

        toast.success(`เปลี่ยนสถานะงานเป็น ${newStatus} แล้ว`);
      } catch (error) {
        toast.error("อัปเดตสถานะไม่สำเร็จ ระบบจะดึงข้อมูลเดิมกลับมา");
        setTasks((prev) =>
          prev.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  status: taskToUpdate.status,
                  progressPercent: taskToUpdate.progressPercent,
                }
              : t,
          ),
        );
      }
    },
    [tasks],
  );

  useEffect(() => {
    if (selected) {
      setEditFormData(selected);
      setIsEditMode(false);
    }
  }, [selected]);

  const handleSaveTaskEdit = async () => {
    if (!editFormData || !editFormData.id) return;
    setIsSaving(true);
    try {
      const res = await updateMainTask(editFormData.id, editFormData);
      if (!res.success) throw new Error(res.error || "บันทึกข้อมูลไม่สำเร็จ");
      setTasks((prev) =>
        prev.map((t) =>
          Number(t.id) === Number(editFormData.id)
            ? { ...t, ...editFormData }
            : t,
        ),
      );
      toast.success("บันทึกข้อมูลเรียบร้อย");
      setIsEditMode(false);
    } catch (error: any) {
      toast.error(error.message || "บันทึกไม่สำเร็จ");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!selected) return;
    setIsDeletingTask(true);
    try {
      await updateTaskStatus(selected.id, "DELETED");
      await new Promise((resolve) => setTimeout(resolve, 800));
      setTasks((prev) => prev.filter((t) => t.id !== selected.id));
      setSelectedId(null);
      setIsDeleteModalOpen(false);
      toast.success("ลบงานเรียบร้อย");
    } catch (error) {
      toast.error("ลบไม่สำเร็จ");
    } finally {
      setIsDeletingTask(false);
    }
  };

  const handleSaveSubtask = async () => {
    if (!newSubtask.detailName.trim()) {
      toast.warning("กรุณากรอกชื่อรายการย่อย");
      return;
    }
    if (!selected || !selected.id) return;

    setIsSavingSubtask(true);
    try {
      const payload = {
        detailName: newSubtask.detailName,
        detailDesc: newSubtask.detailDesc || undefined,
        startPlanned: newSubtask.startPlanned
          ? new Date(newSubtask.startPlanned).toISOString()
          : undefined,
        durationDays: newSubtask.durationDays
          ? Number(newSubtask.durationDays)
          : undefined,
        weightPercent: newSubtask.weightPercent
          ? Number(newSubtask.weightPercent)
          : 0,
        organizationId: organizationId,
        projectId: Number(projectInfo.id),
        taskId: selected.id,
        status: false,
      };

      const res = await createSubTask(payload);
      if (!res.success || !res.data)
        throw new Error(res.message || "สร้างรายการย่อยไม่สำเร็จ");

      const updatedDetails = [...(selected.details || []), res.data];
      const newProgress = calculateTaskProgress(updatedDetails);
      await updateMainTask(selected.id, { progressPercent: newProgress });

      setTasks((prev) =>
        prev.map((t) =>
          t.id === selected.id
            ? { ...t, details: updatedDetails, progressPercent: newProgress }
            : t,
        ),
      );

      toast.success("เพิ่มรายการย่อยสำเร็จ");
      setIsAddingSubtask(false);
      setNewSubtask({
        detailName: "",
        detailDesc: "",
        startPlanned: "",
        durationDays: "",
        weightPercent: "",
      });
    } catch (error: any) {
      toast.error(error.message || "บันทึกไม่สำเร็จ");
    } finally {
      setIsSavingSubtask(false);
    }
  };

  const startEditSubtask = (subtask: any) => {
    setEditingSubtaskId(subtask.id);
    setEditingSubtaskData({
      detailName: subtask.detailName || "",
      detailDesc: subtask.detailDesc || "",
      startPlanned: subtask.startPlanned
        ? new Date(subtask.startPlanned).toISOString().split("T")[0]
        : "",
      durationDays: subtask.durationDays || "",
      weightPercent: subtask.weightPercent || "",
    });
  };

  const handleSaveSubtaskEdit = async () => {
    if (!editingSubtaskData.detailName.trim()) {
      toast.warning("กรุณากรอกชื่อรายการย่อย");
      return;
    }
    if (!selected || !editingSubtaskId) return;

    setIsSavingSubtaskEdit(true);
    try {
      const payload = { ...editingSubtaskData };
      const res = await updateSubtask(editingSubtaskId, payload);

      if (!res.success || !res.data)
        throw new Error(res.error || "แก้ไขไม่สำเร็จ");

      const updatedDetails = (selected.details || []).map((sub: any) =>
        sub.id === editingSubtaskId ? res.data : sub,
      );

      const newProgress = calculateTaskProgress(updatedDetails);
      await updateMainTask(selected.id, { progressPercent: newProgress });

      setTasks((prev) =>
        prev.map((t) => {
          if (t.id === selected.id) {
            return {
              ...t,
              details: updatedDetails,
              progressPercent: newProgress,
            };
          }
          return t;
        }),
      );

      toast.success("แก้ไขรายการย่อยสำเร็จ");
      setEditingSubtaskId(null);
    } catch (error: any) {
      toast.error(error.message || "แก้ไขไม่สำเร็จ");
    } finally {
      setIsSavingSubtaskEdit(false);
    }
  };

  const handleUpdateStatusMainTask = async (newStatus: string) => {
    if (!selected) return;
    setIsUpdatingStatusMainTask(true);
    try {
      const res = await updateTaskStatus(selected.id, newStatus);
      if (!res.success) throw new Error(res.error || "อัปเดตสถานะไม่สำเร็จ");

      let newProgress = selected.progressPercent;
      if (newStatus === "DONE") {
        newProgress = 100;
        await updateMainTask(selected.id, { progressPercent: 100 });
      }

      setTasks((prev) =>
        prev.map((t) =>
          t.id === selected.id ? { ...t, status: newStatus, progressPercent: newProgress } : t,
        ),
      );
      toast.success(`เปลี่ยนสถานะงานเป็น ${newStatus} แล้ว`);
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการเปลี่ยนสถานะ");
    } finally {
      setIsUpdatingStatusMainTask(false);
    }
  };

  const handleToggleSubtask = async (
    subtaskId: number,
    currentStatus: boolean,
  ) => {
    if (!selected) return;
    setUpdatingSubtaskId(subtaskId);
    try {
      const newStatus = !currentStatus;
      const res = await toggleSubtaskStatus(subtaskId, newStatus);
      if (!res.success) throw new Error(res.error || "อัปเดตไม่สำเร็จ");

      const updatedDetails = (selected.details || []).map((sub: any) =>
        sub.id === subtaskId ? { ...sub, status: newStatus } : sub,
      );

      const newProgress = calculateTaskProgress(updatedDetails);
      await updateMainTask(selected.id, { progressPercent: newProgress });

      setTasks((prev) =>
        prev.map((task) => {
          if (task.id === selected.id) {
            return {
              ...task,
              details: updatedDetails,
              progressPercent: newProgress,
            };
          }
          return task;
        }),
      );
    } catch (error: any) {
      toast.error(error.message || "อัปเดตรายการย่อยไม่สำเร็จ");
    } finally {
      setUpdatingSubtaskId(null);
    }
  };

  const mediaUrl = projectInfo.video;
  const mediaType = getMediaType(mediaUrl);

  return (
    <div className="p-3 sm:p-6 lg:p-8 max-w-[1600px] mx-auto min-h-screen space-y-6">
      {/* --- HERO SECTION --- */}
      <div className="bg-default-100 dark:bg-zinc-900 rounded-3xl p-6 lg:p-8 grid grid-cols-1 md:grid-cols-[380px_1fr] lg:grid-cols-[560px_1fr] gap-6 items-center overflow-hidden">
        <div className="relative w-full h-[200px] sm:h-[240px] md:h-[220px] lg:h-[320px] rounded-2xl overflow-hidden bg-zinc-800">
          {isGeneratingVideo && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
              <Spinner color="primary" size="lg" />
              <p className="text-white text-sm mt-3 font-medium animate-pulse">
                AI กำลังทำงาน... อาจใช้เวลา 1-5 นาทีโปรดรอซักครู่นะครับ
              </p>
            </div>
          )}

          {mediaType === "video" ? (
            <video
              autoPlay
              muted
              loop
              playsInline
              className="w-full h-full object-cover"
              src={mediaUrl}
            />
          ) : mediaType === "image" ? (
            <img
              src={mediaUrl}
              alt="Project Media"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-800/50 border-2 border-dashed border-zinc-700 text-zinc-500">
              <p className="text-sm font-medium">ไม่มีรูปภาพหรือวิดีโอ</p>
            </div>
          )}
        </div>

        {/* ข้อมูลโปรเจกต์ */}
        <div className="space-y-4 min-w-0 flex flex-col justify-center h-full">
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold">
            {projectInfo.name || "Project Name"}
          </h1>
          <p className="text-default-500 dark:text-zinc-400 text-sm">
            ลูกค้า: {projectInfo.customer || "-"}
          </p>
          <div className="flex gap-3 flex-wrap">
            <Chip color="primary">IN PROGRESS</Chip>
            <Chip variant="flat">{projectProgress}% Complete</Chip>
          </div>
          <Progress value={projectProgress} color="primary" />

          <div className="pt-2">
            <Button
              color="secondary"
              variant="shadow"
              isLoading={isGeneratingVideo}
              onPress={handleGenerateVideo}
              className="font-medium"
            >
              {isGeneratingVideo
                ? "กำลังสร้างวิดีโอ..."
                : "✨ สร้าง Video Timelapse ด้วย AI"}
            </Button>
          </div>
        </div>
      </div>

      {/* --- TOOLBAR --- */}
      <div className="flex items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold flex items-center gap-2">
            <Building2 className="text-orange-500 w-6 h-6" /> Tasks
          </h1>
          <p className="text-default-500 dark:text-zinc-400 text-sm">
            ติดตามและจัดการรายการงาน ({filteredTasks.length})
          </p>
        </div>
        <Button
          onPress={onOpen}
          radius="full"
          className="ml-auto bg-black text-white dark:bg-white dark:text-black px-5 h-10"
        >
          + สร้าง Tasks เอง
        </Button>
        <CreateMainTask
          isOpen={isOpen}
          onOpenChange={onOpenChange}
          projectId={projectInfo.id ? Number(projectInfo.id) : 0}
          organizationId={organizationId}
          currentUserId={currentUserId}
          projectCode={projectInfo.code}
        />
      </div>

      <div className="flex gap-3">
        <Button
          variant={view === "card" ? "solid" : "flat"}
          onPress={() => setView("card")}
        >
          Card
        </Button>
        <Button
          variant={view === "board" ? "solid" : "flat"}
          onPress={() => setView("board")}
        >
          Board
        </Button>
      </div>

      {/* --- VIEW: CARD --- */}
      {view === "card" && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-2 flex-wrap">
              {[
                {
                  key: "all",
                  label: "All",
                  activeClass: "bg-zinc-800 text-white",
                  hoverClass: "hover:border-zinc-800",
                },
                {
                  key: "TODO",
                  label: "Todo",
                  activeClass: "bg-default-500 text-white",
                  hoverClass: "hover:border-default-500",
                },
                {
                  key: "PROGRESS",
                  label: "Progress",
                  activeClass: "bg-primary text-white",
                  hoverClass: "hover:border-primary",
                },
                {
                  key: "DONE",
                  label: "Done",
                  activeClass: "bg-success text-white",
                  hoverClass: "hover:border-success",
                },
              ].map((tab) => {
                const active = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as Tab)}
                    className={`px-4 h-9 rounded-full text-sm font-medium transition-all border ${active ? tab.activeClass : "bg-transparent text-default-600 border-default-300 " + tab.hoverClass}`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
            <Input
              placeholder="ค้นหา..."
              value={q}
              onValueChange={setQ}
              isClearable
              onClear={() => setQ("")}
              size="sm"
              startContent={<Search size={16} />}
              classNames={{ base: "w-full sm:w-64" }}
            />
          </div>

          {filteredTasks.length === 0 ? (
            <EmptyStateCard onOpen={onOpen} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-fr">
              {filteredTasks.map((t) => (
                <MainTaskCard key={t.id} task={t} onSelect={handleSelectTask} />
              ))}
            </div>
          )}
        </>
      )}

      {/* --- VIEW: BOARD --- */}
      {view === "board" && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragEnd={handleDragEnd}
        >
          {filteredTasks.length === 0 ? (
            <EmptyStateCard onOpen={onOpen} />
          ) : (
            <div className="flex md:grid md:grid-cols-3 gap-4 md:gap-6 pb-2">
              <DropColumn
                status="TODO"
                tasks={filteredTasks.filter(
                  (t) => (t.status || "").toUpperCase() === "TODO",
                )}
                onTaskClick={handleSelectTask}
              />
              <DropColumn
                status="PROGRESS"
                tasks={filteredTasks.filter(
                  (t) => (t.status || "").toUpperCase() === "PROGRESS",
                )}
                onTaskClick={handleSelectTask}
              />
              <DropColumn
                status="DONE"
                tasks={filteredTasks.filter(
                  (t) => (t.status || "").toUpperCase() === "DONE",
                )}
                onTaskClick={handleSelectTask}
              />
            </div>
          )}
        </DndContext>
      )}

      {/* --- MODAL TASK DETAILS & EDIT --- */}
      <Modal
        isOpen={!!selected}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setSelectedId(null);
            setIsEditMode(false);
            setIsAddingSubtask(false);
            setEditingSubtaskId(null);
          }
        }}
        size="3xl"
        classNames={{
          base: `md:rounded-xl md:max-w-4xl md:my-10 md:max-h-[90vh] max-md:rounded-none max-md:m-0 max-md:h-screen max-md:max-w-full`,
          closeButton: "top-4 right-4 bg-default-100 hover:bg-default-200 z-50",
        }}
      >
        <ModalContent className="max-md:h-screen max-md:flex max-md:flex-col max-md:overflow-hidden">
          {selected ? (
            <>
              {/* 🌟 HEADER ของ Mobile */}
              <div className="md:hidden p-4 flex items-center justify-between border-b border-default-200 dark:border-zinc-800 shrink-0 bg-background z-10">
                <div className="flex items-center gap-3 overflow-hidden">
                  <button
                    onClick={() => setSelectedId(null)}
                    className="p-2 -ml-2 text-default-500"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="m15 18-6-6 6-6" />
                    </svg>
                  </button>
                  <p className="font-semibold truncate">
                    {isEditMode
                      ? "แก้ไขรายละเอียดงาน"
                      : selected.taskName || "Untitled Task"}
                  </p>
                </div>
              </div>

              <ModalBody className="space-y-5 md:py-8 md:px-2 md:overflow-y-auto md:my-auto scrollbar-hide max-md:flex-1 max-md:overflow-y-auto max-md:pb-20 relative">
                {/* 📌 เครื่องมือ (มุมขวาบน - Desktop) */}
                <div className="hidden md:flex absolute top-4 right-16 gap-2 z-10">
                  {isEditMode ? (
                    <>
                      <Button
                        size="sm"
                        color="danger"
                        variant="flat"
                        onPress={() => setIsEditMode(false)}
                        isDisabled={isSaving}
                      >
                        ยกเลิก
                      </Button>
                      <Button
                        size="sm"
                        color="primary"
                        onPress={handleSaveTaskEdit}
                        isLoading={isSaving}
                      >
                        บันทึก
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        variant="flat"
                        onPress={() => setIsEditMode(true)}
                      >
                        ✏️ แก้ไข
                      </Button>
                      <Button
                        size="sm"
                        color="danger"
                        variant="flat"
                        onPress={() => setIsDeleteModalOpen(true)}
                      >
                        🗑️ ลบ
                      </Button>
                    </>
                  )}
                </div>

                {/* 📌 เครื่องมือ Mobile */}
                <div className="md:hidden flex justify-end gap-2 pt-2 px-4">
                  {isEditMode ? (
                    <>
                      <Button
                        size="sm"
                        color="danger"
                        variant="flat"
                        onPress={() => setIsEditMode(false)}
                        isDisabled={isSaving}
                      >
                        ยกเลิก
                      </Button>
                      <Button
                        size="sm"
                        color="primary"
                        onPress={handleSaveTaskEdit}
                        isLoading={isSaving}
                      >
                        บันทึก
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        variant="flat"
                        onPress={() => setIsEditMode(true)}
                      >
                        ✏️ แก้ไข
                      </Button>
                      <Button
                        size="sm"
                        color="danger"
                        variant="flat"
                        onPress={() => setIsDeleteModalOpen(true)}
                      >
                        🗑️ ลบ
                      </Button>
                    </>
                  )}
                </div>

                <div className="flex flex-col md:flex-row gap-8 md:px-6 mt-2">
                  <img
                    src={selected.coverImageUrl || "/placeholder-image.jpg"}
                    className="w-full md:w-[320px] h-[220px] md:h-[200px] object-cover rounded-xl shrink-0"
                    alt="Cover"
                  />
                  <div className="flex-1 space-y-5">
                    {isEditMode ? (
                      <div className="space-y-4">
                        <Input
                          label="ชื่องาน"
                          variant="bordered"
                          value={editFormData.taskName || ""}
                          onChange={(e) =>
                            setEditFormData({
                              ...editFormData,
                              taskName: e.target.value,
                            })
                          }
                        />
                        <Textarea
                          label="รายละเอียด"
                          variant="bordered"
                          minRows={2}
                          value={editFormData.taskDesc || ""}
                          onChange={(e) =>
                            setEditFormData({
                              ...editFormData,
                              taskDesc: e.target.value,
                            })
                          }
                        />
                        <div className="grid grid-cols-2 gap-3 items-start">
                          <Input
                            label="วันที่เริ่ม"
                            type="date"
                            labelPlacement="outside"
                            variant="bordered"
                            value={
                              editFormData.startPlanned
                                ? new Date(editFormData.startPlanned)
                                    .toISOString()
                                    .split("T")[0]
                                : ""
                            }
                            onChange={(e) =>
                              setEditFormData({
                                ...editFormData,
                                startPlanned: e.target.value,
                              })
                            }
                          />
                          <Input
                            type="number"
                            label="ระยะเวลา (วัน)"
                            labelPlacement="outside"
                            variant="bordered"
                            min={1}
                            value={editFormData.durationDays || ""}
                            onValueChange={(val) =>
                              setEditFormData({
                                ...editFormData,
                                durationDays: val ? Number(val) : null,
                              })
                            }
                          />
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex gap-3">
                          <Button
                            color="primary"
                            onPress={() =>
                              handleUpdateStatusMainTask("PROGRESS")
                            }
                            isLoading={isUpdatingStatusMainTask}
                            isDisabled={
                              selected.status === "PROGRESS" ||
                              selected.status === "DONE"
                            }
                          >
                            ✓ เริ่มงาน
                          </Button>
                          <Button
                            variant="bordered"
                            onPress={() => handleUpdateStatusMainTask("DONE")}
                            isLoading={isUpdatingStatusMainTask}
                            isDisabled={selected.status === "DONE"}
                          >
                            เสร็จสมบูรณ์
                          </Button>
                        </div>
                        {selected.taskDesc && (
                          <div className="text-sm bg-default-50 p-3 rounded-lg">
                            {selected.taskDesc}
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-4 text-sm text-default-500">
                          <div>
                            <p>กำหนดเริ่ม:</p>
                            <p className="text-foreground font-medium">
                              {selected.startPlanned
                                ? formatDate(selected.startPlanned)
                                : "-"}
                            </p>
                          </div>
                          <div>
                            <p>กำหนดเสร็จ:</p>
                            <p className="text-foreground font-medium">
                              {selected.finishPlanned
                                ? formatDate(selected.finishPlanned)
                                : "-"}
                            </p>
                          </div>
                        </div>
                        <div className="space-y-2 max-w-xl">
                          <div className="flex justify-between text-sm font-medium">
                            <span>ความคืบหน้า</span>
                            <span className="text-primary">
                              {selected.progressPercent || 0}%
                            </span>
                          </div>
                          <Progress
                            value={selected.progressPercent || 0}
                            color="primary"
                            className="h-2"
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {!isEditMode && (
                  <div className="space-y-3 md:px-6">
                    <h3 className="font-semibold text-sm">
                      รายการย่อย (Subtasks)
                    </h3>

                    {/* 🌟 List รายการย่อย พร้อมระบบแก้ไข */}
                    {(selected.details || selected.subtasks)?.length > 0 ? (
                      (selected.details || selected.subtasks).map((s: any) => (
                        <div
                          key={s.id}
                          className="border-b border-default-100 dark:border-zinc-800/50 pb-4 mb-3 last:border-0 last:mb-0"
                        >
                          {/* ---------------- โหมดแก้ไข (Edit Mode) ---------------- */}
                          {editingSubtaskId === s.id ? (
                            <div className="bg-default-50 dark:bg-zinc-800/50 p-4 rounded-xl space-y-4 animate-appearance-in border border-default-200 dark:border-zinc-700 shadow-sm">
                              <div className="flex justify-between items-center">
                                <p className="text-sm font-bold text-primary flex items-center gap-2">
                                  <Pencil size={16} /> แก้ไขรายการย่อย
                                </p>
                              </div>

                              <Input
                                size="sm"
                                isRequired
                                label="ชื่อรายการย่อย"
                                labelPlacement="outside"
                                placeholder="ระบุชื่องานย่อย..."
                                variant="bordered"
                                value={editingSubtaskData.detailName}
                                onValueChange={(val) =>
                                  setEditingSubtaskData({
                                    ...editingSubtaskData,
                                    detailName: val,
                                  })
                                }
                              />

                              <Textarea
                                size="sm"
                                label="รายละเอียดเพิ่มเติม"
                                labelPlacement="outside"
                                placeholder="ระบุรายละเอียด..."
                                variant="bordered"
                                minRows={2}
                                value={editingSubtaskData.detailDesc}
                                onValueChange={(val) =>
                                  setEditingSubtaskData({
                                    ...editingSubtaskData,
                                    detailDesc: val,
                                  })
                                }
                              />

                              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <Input
                                  size="sm"
                                  type="date"
                                  label="วันที่เริ่ม"
                                  labelPlacement="outside"
                                  variant="bordered"
                                  value={editingSubtaskData.startPlanned}
                                  onValueChange={(val) =>
                                    setEditingSubtaskData({
                                      ...editingSubtaskData,
                                      startPlanned: val,
                                    })
                                  }
                                />
                                <Input
                                  size="sm"
                                  type="number"
                                  label="ระยะเวลา (วัน)"
                                  labelPlacement="outside"
                                  placeholder="เช่น 3"
                                  variant="bordered"
                                  min={1}
                                  value={editingSubtaskData.durationDays}
                                  onValueChange={(val) =>
                                    setEditingSubtaskData({
                                      ...editingSubtaskData,
                                      durationDays: val,
                                    })
                                  }
                                />
                                <Input
                                  size="sm"
                                  type="number"
                                  label="น้ำหนักงาน (%)"
                                  labelPlacement="outside"
                                  placeholder="เช่น 10"
                                  variant="bordered"
                                  min={0}
                                  max={100}
                                  value={editingSubtaskData.weightPercent}
                                  onValueChange={(val) =>
                                    setEditingSubtaskData({
                                      ...editingSubtaskData,
                                      weightPercent: val,
                                    })
                                  }
                                />
                              </div>

                              <div className="flex justify-end gap-3 pt-4 border-t border-default-200 dark:border-zinc-700 mt-2">
                                <Button
                                  size="sm"
                                  variant="light"
                                  color="danger"
                                  onPress={() => setEditingSubtaskId(null)}
                                  isDisabled={isSavingSubtaskEdit}
                                >
                                  ยกเลิก
                                </Button>
                                <Button
                                  size="sm"
                                  color="primary"
                                  className="font-medium px-6"
                                  onPress={handleSaveSubtaskEdit}
                                  isLoading={isSavingSubtaskEdit}
                                >
                                  บันทึกการแก้ไข
                                </Button>
                              </div>
                            </div>
                          ) : (
                            /* ---------------- โหมดปกติ (Display Mode) ---------------- */
                            <div className="flex items-start justify-between w-full group transition-all duration-300 hover:bg-default-50 dark:hover:bg-zinc-800/40 p-3 rounded-xl -mx-3 px-3">
                              <div className="flex items-start gap-3 w-full">
                                {/* Checkbox / Spinner */}
                                <div className="mt-0.5 shrink-0">
                                  {updatingSubtaskId === s.id ? (
                                    <Spinner
                                      size="sm"
                                      color="primary"
                                      className="w-5 h-5 ml-1"
                                    />
                                  ) : (
                                    <Checkbox
                                      isSelected={!!s.status}
                                      onValueChange={() =>
                                        handleToggleSubtask(s.id, !!s.status)
                                      }
                                    />
                                  )}
                                </div>

                                {/* ข้อมูลงานย่อย */}
                                <div
                                  className="flex flex-col flex-1 pr-2 cursor-pointer"
                                  onClick={() =>
                                    !updatingSubtaskId &&
                                    handleToggleSubtask(s.id, !!s.status)
                                  }
                                >
                                  <span
                                    className={`text-sm font-semibold ${!!s.status ? "line-through text-default-400" : "text-foreground"}`}
                                  >
                                    {s.detailName}
                                  </span>

                                  {s.detailDesc && (
                                    <span
                                      className={`text-sm mt-1 leading-relaxed ${!!s.status ? "text-default-300" : "text-default-500"}`}
                                    >
                                      {s.detailDesc}
                                    </span>
                                  )}

                                  <div className="flex flex-wrap gap-2 mt-3 text-[11px] font-medium text-default-500">
                                    {s.startPlanned && (
                                      <span className="flex items-center gap-1.5 bg-default-100 dark:bg-zinc-800 px-2.5 py-1 rounded-md">
                                        <Clock size={12} /> เริ่ม:{" "}
                                        {new Date(
                                          s.startPlanned,
                                        ).toLocaleDateString("th-TH", {
                                          day: "numeric",
                                          month: "short",
                                        })}
                                      </span>
                                    )}
                                    {s.durationDays && (
                                      <span className="bg-default-100 dark:bg-zinc-800 px-2.5 py-1 rounded-md">
                                        เวลา: {s.durationDays} วัน
                                      </span>
                                    )}
                                    {s.weightPercent > 0 && (
                                      <span className="bg-primary/10 text-primary px-2.5 py-1 rounded-md">
                                        น้ำหนัก: {s.weightPercent}%
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* ปุ่มแก้ไข */}
                              <Button
                                isIconOnly
                                size="sm"
                                variant="light"
                                className="text-default-400 hover:text-primary hover:bg-primary/10 transition-all shrink-0"
                                onPress={() => startEditSubtask(s)}
                              >
                                <Pencil size={16} />
                              </Button>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-default-400 bg-default-50 dark:bg-zinc-800/30 p-6 rounded-xl text-center border border-dashed border-default-200 dark:border-zinc-700">
                        ยังไม่มีรายการย่อยในงานนี้
                      </div>
                    )}

                    {/* Inline Form สำหรับเพิ่ม Subtask */}
                    {!isAddingSubtask ? (
                      <Button
                        color="primary"
                        variant="flat"
                        size="sm"
                        className="mt-2"
                        onPress={() => setIsAddingSubtask(true)}
                      >
                        + เพิ่มรายการย่อย
                      </Button>
                    ) : (
                      <div className="bg-default-50 dark:bg-zinc-800/50 p-4 rounded-xl space-y-3 mt-3 border border-default-200 dark:border-zinc-700 animate-appearance-in">
                        <p className="text-sm font-semibold text-primary">
                          เพิ่มรายการย่อยใหม่
                        </p>
                        <Input
                          size="sm"
                          isRequired
                          label="ชื่อรายการย่อย"
                          variant="bordered"
                          value={newSubtask.detailName}
                          onValueChange={(val) =>
                            setNewSubtask({ ...newSubtask, detailName: val })
                          }
                        />
                        <Textarea
                          size="sm"
                          label="รายละเอียด"
                          variant="bordered"
                          minRows={1}
                          value={newSubtask.detailDesc}
                          onValueChange={(val) =>
                            setNewSubtask({ ...newSubtask, detailDesc: val })
                          }
                        />
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          <Input
                            size="sm"
                            type="date"
                            label="วันที่เริ่ม"
                            variant="bordered"
                            value={newSubtask.startPlanned}
                            onValueChange={(val) =>
                              setNewSubtask({
                                ...newSubtask,
                                startPlanned: val,
                              })
                            }
                          />
                          <Input
                            size="sm"
                            type="number"
                            label="ระยะเวลา (วัน)"
                            variant="bordered"
                            min={1}
                            value={newSubtask.durationDays}
                            onValueChange={(val) =>
                              setNewSubtask({
                                ...newSubtask,
                                durationDays: val,
                              })
                            }
                          />
                          <Input
                            size="sm"
                            type="number"
                            label="น้ำหนักงาน (%)"
                            variant="bordered"
                            min={0}
                            max={100}
                            value={newSubtask.weightPercent}
                            onValueChange={(val) =>
                              setNewSubtask({ ...newSubtask, weightPercent: val })
                            }
                          />
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                          <Button
                            size="sm"
                            variant="light"
                            color="danger"
                            onPress={() => setIsAddingSubtask(false)}
                            isDisabled={isSavingSubtask}
                          >
                            ยกเลิก
                          </Button>
                          <Button
                            size="sm"
                            color="primary"
                            onPress={handleSaveSubtask}
                            isLoading={isSavingSubtask}
                          >
                            บันทึก
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </ModalBody>
            </>
          ) : (
            <div className="flex h-full items-center justify-center">
              <p>ไม่พบข้อมูลงาน</p>
            </div>
          )}
        </ModalContent>
      </Modal>

      {/* 🌟 MODAL ยืนยันการลบ 🌟 */}
      <Modal
        isOpen={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        size="sm"
        placement="center"
      >
        <ModalContent>
          {(onClose) => (
            <ModalBody className="py-6 text-center">
              <div className="flex justify-center mb-2">
                <div className="p-3 bg-danger-50 text-danger rounded-full">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 6h18" />
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                    <line x1="10" x2="10" y1="11" y2="17" />
                    <line x1="14" x2="14" y1="11" y2="17" />
                  </svg>
                </div>
              </div>
              <h3 className="text-lg font-semibold">ยืนยันการลบงาน</h3>
              <p className="text-sm text-default-500 mt-1">
                คุณแน่ใจหรือไม่ที่จะลบงาน <br />
                <span className="font-semibold text-foreground">
                  "{selected?.taskName}"
                </span>{" "}
                ? <br />
                <span className="text-xs">การกระทำนี้ไม่สามารถย้อนกลับได้</span>
              </p>

              <div className="flex gap-3 justify-center mt-5">
                <Button
                  variant="flat"
                  onPress={onClose}
                  isDisabled={isDeletingTask}
                  className="px-6 font-medium"
                >
                  ยกเลิก
                </Button>
                <Button
                  color="danger"
                  onPress={handleDeleteTask}
                  isLoading={isDeletingTask}
                  className="px-6 font-medium"
                >
                  ใช่, ลบงานเลย
                </Button>
              </div>
            </ModalBody>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
};

export default ProjectDetail;