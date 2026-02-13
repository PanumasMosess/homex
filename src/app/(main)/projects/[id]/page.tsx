"use client";

import React, { useState, useMemo } from "react";
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
} from "@heroui/react";

import {
  DndContext,
  useDraggable,
  useDroppable,
  closestCorners,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";

/* ================= TYPES ================= */

type Status = "todo" | "progress" | "done";
type Tab = "all" | "progress" | "done" | "todo";

interface Subtask {
  id: number;
  name: string;
  done: boolean;
}

interface Task {
  id: number;
  name: string;
  image: string;
  status: Status;
  startAt?: string;
  subtasks: Subtask[];
}

/* ================= MOCK ================= */

const mockTasks: Task[] = [
  {
    id: 1,
    name: "สำรวจพื้นที่และวางผังอาคาร",
    status: "done",
    image:
      "https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=1200&auto=format&fit=crop",
    startAt: "01 ก.พ. 2568",
    subtasks: [
      { id: 1, name: "สำรวจระดับพื้นที่ (Site Survey)", done: true },
      { id: 2, name: "ตรวจสอบแนวเขตที่ดิน", done: true },
      { id: 3, name: "กำหนดตำแหน่งอาคาร (Setting Out)", done: true },
      { id: 4, name: "ตรวจสอบสภาพดิน", done: true },
    ],
  },
  {
    id: 2,
    name: "เตรียมพื้นที่ก่อสร้าง",
    status: "progress",
    image:
      "https://images.unsplash.com/photo-1597262975002-c5c3b14bbd62?q=80&w=1200&auto=format&fit=crop",
    startAt: "03 ก.พ. 2568",
    subtasks: [
      { id: 1, name: "เคลียร์พื้นที่", done: true },
      { id: 2, name: "รื้อถอนสิ่งปลูกสร้างเดิม", done: true },
      { id: 3, name: "ปรับระดับหน้าดิน", done: false },
      { id: 4, name: "ตั้งรั้วชั่วคราวไซต์งาน", done: false },
    ],
  },
  {
    id: 3,
    name: "งานฐานราก",
    status: "progress",
    image:
      "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=1200&auto=format&fit=crop",
    startAt: "05 ก.พ. 2568",
    subtasks: [
      { id: 1, name: "ขุดหลุมฐานราก", done: true },
      { id: 2, name: "เทพื้น Lean Concrete", done: true },
      { id: 3, name: "วางเหล็กเสริม", done: false },
      { id: 4, name: "ติดตั้งแบบหล่อ", done: false },
      { id: 5, name: "เทคอนกรีตฐานราก", done: false },
    ],
  },
  {
    id: 4,
    name: "โครงสร้างเสาและคาน",
    status: "todo",
    image:
      "https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=1200&auto=format&fit=crop",
    subtasks: [
      { id: 1, name: "ตั้งแบบหล่อเสา", done: false },
      { id: 2, name: "ผูกเหล็กเสา", done: false },
      { id: 3, name: "เทคอนกรีตเสา", done: false },
      { id: 4, name: "ติดตั้งแบบคาน", done: false },
      { id: 5, name: "เทคานและพื้น", done: false },
    ],
  },
  {
    id: 5,
    name: "งานโครงหลังคา",
    status: "todo",
    image:
      "https://images.unsplash.com/photo-1605146769289-440113cc3d00?q=80&w=1200&auto=format&fit=crop",
    subtasks: [
      { id: 1, name: "ติดตั้งโครงหลังคา", done: false },
      { id: 2, name: "มุงแผ่นหลังคา", done: false },
      { id: 3, name: "ติดตั้งฉนวนกันความร้อน", done: false },
      { id: 4, name: "ติดตั้งรางน้ำฝน", done: false },
    ],
  },
  {
    id: 6,
    name: "งานระบบไฟฟ้า",
    status: "progress",
    image:
      "https://images.unsplash.com/photo-1621905251918-48416bd8575a?q=80&w=1200&auto=format&fit=crop",
    startAt: "12 ก.พ. 2568",
    subtasks: [
      { id: 1, name: "เดินท่อร้อยสายไฟ", done: true },
      { id: 2, name: "เดินสายไฟหลัก", done: true },
      { id: 3, name: "ติดตั้งตู้ไฟ", done: false },
      { id: 4, name: "ติดตั้งสวิตช์และปลั๊ก", done: false },
      { id: 5, name: "ทดสอบระบบไฟฟ้า", done: false },
    ],
  },
  {
    id: 7,
    name: "งานระบบประปา",
    status: "todo",
    image:
      "https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=1200&auto=format&fit=crop",
    subtasks: [
      { id: 1, name: "วางท่อน้ำดี", done: false },
      { id: 2, name: "วางท่อน้ำทิ้ง", done: false },
      { id: 3, name: "ติดตั้งปั๊มน้ำ", done: false },
      { id: 4, name: "ทดสอบแรงดันน้ำ", done: false },
    ],
  },
  {
    id: 8,
    name: "งานผนังและฉาบ",
    status: "todo",
    image:
      "https://images.unsplash.com/photo-1590650046871-92c887180603?q=80&w=1200&auto=format&fit=crop",
    subtasks: [
      { id: 1, name: "ก่อผนังอิฐ", done: false },
      { id: 2, name: "เดินท่อซ่อนผนัง", done: false },
      { id: 3, name: "ฉาบปูนผนัง", done: false },
      { id: 4, name: "ขัดผิวผนัง", done: false },
    ],
  },
  {
    id: 9,
    name: "งานตกแต่งภายใน",
    status: "todo",
    image:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1200&auto=format&fit=crop",
    subtasks: [
      { id: 1, name: "ติดตั้งฝ้าเพดาน", done: false },
      { id: 2, name: "ปูกระเบื้อง", done: false },
      { id: 3, name: "ติดตั้งประตูหน้าต่าง", done: false },
      { id: 4, name: "ติดตั้งสุขภัณฑ์", done: false },
    ],
  },
  {
    id: 10,
    name: "ตรวจรับและส่งมอบงาน",
    status: "todo",
    image:
      "https://images.unsplash.com/photo-1570129477492-45c003edd2be?q=80&w=1200&auto=format&fit=crop",
    subtasks: [
      { id: 1, name: "ตรวจโครงสร้าง", done: false },
      { id: 2, name: "ตรวจระบบไฟฟ้า", done: false },
      { id: 3, name: "ตรวจระบบประปา", done: false },
      { id: 4, name: "เก็บ defect", done: false },
      { id: 5, name: "ส่งมอบบ้าน", done: false },
    ],
  },
];

/* ================= PAGE ================= */

export default function ProjectDetail() {
  const [tasks, setTasks] = useState(mockTasks);
  const [view, setView] = useState<"card" | "board">("card");
  const [selected, setSelected] = useState<Task | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("all");
  const [q, setQ] = useState("");
  const [priority, setPriority] = useState<"urgent" | "high" | "normal" | null>(null)

  React.useEffect(() => {
    if (view === "board") {
      setActiveTab("all");
      setQ("");
    }
  }, [view]);
  const { onOpen } = useDisclosure();

  const sensors = useSensors(useSensor(PointerSensor), useSensor(TouchSensor));
  const calcProgress = (t: Task) => {
    const done = t.subtasks.filter((s) => s.done).length;
    return Math.round((done / t.subtasks.length) * 100);
  };

  const filtered = useMemo(() => {
    let list = tasks;

    if (activeTab !== "all") {
      list = list.filter((t) => t.status === activeTab);
    }

    if (q) {
      list = list.filter((t) => t.name.toLowerCase().includes(q.toLowerCase()));
    }

    return list;
  }, [tasks, activeTab, q]);

  const projectProgress = useMemo(() => {
    const total = tasks.reduce((a, t) => a + calcProgress(t), 0);
    return Math.round(total / tasks.length);
  }, [tasks]);

  const handleDragEnd = (e: any) => {
    const { active, over } = e;
    if (!over) return;
    setTasks((prev) =>
      prev.map((t) => (t.id === active.id ? { ...t, status: over.id } : t)),
    );
  };

  /* ================= DRAG ITEM ================= */

  function DragItem({ t }: any) {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
      id: t.id,
    });
    const style = {
      transform: transform
        ? `translate3d(${transform.x}px,${transform.y}px,0)`
        : undefined,
    };

    return (
      <div
        ref={setNodeRef}
        style={style}
        {...listeners}
        {...attributes}
        className="bg-default-200 dark:bg-zinc-800 rounded-lg cursor-grab touch-none"
      >
        {/* CLICK ZONE (แก้ modal ไม่ขึ้น) */}
        <div onClick={() => setSelected(t)} className="flex gap-3 p-3">
          <img src={t.image} className="w-12 h-12 rounded object-cover" />
          <div>
            <p className="text-sm">{t.name}</p>
            <p className="text-xs text-default-500 dark:text-zinc-400">
              {calcProgress(t)}%
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* ================= DROP COLUMN ================= */

  function DropColumn({ status }: any) {
    const { setNodeRef } = useDroppable({ id: status });
    return (
      <div
        ref={setNodeRef}
        className="bg-default-100 dark:bg-zinc-900 border border-default-200 dark:border-zinc-800 p-4 rounded-xl space-y-3">
        <h3 className="font-semibold capitalize">{status}</h3>
        {tasks
          .filter((t) => t.status === status)
          .map((t) => (
            <DragItem key={t.id} t={t} />
          ))}
      </div>
    );
  }

  /* ================= UI ================= */
  return (
    <div className="p-3 sm:p-6 lg:p-8 max-w-[1600px] mx-auto min-h-screen space-y-6">
      {/* HERO — desktop unchanged */}
      <div
        className="
          bg-default-100 dark:bg-zinc-900
          rounded-3xl
          p-6 lg:p-8
          grid
          grid-cols-1
          md:grid-cols-[380px_1fr]
          lg:grid-cols-[560px_1fr]
          gap-6
          items-center
          overflow-hidden
        "
      >
        <video
          autoPlay
          muted
          loop
          className="
              w-full
              h-[200px]
              sm:h-[240px]
              md:h-[220px]
              lg:h-[320px]
              object-cover
              rounded-2xl
            "
          src="https://www.w3schools.com/html/mov_bbb.mp4"
        />
        <div className="space-y-4 min-w-0">
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold">
            โครงการบ้านพักอาศัย
          </h1>
          <p className="text-default-500 dark:text-zinc-400 text-sm">
            ลูกค้า: สมชาย ใจดี
          </p>
          <div className="flex gap-3 flex-wrap">
            <Chip color="primary">IN PROGRESS</Chip>
            <Chip variant="flat">{projectProgress}% Complete</Chip>
          </div>
          <Progress value={projectProgress} />
        </div>
      </div>

      {/* TOOLBAR */}

      <div className="flex items-start sm:items-center gap-4">
        {/* LEFT */}
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold flex items-center gap-2">
            <Building2 className="text-orange-500 w-6 h-6" />
            Tasks
          </h1>

          <p className="text-default-500 dark:text-zinc-400 text-sm">
            ติดตามและจัดการรายการงาน ({filtered.length})
          </p>
        </div>

        {/* RIGHT */}
        <Button
          onPress={onOpen}
          radius="full"
          className="ml-auto bg-black text-white dark:bg-white dark:text-black px-5 h-10"
        >
          + สร้างโครงการ
        </Button>
      </div>

      <div className="flex gap-3">
        <Button onPress={() => setView("card")}>Card</Button>
        <Button onPress={() => setView("board")}>Board</Button>
      </div>

      {/* CARD VIEW unchanged */}

      {view === "card" && (
        <>
          {/* 🔥 TOOLBAR สำหรับ CARD ONLY */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* FILTER */}
            <div className="flex gap-2 flex-wrap">
              {[
                { key: "all", label: "All" },
                { key: "todo", label: "Todo" },
                { key: "progress", label: "Progress" },
                { key: "done", label: "Done" },
              ].map((tab) => {
                const active = activeTab === tab.key;

                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as Tab)}
                    className={`
                        px-4
                        h-9
                        rounded-full
                        text-sm
                        transition-all
                        border

                        ${active
                        ? "bg-primary text-white border-primary shadow-sm"
                        : `
                        bg-transparent
                        text-default-900 dark:text-zinc-300
                        border-default-300 dark:border-zinc-700
                        hover:border-primary
                        hover:text-primary
                      `
                      }
                  `}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* SEARCH */}
            <Input
              placeholder="ค้นหา..."
              value={q}
              onValueChange={setQ}
              isClearable
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

          {/* CARD GRID */}
          <div
            className="
              grid
              grid-cols-1
              sm:grid-cols-2
              lg:grid-cols-3
              xl:grid-cols-4
              gap-6
              auto-rows-fr
            "
          >
            {filtered.map((t) => (
              <Card
                key={t.id}
                isPressable
                onPress={() => setSelected(t)}
                className="
                  h-full
                  bg-default-100
                  dark:bg-zinc-900
                  border
                  border-default-200
                  dark:border-zinc-800
                "
              >
                <CardBody className="space-y-3">
                  <img
                    src={t.image}
                    className="h-40 w-full object-cover rounded-lg"
                  />
                  <div className="flex justify-between">
                    <p>{t.name}</p>
                    <Chip size="sm">{t.status}</Chip>
                  </div>
                  <p className="text-xs text-default-500 dark:text-zinc-400">
                    Checklist {t.subtasks.filter((s) => s.done).length}/
                    {t.subtasks.length}
                  </p>
                  <Progress value={calcProgress(t)} />
                </CardBody>
              </Card>
            ))}

            {/* ADD NEW TASK CARD */}
<div onClick={onOpen} className="group h-full">

  <Card className="
    h-full
    border
    border-dashed
    border-default-300
    bg-transparent
    hover:border-primary
    transition-all
    cursor-pointer
    shadow-none
  ">

    <CardBody className="h-full flex items-center justify-center flex-col gap-2">

      <div className="p-3 rounded-full bg-default-100 group-hover:bg-primary/10">
        <Plus size={24}/>
      </div>

      <span>Create New</span>

    </CardBody>

  </Card>

</div>


          </div>
        </>
      )}

      {/* BOARD VIEW */}

      {view === "board" && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragEnd={handleDragEnd}
        >
          {/* desktop = เดิม / mobile = stack */}
          <div
            className="
              flex md:grid
              md:grid-cols-3
              gap-4 md:gap-6

              overflow-x-auto
              md:overflow-visible

              snap-x snap-mandatory
              pb-2
            "
          >
            <div className="min-w-[85%] sm:min-w-[70%] md:min-w-0 snap-start">
              <DropColumn status="todo" />
            </div>

            <div className="min-w-[85%] sm:min-w-[70%] md:min-w-0 snap-start">
              <DropColumn status="progress" />
            </div>

            <div className="min-w-[85%] sm:min-w-[70%] md:min-w-0 snap-start">
              <DropColumn status="done" />
            </div>
          </div>
        </DndContext>
      )}

      {/* ================= MODAL ================= */}

      <Modal
        isOpen={!!selected}
        onOpenChange={() => setSelected(null)}
        size="3xl"
        classNames={{
          base: `
          md:rounded-xl
          md:max-w-4xl
          md:my-10
          md:max-h-[90vh]
    
          max-md:rounded-none
          max-md:m-0
          max-md:h-screen
          max-md:max-w-full
          `,
        }}
      >
        <ModalContent
          className="
          max-md:h-screen
          max-md:flex
          max-md:flex-col
          max-md:overflow-hidden
        "
        >
          {selected && (
            <>
              {/* MOBILE HEADER */}
              <div className="md:hidden p-4 flex items-center gap-3 border-b border-zinc-800">
                <button onClick={() => setSelected(null)}>←</button>
                <p className="font-semibold">{selected.name}</p>
              </div>

              <ModalBody
                className="
                    space-y-5
                    md:py-8
                    md:px-2
                    md:overflow-y-auto   /* ✅ เพิ่มตรงนี้ */
                    md:my-auto   
                    scrollbar-hide
                    max-md:flex-1
                    max-md:overflow-y-auto
                    max-md:pb-20
                  "
              >
                {/* ================= HEADER ================= */}
                <div className="flex flex-col md:flex-row gap-8 md:px-6">
                  <img
                    src={selected.image}
                    className="
                    w-full
                    md:w-[320px]
                    h-[220px]
                    md:h-[200px]
                    object-cover
                    rounded-xl
                  "
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
                      เริ่มเมื่อ:
                      <span className="text-white ml-1">
                        {selected.startAt || "-"}
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

                {/* ================= CHECKLIST ================= */}
                <div className="space-y-3 md:px-6">
                  {selected.subtasks.map((s) => (
                    <div key={s.id} className="flex items-center gap-3">
                      <Checkbox isSelected={s.done}>{s.name}</Checkbox>
                    </div>
                  ))}
                </div>

                {/* ================= INFO / PRIORITY / COMMENTS ================= */}
                <div className="space-y-6 md:px-6">
                  {/* INFO */}
                  <div
                    className="bg-default-100
                    dark:bg-zinc-900
                    border
                    border-default-200
                    dark:border-zinc-800 rounded-xl p-5 space-y-3 text-sm"
                  >
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
                      <span>{selected.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-default-500 dark:text-zinc-400">
                        เริ่มเมื่อ
                      </span>
                      <span>{selected.startAt || "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-default-500 dark:text-zinc-400">
                        สถานะ
                      </span>
                      <span className="text-primary">กำลังทำ</span>
                    </div>
                  </div>

                  {/* PRIORITY */}
                  <div
                    className="bg-default-100
                    dark:bg-zinc-900
                    border
                    border-default-200
                    dark:border-zinc-800 rounded-xl p-5 space-y-3"
                  >
                    <p className="font-semibold">Priority</p>
                    <div className="flex gap-2 flex-wrap">
                      {/* 🔥 เร่งด่วน */}
                      <Chip
                        onClick={() => setPriority("urgent")}
                        className={`
                            cursor-pointer transition-all
                            ${priority === "urgent"
                            ? "bg-orange-500/20 text-orange-400 border border-orange-500"
                            : "bg-default-200 dark:bg-zinc-800 text-default-900 dark:text-zinc-300 border border-zinc-700 hover:border-orange-400"
                          }
                        `}
                      >
                        🔥 เร่งด่วน
                      </Chip>

                      {/* ❗ ด่วน */}
                      <Chip
                        onClick={() => setPriority("high")}
                        className={`
                          cursor-pointer transition-all
                          ${priority === "high"
                            ? "bg-red-500/20 text-red-500 border border-red-500"
                            : "bg-default-200 dark:bg-zinc-800 text-default-900 dark:text-zinc-300  border border-zinc-700 hover:border-red-400"
                          }
                        `}
                      >
                        ❗ ด่วน
                      </Chip>

                      {/* ⏳ เรื่อยๆ */}
                      <Chip
                        onClick={() => setPriority("normal")}
                        className={`
                            cursor-pointer transition-all
                            ${priority === "normal"
                            ? "bg-blue-500/20 text-blue-400 border border-blue-500"
                            : "bg-default-200 dark:bg-zinc-800 text-default-900 dark:text-zinc-300 border border-zinc-700 hover:border-blue-400"
                          }
                       `}
                      >
                        ⏳ เรื่อยๆ
                      </Chip>
                    </div>
                  </div>

                  {/* COMMENTS */}
                  <div
                    className="bg-default-100
                    dark:bg-zinc-900
                    border
                    border-default-200
                    dark:border-zinc-800 rounded-xl p-5 space-y-3"
                  >
                    <p className="font-semibold">Comments</p>
                    <input
                      placeholder="เขียนความคิดเห็น..."
                      className="w-full bg-default-200
                      dark:bg-zinc-800 rounded-lg p-3 outline-none text-sm"
                    />
                  </div>
                </div>
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
