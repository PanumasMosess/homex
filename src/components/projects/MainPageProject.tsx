"use client";

import { Card, CardBody, Button, Input, Chip, useDisclosure } from "@heroui/react";
import { Plus, Search, Building2 } from "lucide-react";
import ProjectCard from "./ProjectCard";
import { CreateProject } from "./forms/createProject";
import React, { useMemo, useState } from "react";
import { MainPageProjectProps } from "@/lib/type";

// const projects = [
//   {
//     id: 1,
//     name: "บ้านพักอาศัยคุณสมชาย",
//     client: "คุณสมชาย ใจดี",
//     address: "บางนา, กรุงเทพฯ",
//     status: "In Progress",
//     progress: 65,
//     dueDate: "30 Dec 2024",
//     image:
//       "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=2070&auto=format&fit=crop",
//     budget: "4.5M",
//   },
//   {
//     id: 2,
//     name: "Renovate ร้านกาแฟ Aroi",
//     client: "บริษัท อร่อย จำกัด",
//     address: "ทองหล่อ, กรุงเทพฯ",
//     status: "Planning",
//     progress: 15,
//     dueDate: "15 Feb 2025",
//     image:
//       "https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=2089&auto=format&fit=crop",
//     budget: "1.2M",
//   },
//   {
//     id: 3,
//     name: "อาคารพาณิชย์ 3 คูหา",
//     client: "คุณวิชัย ลงทุน",
//     address: "เมือง, ชลบุรี",
//     status: "Completed",
//     progress: 100,
//     dueDate: "01 Jan 2024",
//     image:
//       "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop",
//     budget: "8.0M",
//   },
//   {
//     id: 4,
//     name: "ต่อเติมครัวหลังบ้าน",
//     client: "คุณแม่ณี",
//     address: "นนทบุรี",
//     status: "In Progress",
//     progress: 40,
//     dueDate: "20 Mar 2024",
//     image:
//       "https://images.unsplash.com/photo-1590674899505-1c5c4195c326?q=80&w=2070&auto=format&fit=crop",
//     budget: "0.3M",
//   },
// ];


const MainPageProject = ({
  organizationId,
  currentUserId,
  projects,
}: MainPageProjectProps) => {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const tabs = ["All", "IN_PROGRESS", "DONE", "PLANNING"] as const;
  type TabKey = (typeof tabs)[number];

  const labelMap: Record<TabKey, string> = {
    All: "All",
    IN_PROGRESS: "In Progress",
    DONE: "Completed",
    PLANNING: "PLANNING",
  };

  const normalizeStatus = (s?: string) => (s ?? "").toUpperCase().trim();

  const [activeTab, setActiveTab] = useState<TabKey>("All");

  const [q, setQ] = useState("");

  const norm = (s?: any) => String(s ?? "").toLowerCase().trim();

  // debounce เบาๆ กันกระตุก
  const [qDebounced, setQDebounced] = useState("");
  React.useEffect(() => {
    const t = setTimeout(() => setQDebounced(q), 200);
    return () => clearTimeout(t);
  }, [q]);

  const filteredProjects = useMemo(() => {
    // 1) filter by tab ก่อน
    let list = projects;
    if (activeTab !== "All") {
      list = list.filter((p) => normalizeStatus(p.status) === activeTab);
    }

    // 2) filter by search
    const keyword = norm(qDebounced);
    if (!keyword) return list;

    return list.filter((p) => {
      const hay = [
        p.name,
        p.client,
        p.address,
        p.status,
        p.startPlanned,
        p.finishPlanned,
        p.budget,
        p.durationDays,
      ]
        .map(norm)
        .join(" ");

      return hay.includes(keyword);
    });
  }, [projects, activeTab, qDebounced]);

  return (
    // ✅ Mobile Fix 1: ลด Padding รอบนอกเหลือ p-3 และเพิ่ม pb-24 (กันตกขอบล่าง)
    <div className="p-3 sm:p-6 lg:p-8 max-w-[1600px] mx-auto min-h-screen pb-24">

      {/* --- Header Section --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4 sm:mb-8">
        <div>
          <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold flex items-center gap-2">
            <Building2 className="text-orange-500 w-5 h-5 sm:w-8 sm:h-8" /> Projects
          </h1>
          <p className="text-gray-500 text-[10px] sm:text-sm mt-0.5">
            จัดการและติดตามความคืบหน้าโครงการทั้งหมด ({filteredProjects.length})
          </p>
        </div>

        {/* ✅ Mobile Fix 2: Search Bar เต็มความกว้าง แต่ไม่สูงเกินไป */}
        <div className="flex flex-col sm:flex-row w-full md:w-auto gap-2 sm:gap-3">
          <Input
            classNames={{
              base: "w-full sm:w-64 h-10 sm:h-11",
              mainWrapper: "h-full",
              input: "text-small",
              inputWrapper: "h-full font-normal text-default-500 bg-default-400/20 dark:bg-default-500/20 rounded-full px-4",
            }}
            value={q}
            onValueChange={setQ}
            isClearable
            onClear={() => setQ("")}
            placeholder="ค้นหา..."
            size="sm"
            startContent={<Search size={16} />}
            type="search"
          />

          <Button
            onPress={onOpen}
            className="w-full sm:w-auto bg-black text-white dark:bg-white dark:text-black font-medium shadow-md h-10 sm:h-11"
            radius="full"
          >
            <Plus size={18} /> <span className="text-sm">สร้างโครงการ</span>
          </Button>
        </div>
      </div>

      {/* --- Filter Tabs --- */}
      {/* ✅ Mobile Fix 3: Scroll แนวนอนได้ลื่นๆ ไม่ล้นจอ */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide -mx-3 px-3 sm:mx-0 sm:px-0">
        {tabs.map((tab) => {
          const isActive = tab === activeTab;
          return (
            <Chip
              key={tab}
              onClick={() => setActiveTab(tab)}
              variant={isActive ? "solid" : "bordered"}
              color={isActive ? "primary" : "default"}
              className={`cursor-pointer shrink-0 h-8 transition-all ${isActive ? "shadow-sm" : "border-default-200"
                }`}
              size="sm"
            >
              {labelMap[tab]}
            </Chip>
          );
        })}
      </div>

      {/* --- Grid Section --- */}
      {/* ✅ Mobile Fix 4: gap-3 พอดีมือถือ, grid-cols-1 เต็มจอแนวนอน */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
        {filteredProjects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}

        {/* Create Card Button */}
        <div onClick={onOpen} className="group h-full">
          <Card
            className="h-full min-h-[160px] sm:min-h-[360px] border border-dashed border-default-300 bg-transparent hover:border-primary hover:bg-default-50 transition-all cursor-pointer shadow-none"
          >
            <CardBody className="flex flex-col items-center justify-center gap-2 text-default-400">
              <div className="p-3 rounded-full bg-default-100 group-hover:bg-primary/10 transition-colors">
                <Plus size={24} />
              </div>
              <span className="font-medium text-sm sm:text-lg">Create New</span>
            </CardBody>
          </Card>
        </div>
      </div>

      <CreateProject
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        organizationId={organizationId}
        currentUserId={currentUserId}
      />
    </div>
  );
};

export default MainPageProject;