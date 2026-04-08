"use client";

import StatusBoard from "@/components/dashboard/StatusBoard";
import { ActionRequiredTask, ConstructionDashboardProp } from "@/lib/type";
import {
  Calendar,
  TrendingDown,
  ListTodo,
  AlertCircle,
  Video,
  CheckCircle2,
  Clock,
  CircleDashed,
} from "lucide-react";
import RiskScoreDashboard from "./RiskScoreDashboard";
import { useEffect, useState } from "react";
import {
  getProjectPlannedProgress,
  getTaskDataForAIAnalysis,
  getTaskStatusCountsBoard,
} from "@/lib/actions/actionProject";
import { analyzeProjectActions } from "@/lib/ai/geminiAI";
import ActionRequiredList from "./ActionRequiredList";

export default function ConstructionDashboard({
  projectId,
  organizationId,
  currentUserId,
  projectInfo,
  projectProgress,
  expenses,
}: ConstructionDashboardProp) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [counts, setCounts] = useState({
    todo: 0,
    progress: 0,
    done: 0,
    delay: 0,
  });
  const [planProgress, setPlanProgress] = useState(0);
  const [actionTasks, setActionTasks] = useState<any[]>([]);
  const [aiActions, setAiActions] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setIsAnalyzing(true);

        const [statusData, planData, actionData] = await Promise.all([
          getTaskStatusCountsBoard(projectId),
          getProjectPlannedProgress(projectId),
          getTaskDataForAIAnalysis(projectId),
        ]);

        setCounts(statusData);
        setPlanProgress(planData);
        setActionTasks(actionData.tasks);

        setIsLoading(false);

        if (actionData.tasks.length > 0) {
          const analysisResult = await analyzeProjectActions(
            actionData.tasks,
            actionData.referenceDate,
          );
          setAiActions(analysisResult);
        } else {
          setAiActions([]);
        }
      } catch (error) {
        console.error("❌ Fetch Data Error:", error);
      } finally {
        setIsLoading(false);
        setIsAnalyzing(false);
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
            </div>
            <div className="w-full bg-zinc-800 rounded-full h-1.5">
              <div
                className="bg-blue-600 h-1.5 rounded-full"
                style={{ width: `${projectProgress ?? 0}%` }}
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
                style={{
                  width: `${projectInfo?.budget ? ((expenses ?? 0) / projectInfo.budget) * 100 : 0}%`,
                }}
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
        {/* 🌟 Left: Action Required (ดึงจาก AI) 🌟 */}
        <ActionRequiredList isAnalyzing={isAnalyzing} aiActions={aiActions} />

        {/* Right: Phases */}
        <div className="bg-[#161b22] border border-zinc-800/80 rounded-xl p-5">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-base font-semibold flex items-center gap-2">
              <ListTodo className="w-4 h-4 text-blue-400" />
              ภาพรวมรายเฟส (Phases)
            </h2>
          </div>
          <div className="space-y-6">
            <div className="text-xs text-zinc-500 text-center">
              ยังไม่มีข้อมูลเฟส
            </div>
          </div>
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
          <div className="flex gap-3"></div>
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
          <div className="grid grid-cols-2 gap-3 h-48"></div>
        </div>
      </div>
    </div>
  );
}
