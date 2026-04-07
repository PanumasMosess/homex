"use client";

import StatusBoard from "@/components/dashboard/StatusBoard";
import { ConstructionDashboardProp } from "@/lib/type";
import {
  Calendar,
  Download,
  TrendingDown,
  ListTodo,
  AlertCircle,
  Video,
  FileText,
  CheckCircle2,
  Clock,
  CircleDashed,
  MoreHorizontal,
} from "lucide-react";
import RiskScoreDashboard from "./RiskScoreDashboard";
import { useEffect, useState } from "react";
import {
  getProjectPlannedProgress,
  getTaskStatusCountsBoard,
} from "@/lib/actions/actionProject";

export default function ConstructionDashboard({
  projectId,
  organizationId,
  currentUserId,
  projectInfo,
  projectProgress,
  expenses,
}: ConstructionDashboardProp) {
  const [isLoading, setIsLoading] = useState(true);
  const [counts, setCounts] = useState({
    todo: 0,
    progress: 0,
    done: 0,
    delay: 0,
  });
  const [planProgress, setPlanProgress] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        const [statusData, planData] = await Promise.all([
          getTaskStatusCountsBoard(projectId),
          getProjectPlannedProgress(projectId),
        ]);

        setCounts(statusData);
        setPlanProgress(planData);
      } catch (error) {
        console.error("❌ Fetch Data Error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [projectId]);

  const currentDateTime = new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());

  return (
    <div className="min-h-screen bg-[#0e1116] text-zinc-100 p-6 font-sans">
      {/* Header Section */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">
              {projectInfo?.name}
            </h1>
            <span className="bg-blue-900/50 text-blue-400 text-xs px-2 py-1 rounded border border-blue-800/50">
              {projectInfo?.code}
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            อัปเดตล่าสุด: {currentDateTime} น. โดย System
          </p>
        </div>
        <div className="flex gap-3">
          {/* <button className="flex items-center gap-2 bg-[#1c2128] hover:bg-[#2d333b] text-sm px-4 py-2 rounded-lg border border-zinc-700 transition-colors">
            <Calendar className="w-4 h-4" />
            เดือนนี้
          </button>
          <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg transition-colors shadow-lg shadow-blue-500/20">
            <Download className="w-4 h-4" />
            Export Report
          </button> */}
        </div>
      </div>

      {/* KPI Cards (4 Columns) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {/* Card 1: Progress */}
        <div className="bg-[#161b22] border border-zinc-800/80 p-5 rounded-xl flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-sm text-zinc-400">ความคืบหน้าโครงการ</h3>
            <TrendingDown className="w-4 h-4 text-blue-500" />
          </div>
          <div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-3xl font-bold text-white">
                {projectProgress ?? 0}%
              </span>
              {/* <span className="bg-red-950/50 text-red-400 text-[10px] px-2 py-0.5 rounded border border-red-900/50">
                -2% จากแผน
              </span> */}
            </div>
            <div className="w-full bg-zinc-800 rounded-full h-1.5">
              <div
                className="bg-blue-600 h-1.5 rounded-full"
                style={{ width: "37%" }}
              ></div>
            </div>
          </div>
        </div>

        {/* Card 2: Budget */}
        <div className="bg-[#161b22] border border-zinc-800/80 p-5 rounded-xl flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-sm text-zinc-400">งบประมาณที่ใช้ไป</h3>
            <div className="w-4 h-4 bg-orange-500 rounded-sm"></div>
          </div>
          <div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-3xl font-bold text-white">
                {expenses?.toLocaleString()}
              </span>
              <span className="text-sm text-zinc-400">บาท.</span>
            </div>
            <p className="text-[10px] text-zinc-500 mb-2">
              จากงบรวม {projectInfo?.budget?.toLocaleString()} บาท (ใช้ไปแล้ว{" "}
              {projectInfo?.budget
                ? (((expenses ?? 0) / projectInfo.budget) * 100).toFixed(1)
                : 0}
              %)
            </p>
            <div className="w-full bg-zinc-800 rounded-full h-1.5 flex overflow-hidden">
              <div
                className="bg-orange-500 h-1.5"
                style={{ width: "80%" }}
              ></div>
            </div>
          </div>
        </div>

        {/* Card 3: Tasks */}
        <StatusBoard
          todo={counts.todo}
          progress={counts.progress}
          done={counts.done}
          delay={counts.delay}
          isLoading={isLoading}
        />

        {/* Card 4: AI Risk Score */}
        <RiskScoreDashboard
          actualProgress={projectProgress ?? 0}
          plannedProgress={planProgress ?? 0}
          budgetSpentPercent={Number(
            projectInfo?.budget
              ? (((expenses ?? 0) / projectInfo.budget) * 100).toFixed(1)
              : 0,
          )}
          delayTasksCount={counts.delay}
        />
      </div>

      {/* Middle Section (2 Columns: Actions 2/3, Phases 1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Left: Action Required */}
        <div className="bg-[#161b22] border border-zinc-800/80 rounded-xl p-5 lg:col-span-2">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-base font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              สิ่งที่ต้องจัดการด่วน (Action Required)
            </h2>
            <button className="text-xs text-blue-400 hover:text-blue-300">
              ดูทั้งหมด
            </button>
          </div>

          <div className="space-y-4">
            {/* Action Item 1 */}
            {/* <div className="flex gap-4 items-start pb-4 border-b border-zinc-800/50">
              <div className="w-10 h-10 rounded-full bg-red-950/50 border border-red-900/50 flex items-center justify-center shrink-0">
                <Calendar className="w-4 h-4 text-red-400" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h4 className="text-sm font-medium text-white mb-1">
                    ประกอบโครงเหล็กพร้อมรถเครน ล่าช้า
                  </h4>
                  <span className="text-[10px] text-zinc-500">
                    2 ชม. ที่แล้ว
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mb-2">
                  Gantt Chart แจ้งเตือน: งานล่าช้ากว่าแผน 3 วัน
                  กระทบงานเทพื้นชั้น 1
                </p>
                <span className="bg-zinc-800 text-zinc-300 text-[10px] px-2 py-1 rounded">
                  หมวด: Structure
                </span>
              </div>
            </div> */}

            {/* Action Item 2 */}
            <div className="flex gap-4 items-start pb-4 border-b border-zinc-800/50">
              {/* <div className="w-10 h-10 rounded-full bg-orange-950/50 border border-orange-900/50 flex items-center justify-center shrink-0">
                <Video className="w-4 h-4 text-orange-400" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h4 className="text-sm font-medium text-white mb-1">
                    AI ตรวจพบเครื่องจักรหยุดทำงาน
                  </h4>
                  <span className="text-[10px] text-zinc-500">10:30 น.</span>
                </div>
                <p className="text-xs text-zinc-400 mb-2">
                  กล้องหน้าตรวจงาน (SN: 866492840)
                  ตรวจพบรถเครนหยุดทำงานผิดปกติเกิน 1 ชม.
                </p>
                <span className="bg-orange-950 text-orange-400 border border-orange-900/50 text-[10px] px-2 py-1 rounded">
                  ดูภาพ CCTV
                </span>
              </div> */}
            </div>

            {/* Action Item 3 */}
            <div className="flex gap-4 items-start">
              {/* <div className="w-10 h-10 rounded-full bg-blue-950/50 border border-blue-900/50 flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4 text-blue-400" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h4 className="text-sm font-medium text-white mb-1">
                    รออนุมัติแบบ As-Built ชั้น 1-3
                  </h4>
                  <span className="text-[10px] text-zinc-500">เมื่อวานนี้</span>
                </div>
                <p className="text-xs text-zinc-400">
                  ไฟแนนซ์อัปโหลดเอกสารใหม่
                  ต้องการการอนุมัติก่อนเริ่มงานระบบประปา
                </p>
              </div> */}
            </div>
          </div>
        </div>

        {/* Right: Phases */}
        <div className="bg-[#161b22] border border-zinc-800/80 rounded-xl p-5">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-base font-semibold flex items-center gap-2">
              <ListTodo className="w-4 h-4 text-blue-400" />
              ภาพรวมรายเฟส (Phases)
            </h2>
          </div>

          <div className="space-y-6">
            {/* <div>
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2 text-sm text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Foundation (งานฐานราก)</span>
                </div>
                <span className="text-sm font-bold text-emerald-400">100%</span>
              </div>
              <div className="w-full bg-zinc-800 rounded-full h-2">
                <div
                  className="bg-emerald-500 h-2 rounded-full"
                  style={{ width: "100%" }}
                ></div>
              </div>
            </div> */}

            {/* Phase 2 */}
            {/* <div>
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2 text-sm text-blue-400">
                  <Clock className="w-4 h-4" />
                  <span>Structure (งานโครงสร้าง)</span>
                </div>
                <span className="text-sm font-bold text-blue-400">67%</span>
              </div>
              <div className="w-full bg-zinc-800 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: "67%" }}
                ></div>
              </div>
            </div> */}

            {/* Phase 3 */}
            {/* <div>
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2 text-sm text-zinc-400">
                  <CircleDashed className="w-4 h-4" />
                  <span>System (งานระบบ)</span>
                </div>
                <span className="text-sm font-bold text-zinc-400">10%</span>
              </div>
              <div className="w-full bg-zinc-800 rounded-full h-2">
                <div
                  className="bg-zinc-600 h-2 rounded-full"
                  style={{ width: "10%" }}
                ></div>
              </div>
            </div> */}
          </div>

          {/* <button className="w-full mt-8 bg-[#1c2128] hover:bg-[#2d333b] border border-zinc-700 text-xs text-white py-2.5 rounded-lg transition-colors">
            เปิดดู Gantt Chart เต็ม
          </button> */}
        </div>
      </div>

      {/* Bottom Section (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Update Feed */}
        <div className="bg-[#161b22] border border-zinc-800/80 rounded-xl p-5">
          <h2 className="text-base font-semibold flex items-center gap-2 mb-5">
            <Video className="w-4 h-4 text-purple-400" />
            อัปเดตหน้างานล่าสุด
          </h2>
          <div className="flex gap-3">
            {/* <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold text-white shrink-0">
              อส
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="text-sm font-medium text-white">
                  สมบุญ ศรีประเสริฐ
                </h4>
                <span className="bg-emerald-950/50 text-emerald-400 border border-emerald-900/50 text-[10px] px-2 py-0.5 rounded flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> อัปเดตงาน
                </span>
              </div>
              <p className="text-[10px] text-zinc-500 mb-2">4 ชั่วโมงที่แล้ว</p>
              <p className="text-sm text-zinc-300 mb-3">
                สำเร็จรายการย่อย "งานเดินท่อเชื่อมต่อระบบ" สำหรับถังแซท 5000
                ลิตร
              </p>
              <div className="w-full h-32 bg-[#1c2128] border border-zinc-800 rounded-lg flex items-center justify-center overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-t from-[#161b22] to-transparent"></div>
                <span className="text-zinc-500 text-xs z-10 flex items-center gap-2">
                  <Video className="w-4 h-4" /> Site Photo Uploaded
                </span>
              </div>
            </div> */}
          </div>
        </div>

        {/* Live View */}
        <div className="bg-[#161b22] border border-zinc-800/80 rounded-xl p-5">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-base font-semibold flex items-center gap-2">
              <Video className="w-4 h-4 text-emerald-400" />
              สภาพหน้างานสด (Live View)
            </h2>
            <div className="flex gap-2">
              <span className="text-[10px] bg-zinc-800 px-2 py-1 rounded text-zinc-300">
                360° Plan
              </span>
              <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-900/50 px-2 py-1 rounded">
                CCTV
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 h-48">
            {/* <div className="relative rounded-lg overflow-hidden border border-zinc-800 group cursor-pointer">
              <div className="absolute inset-0 bg-zinc-800 bg-[url('https://images.unsplash.com/photo-1541888086425-d81bb19240f5?q=80&w=800&auto=format&fit=crop')] bg-cover bg-center opacity-60 mix-blend-overlay"></div>
              <div className="absolute top-2 right-2 bg-emerald-500 text-black text-[9px] font-bold px-1.5 py-0.5 rounded">
                ONLINE
              </div>
              <div className="absolute bottom-0 left-0 w-full p-2 bg-gradient-to-t from-black/80 to-transparent">
                <h4 className="text-xs text-white font-medium">
                  กล้องหน้าตรวจงาน
                </h4>
                <p className="text-[9px] text-zinc-400">AI: หยุดทำงาน (1h)</p>
              </div>
            </div>

            <div className="relative rounded-lg overflow-hidden border border-zinc-800 group cursor-pointer">
              <div className="absolute inset-0 bg-zinc-800 bg-[url('https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=800&auto=format&fit=crop')] bg-cover bg-center opacity-60 mix-blend-overlay"></div>
              <div className="absolute top-2 right-2 bg-emerald-500 text-black text-[9px] font-bold px-1.5 py-0.5 rounded">
                ONLINE
              </div>
              <div className="absolute bottom-0 left-0 w-full p-2 bg-gradient-to-t from-black/80 to-transparent">
                <h4 className="text-xs text-white font-medium">
                  กล้องไซต์งาน A
                </h4>
                <p className="text-[9px] text-zinc-400">AI: ปกติ</p>
              </div>
            </div> */}
          </div>
        </div>
      </div>
    </div>
  );
}
