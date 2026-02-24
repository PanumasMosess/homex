"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { Plus, Search, Building2 } from "lucide-react";

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
import { calcProgress, formatDate, getMediaType } from "@/lib/setting_data";
import { EmptyStateCard } from "./EmptyStateCard";
import { DropColumn } from "./DropColumn";
import { toast } from "react-toastify";
import {} from "@/lib/actions/actionIndex";
import { updateTaskStatus, updateVdoProject } from "@/lib/actions/actionProject";
import {
  checkVideoStatus,
  generationImage3D,
  startVideoJob,
} from "@/lib/ai/geminiAI";

const ProjectDetail = ({
  organizationId,
  currentUserId,
  dataDetail,
}: ProjectDetailProps) => {
  const router = useRouter();
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  // States
  const [tasks, setTasks] = useState<Task[]>([]);
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

  // Debounce Search
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQ(q), 300);
    return () => clearTimeout(timer);
  }, [q]);

  // Load Data
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

  // Memoized Data
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
    const total = tasks.reduce((a, t) => a + calcProgress(t), 0);
    return Math.round(total / tasks.length);
  }, [tasks]);

  // Callbacks
  // const handleDragEnd = useCallback((e: DragEndEvent) => {
  //   const { active, over } = e;
  //   if (!over) return;
  //   setTasks((prev) =>
  //     prev.map((t) =>
  //       t.id === active.id ? { ...t, status: over.id as string } : t,
  //     ),
  //   );
  // }, []);

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
      setIsGeneratingVideo(true);

      const prompt_vdo = `Locked-off camera. Time-lapse shows the rapid construction of the modern building from an empty plot. Active construction cranes, workers, and materials are visible and moving fast. The surrounding environment, including the street, cars, trees, and lighting, remains perfectly identical to the reference image throughout the entire video. The building finishes exactly as shown in the reference. Realistic. exactly 8 seconds duration, 720p resolution, 16:9 aspect ratio`;

      const startRes = await startVideoJob(prompt_vdo, projectInfo.image);

      if (!startRes.success || !startRes.operationName) {
        toast.error(startRes.error || "ไม่สามารถเริ่มสร้างวิดีโอได้");
        setIsGeneratingVideo(false);
        return;
      }

      console.log("ได้บัตรคิวมาแล้ว:", startRes.operationName);
      toast.info(
        "กำลังสร้างวิดีโอด้วย AI (อาจใช้เวลา 1-3 นาที) โปรดรอสักครู่...",
      );

      let isDone = false;
      let finalVideoUrl = "";

      while (!isDone) {
        await new Promise((resolve) => setTimeout(resolve, 10000));

        console.log("กำลังเช็คความคืบหน้า...");
        const checkRes = await checkVideoStatus(startRes.operationName);

        if (checkRes.status === "success" && checkRes.videoUrl) {
          isDone = true;
          finalVideoUrl = checkRes.videoUrl;
        } else if (checkRes.status === "error") {
          isDone = true;
          throw new Error(checkRes.error || "เกิดข้อผิดพลาดระหว่างสร้างวิดีโอ");
        } else {
          console.log("AI ยังทำไม่เสร็จ รอเช็ครอบถัดไป...");
        }
      }

      // 3. เมื่อได้ URL วิดีโอสุดท้ายมาแล้ว ให้อัปเดต State และ Database
      if (finalVideoUrl) {
        console.log("✅ ได้ Video URL สมบูรณ์แล้ว:", finalVideoUrl);

        // const finalVideoUrl = await generationImage3D(projectInfo.image, 25);
        // if (finalVideoUrl) {
        setProjectInfo((prev) => ({
          ...prev,
          // video: finalVideoUrl.answer ?? "",
          video: finalVideoUrl,
        }));

        const updateRes = await updateVdoProject(
          parseInt(projectInfo.id),
          // finalVideoUrl.answer ?? "",
          finalVideoUrl,
        );

        toast.success("สร้างและบันทึกสำเร็จ!");
      }
    } catch (error) {
      console.error("เกิดข้อผิดพลาดในการสร้างวิดีโอ:", error);
      toast.error("เกิดข้อผิดพลาดในการสร้างวิดีโอ");
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  const handleDragEnd = useCallback(async (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over) return;

    const taskId = active.id as number;
    const newStatus = over.id as string; 

    const taskToUpdate = tasks.find((t) => t.id === taskId);
    if (!taskToUpdate || taskToUpdate.status === newStatus) return;

    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, status: newStatus } : t,
      ),
    );

    try {

      const res = await updateTaskStatus(taskId, newStatus); 
      
      if (!res.success) {
        throw new Error(res.error || "บันทึกไม่สำเร็จ");
      }
      
      toast.success(`เปลี่ยนสถานะงานเป็น ${newStatus} แล้ว`);
    } catch (error) {
      console.error("Update Task Error:", error);
      toast.error("อัปเดตสถานะไม่สำเร็จ ระบบจะดึงข้อมูลเดิมกลับมา");
      
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId ? { ...t, status: taskToUpdate.status } : t,
        ),
      );
    }
  }, [tasks]); 

  const mediaUrl = projectInfo.video;
  const mediaType = getMediaType(mediaUrl);

  return (
    <div className="p-3 sm:p-6 lg:p-8 max-w-[1600px] mx-auto min-h-screen space-y-6">
      <div className="bg-default-100 dark:bg-zinc-900 rounded-3xl p-6 lg:p-8 grid grid-cols-1 md:grid-cols-[380px_1fr] lg:grid-cols-[560px_1fr] gap-6 items-center overflow-hidden">
        <div className="relative w-full h-[200px] sm:h-[240px] md:h-[220px] lg:h-[320px] rounded-2xl overflow-hidden bg-zinc-800">
          {/* ส่วน Loading Overlay */}
          {isGeneratingVideo && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
              <Spinner color="primary" size="lg" />
              <p className="text-white text-sm mt-3 font-medium animate-pulse">
                AI กำลังทำงาน... อาจใช้เวลา 1-5 นาทีโปรดรอซักครู่นะครับ
              </p>
            </div>
          )}

          {/* ส่วนแสดงผล Media โดยเช็คจาก mediaType */}
          {mediaType === "video" ? (
            <video
              key={mediaUrl}
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              className="w-full h-full object-cover"
              src={mediaUrl}
            />
          ) : mediaType === "image" ? (
            <img
              key={mediaUrl}
              src={mediaUrl}
              alt="Project Media"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-800/50 border-2 border-dashed border-zinc-700 text-zinc-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mb-3 opacity-60"
              >
                <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                <circle cx="9" cy="9" r="2" />
                <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
              </svg>
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
          <Progress value={projectProgress} />

          {/* 🌟 ปุ่มสร้างวิดีโอ */}
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
                { key: "ALL", label: "All" },
                { key: "TODO", label: "Todo" },
                { key: "PROGRESS", label: "Progress" },
                { key: "DONE", label: "Done" },
              ].map((tab) => {
                const active = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as Tab)}
                    className={`px-4 h-9 rounded-full text-sm transition-all border ${active ? "bg-primary text-white border-primary shadow-sm" : "bg-transparent text-default-900 dark:text-zinc-300 border-default-300 dark:border-zinc-700 hover:border-primary hover:text-primary"}`}
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
              type="search"
              classNames={{
                base: "w-full sm:w-64 h-10 sm:h-11",
                mainWrapper: "h-full",
                input: "text-small",
                inputWrapper:
                  "h-full font-normal text-default-500 bg-default-400/20 dark:bg-default-500/20 rounded-full px-4",
              }}
            />
          </div>

          {filteredTasks.length === 0 ? (
            <EmptyStateCard onOpen={onOpen} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-fr">
              {filteredTasks.map((t) => (
                <Card
                  key={t.id}
                  isPressable
                  onPress={() => handleSelectTask(t.id)}
                  className="h-full bg-default-100 dark:bg-zinc-900 border border-default-200 dark:border-zinc-800"
                >
                  <CardBody className="space-y-3">
                    <img
                      src={t.coverImageUrl || "/placeholder-image.jpg"}
                      className="h-40 w-full object-cover rounded-lg"
                      alt={t.taskName || "Task"}
                      loading="lazy"
                    />
                    <div className="flex justify-between">
                      <p className="truncate font-medium">
                        {t.taskName || "Untitled Task"}
                      </p>
                      <Chip size="sm">{t.status}</Chip>
                    </div>
                    <p className="text-xs text-default-500 dark:text-zinc-400">
                      Checklist{" "}
                      {t.subtasks?.filter((s) => s.status === 1).length || 0}/
                      {t.subtasks?.length || 0}
                    </p>
                    <Progress value={calcProgress(t)} />
                  </CardBody>
                </Card>
              ))}

              <div onClick={onOpen} className="group h-full">
                <Card className="h-full border border-dashed border-default-300 bg-transparent hover:border-primary transition-all cursor-pointer shadow-none">
                  <CardBody className="h-full flex items-center justify-center flex-col gap-2">
                    <div className="p-3 rounded-full bg-default-100 group-hover:bg-primary/10">
                      <Plus size={24} />
                    </div>
                    <span>สร้าง Task เอง</span>
                  </CardBody>
                </Card>
              </div>
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
            <div className="flex md:grid md:grid-cols-3 gap-4 md:gap-6 overflow-x-auto md:overflow-visible snap-x snap-mandatory pb-2">
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

      {/* --- MODAL --- */}
      <Modal
        isOpen={!!selected}
        onOpenChange={() => setSelectedId(null)}
        size="3xl"
        classNames={{
          base: `md:rounded-xl md:max-w-4xl md:my-10 md:max-h-[90vh] max-md:rounded-none max-md:m-0 max-md:h-screen max-md:max-w-full`,
        }}
      >
        <ModalContent className="max-md:h-screen max-md:flex max-md:flex-col max-md:overflow-hidden">
          {selected ? (
            <>
              <div className="md:hidden p-4 flex items-center gap-3 border-b border-zinc-800">
                <button onClick={() => setSelectedId(null)}>←</button>
                <p className="font-semibold truncate">
                  {selected.taskName || "Untitled Task"}
                </p>
              </div>

              <ModalBody className="space-y-5 md:py-8 md:px-2 md:overflow-y-auto md:my-auto scrollbar-hide max-md:flex-1 max-md:overflow-y-auto max-md:pb-20">
                <div className="flex flex-col md:flex-row gap-8 md:px-6">
                  <img
                    src={selected.coverImageUrl || "/placeholder-image.jpg"}
                    className="w-full md:w-[320px] h-[220px] md:h-[200px] object-cover rounded-xl"
                    alt={selected.taskName || "Task Image"}
                  />
                  <div className="flex-1 space-y-5">
                    <div className="flex gap-3">
                      <Button
                        color="primary"
                        className="flex-1 md:flex-none md:px-8 h-11"
                      >
                        ✓ เริ่มงาน
                      </Button>
                      <Button
                        variant="bordered"
                        className="flex-1 md:flex-none md:px-8 h-11"
                      >
                        เสร็จ
                      </Button>
                    </div>
                    <div className="text-sm text-default-500 dark:text-zinc-400">
                      เริ่มเมื่อ:{" "}
                      <span className="text-white ml-1">
                        {formatDate(selected.startPlanned)}
                      </span>
                    </div>
                    <div className="space-y-2 max-w-xl">
                      <div className="flex justify-between text-sm">
                        <span className="text-default-500 dark:text-zinc-400">
                          Progress
                        </span>
                        <span>{calcProgress(selected)}%</span>
                      </div>
                      <Progress
                        value={calcProgress(selected)}
                        className="h-2"
                      />
                    </div>
                    <Button color="primary" variant="flat">
                      + เพิ่มรายละเอียดงาน
                    </Button>
                  </div>
                </div>

                <div className="space-y-3 md:px-6">
                  {selected.subtasks && selected.subtasks.length > 0 ? (
                    selected.subtasks.map((s) => (
                      <div key={s.id} className="flex items-center gap-3">
                        <Checkbox isSelected={s.status === 1}>
                          {s.detailName}
                        </Checkbox>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-default-400 italic">
                      ไม่มีรายการย่อย (Subtasks)
                    </p>
                  )}
                </div>

                <div className="space-y-6 md:px-6">
                  {/* INFO */}
                  <div className="bg-default-100 dark:bg-zinc-900 border border-default-200 dark:border-zinc-800 rounded-xl p-5 space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-default-500 dark:text-zinc-400">
                        ผู้รับผิดชอบ
                      </span>
                      <span>P'Ohm</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-default-500 dark:text-zinc-400">
                        งานที่ทำ
                      </span>
                      <span>{selected.taskName || "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-default-500 dark:text-zinc-400">
                        เริ่มเมื่อ
                      </span>
                      <span>{formatDate(selected.startPlanned)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-default-500 dark:text-zinc-400">
                        สถานะ
                      </span>
                      <span className="text-primary capitalize">
                        {selected.status || "Todo"}
                      </span>
                    </div>
                  </div>

                  {/* Priority Section */}
                  <div className="bg-default-100 dark:bg-zinc-900 border border-default-200 dark:border-zinc-800 rounded-xl p-5 space-y-3">
                    <p className="font-semibold">Priority</p>
                    <div className="flex gap-2 flex-wrap">
                      <Chip
                        onClick={() => setPriority("urgent")}
                        className={`cursor-pointer transition-all ${
                          priority === "urgent"
                            ? "bg-orange-500/20 text-orange-400 border border-orange-500"
                            : "bg-default-200 dark:bg-zinc-800 text-default-900 dark:text-zinc-300 border border-zinc-700 hover:border-orange-400"
                        }`}
                      >
                        🔥 เร่งด่วน
                      </Chip>
                      <Chip
                        onClick={() => setPriority("high")}
                        className={`cursor-pointer transition-all ${
                          priority === "high"
                            ? "bg-red-500/20 text-red-500 border border-red-500"
                            : "bg-default-200 dark:bg-zinc-800 text-default-900 dark:text-zinc-300 border border-zinc-700 hover:border-red-400"
                        }`}
                      >
                        ❗ ด่วน
                      </Chip>
                      <Chip
                        onClick={() => setPriority("normal")}
                        className={`cursor-pointer transition-all ${
                          priority === "normal"
                            ? "bg-blue-500/20 text-blue-400 border border-blue-500"
                            : "bg-default-200 dark:bg-zinc-800 text-default-900 dark:text-zinc-300 border border-zinc-700 hover:border-blue-400"
                        }`}
                      >
                        ⏳ เรื่อยๆ
                      </Chip>
                    </div>
                  </div>

                  {/* COMMENTS */}
                  <div className="bg-default-100 dark:bg-zinc-900 border border-default-200 dark:border-zinc-800 rounded-xl p-5 space-y-3">
                    <p className="font-semibold">Comments</p>
                    <input
                      placeholder="เขียนความคิดเห็น..."
                      className="w-full bg-default-200 dark:bg-zinc-800 rounded-lg p-3 outline-none text-sm"
                    />
                  </div>
                </div>
              </ModalBody>
            </>
          ) : (
            <div className="flex h-full items-center justify-center">
              <p>ไม่พบข้อมูลงาน</p>
            </div>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
};

export default ProjectDetail;
