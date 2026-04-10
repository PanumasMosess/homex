"use client";

import StatusBoard from "@/components/dashboard/StatusBoard";
import { ConstructionDashboardProp } from "@/lib/type";
import { TrendingDown, Video } from "lucide-react";
import RiskScoreDashboard from "./RiskScoreDashboard";
import { useEffect, useState } from "react";
import {
  getProjectPlannedProgress,
  getTaskDataForAIAnalysis,
  getTaskDataForAIAnalysisSum,
  getTaskStatusCountsBoard,
} from "@/lib/actions/actionProject";
import {
  analyzeProjectActions,
  analyzeProjectOverview,
} from "@/lib/ai/geminiAI";
import ActionRequiredList from "./ActionRequiredList";
import ExecutiveSummary from "./ExecutiveSummary";
import ReadOnlyMapping360 from "./ReadOnlyMapping360";

export default function ConstructionDashboard({
  projectId,
  organizationId,
  projectInfo,
  projectProgress,
  expenses = 0,
}: ConstructionDashboardProp) {
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [aiSummary, setAiSummary] = useState<any>(null);
  const [isAnalyzingSummary, setIsAnalyzingSummary] = useState(true);

  const [counts, setCounts] = useState({
    todo: 0,
    progress: 0,
    done: 0,
    delay: 0,
  });
  const [planProgress, setPlanProgress] = useState(0);
  const [aiActions, setAiActions] = useState<any[]>([]);
  // 🌟 1. แยก mounted ออกมาเดี่ยวๆ เพื่อให้ UI โครงร่างแสดงทันทีที่เปิดเพจ
  useEffect(() => {
    setMounted(true);
  }, []);

  // 🌟 2. ดึงข้อมูลเมื่อ projectId เปลี่ยน
  useEffect(() => {
    if (!projectId) return;

    const fetchData = async () => {
      try {
        setIsLoading(true);
        setIsAnalyzing(true);
        setIsAnalyzingSummary(true);

        const [statusData, planData, actionData, summaryData] =
          await Promise.all([
            getTaskStatusCountsBoard(projectId),
            getProjectPlannedProgress(projectId),
            getTaskDataForAIAnalysis(projectId),
            getTaskDataForAIAnalysisSum(projectId),
          ]);

        setCounts(statusData);
        setPlanProgress(planData);
        setIsLoading(false);

        const aiPromises = [];

        if (actionData?.tasks?.length > 0) {
          const actionPromise = analyzeProjectActions(
            actionData.tasks,
            actionData.projectInfo,
            actionData.referenceDate,
          )
            .then((res) => setAiActions(res))
            .catch((err) => console.error(err))
            .finally(() => setIsAnalyzing(false));

          aiPromises.push(actionPromise);
        } else {
          setAiActions([]);
          setIsAnalyzing(false);
        }

        if (summaryData?.tasks?.length > 0) {
          const summaryPromise = analyzeProjectOverview(
            summaryData.tasks,
            summaryData.projectInfo,
            summaryData.referenceDate,
          )
            .then((res) => setAiSummary(res))
            .catch((err) => console.error(err))
            .finally(() => setIsAnalyzingSummary(false));

          aiPromises.push(summaryPromise);
        } else {
          setAiSummary(null);
          setIsAnalyzingSummary(false);
        }

        await Promise.all(aiPromises);
      } catch (error) {
        console.error("❌ Fetch Data Error:", error);
        setIsAnalyzing(false);
        setIsAnalyzingSummary(false);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [projectId]);

  // ป้องกัน Server/Client mismatch
  if (!mounted) return null;

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
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">
              {projectInfo?.name || "กำลังโหลด..."}
            </h1>
            {projectInfo?.code && (
              <span className="bg-blue-900/50 text-blue-400 text-xs px-2 py-1 rounded border border-blue-800/50">
                {projectInfo.code}
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            อัปเดตล่าสุด: {currentDateTime} น.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {/* Progress Card */}
        <div className="bg-[#161b22] border border-zinc-800/80 p-5 rounded-xl flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-sm text-zinc-400">ความคืบหน้าโครงการ</h3>
            <TrendingDown className="w-4 h-4 text-blue-500" />
          </div>
          <div>
            {isLoading ? (
              <div className="h-8 w-20 bg-zinc-800 animate-pulse rounded"></div>
            ) : (
              <span className="text-3xl font-bold text-white">
                {projectProgress ?? 0}%
              </span>
            )}
            <div className="w-full bg-zinc-800 rounded-full h-1.5 mt-2">
              <div
                className="bg-blue-600 h-1.5 rounded-full transition-all duration-1000"
                style={{
                  width: `${isLoading ? 0 : Math.min(100, projectProgress ?? 0)}%`,
                }}
              ></div>
            </div>
          </div>
        </div>

        {/* Budget Card */}
        <div className="bg-[#161b22] border border-zinc-800/80 p-5 rounded-xl flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-sm text-zinc-400">งบประมาณที่ใช้ไป</h3>
            <div className="w-4 h-4 bg-orange-500 rounded-sm"></div>{" "}
            {/* กลับมาใช้สี่เหลี่ยมสีส้มเหมือนเดิม */}
          </div>
          <div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-3xl font-bold text-white">
                {(expenses ?? 0).toLocaleString()}
              </span>
              <span className="text-sm text-zinc-400">บาท.</span>
            </div>

            {/* เพิ่มบรรทัดบอกงบรวมและ % ที่หายไปกลับมา */}
            <p className="text-[10px] text-zinc-500 mb-2">
              จากงบรวม {projectInfo?.budget?.toLocaleString() ?? 0} บาท
              (ใช้ไปแล้ว{" "}
              {projectInfo?.budget
                ? (((expenses ?? 0) / projectInfo.budget) * 100).toFixed(1)
                : 0}
              %)
            </p>

            <div className="w-full bg-zinc-800 rounded-full h-1.5 flex overflow-hidden">
              <div
                className="bg-orange-500 h-1.5 transition-all duration-1000"
                style={{
                  width: `${
                    projectInfo?.budget
                      ? Math.min(
                          100,
                          ((expenses ?? 0) / projectInfo.budget) * 100,
                        )
                      : 0
                  }%`,
                }}
              ></div>
            </div>
          </div>
        </div>

        {/* StatusBoard มี isLoading ในตัวอยู่แล้ว */}
        <StatusBoard
          todo={counts.todo}
          progress={counts.progress}
          done={counts.done}
          delay={counts.delay}
          isLoading={isLoading}
        />

        {/* RiskScoreDashboard จะคำนวณใหม่เมื่อ isLoading จบ */}
        <RiskScoreDashboard
          actualProgress={projectProgress ?? 0}
          plannedProgress={planProgress ?? 0}
          budgetSpentPercent={
            projectInfo?.budget
              ? ((expenses ?? 0) / projectInfo.budget) * 100
              : 0
          }
          delayTasksCount={counts.delay}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="w-full">
          <ActionRequiredList isAnalyzing={isAnalyzing} aiActions={aiActions} />
        </div>

        <div className="w-full">
          <ExecutiveSummary
            isAnalyzing={isAnalyzingSummary}
            summaryData={aiSummary}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-[#161b22] border border-zinc-800/80 rounded-xl p-5 flex flex-col h-[400px]">
          <h2 className="text-base font-semibold flex items-center gap-2 mb-4 text-purple-400">
            <Video className="w-4 h-4" /> อัปเดตหน้างานล่าสุด (360° View)
          </h2>

          {/* 🌟 เรียกใช้ Component Read-Only ตรงนี้ 🌟 */}
          <div className="flex-1 overflow-hidden">
            <ReadOnlyMapping360
              projectId={Number(projectId)}
              organizationId={Number(organizationId || 0)}
            />
          </div>
        </div>

        <div className="bg-[#161b22] border border-zinc-800/80 rounded-xl p-5">
          <h2 className="text-base font-semibold flex items-center gap-2 mb-5 text-emerald-400">
            <Video className="w-4 h-4" /> สภาพหน้างานสด (Live View)
          </h2>
          <div className="grid grid-cols-2 gap-3 h-32">
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg animate-pulse"></div>
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
