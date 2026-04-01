"use client";

import { Progress } from "@heroui/react";
import {
  DollarSign,
  CalendarDays,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";
import type { TaskV2AIResponse } from "@/lib/type";

interface TaskV2CardTabProps {
  aiData: TaskV2AIResponse;
}

const TaskV2CardTab = ({ aiData }: TaskV2CardTabProps) => {
  const { costEstimation, durationEstimate, risks } = aiData;

  return (
    <div className="space-y-6">
      {/* ===== AI COST ESTIMATION ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 sm:p-5 space-y-4">
          <div className="flex items-center gap-2 text-primary">
            <DollarSign size={18} />
            <h3 className="font-bold text-sm">
              ประเมินงบประมาณ (AI Cost Estimation)
            </h3>
          </div>

          <div className="space-y-1">
            <p className="text-2xl sm:text-3xl font-bold">
              ฿{" "}
              {costEstimation.totalEstimate.toLocaleString("th-TH")}
            </p>
            <p className="text-xs text-zinc-500">/ ราคากลางสุทธิ</p>
          </div>

          <div className="space-y-3">
            {/* Material */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400">
                  ค่าวัสดุ ({costEstimation.breakdown.materialPercent}%)
                </span>
                <span className="font-medium">
                  ฿{" "}
                  {costEstimation.breakdown.materialCost.toLocaleString("th-TH")}
                </span>
              </div>
              <Progress
                value={costEstimation.breakdown.materialPercent}
                color="primary"
                size="sm"
                className="w-full"
              />
            </div>

            {/* Labor */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400">
                  ค่าแรงติดตั้ง ({costEstimation.breakdown.laborPercent}%)
                </span>
                <span className="font-medium">
                  ฿{" "}
                  {costEstimation.breakdown.laborCost.toLocaleString("th-TH")}
                </span>
              </div>
              <Progress
                value={costEstimation.breakdown.laborPercent}
                color="warning"
                size="sm"
                className="w-full"
              />
            </div>

            {/* Machinery */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400">
                  ค่าเครื่องจักร ({costEstimation.breakdown.machineryPercent}%)
                </span>
                <span className="font-medium">
                  ฿{" "}
                  {costEstimation.breakdown.machineryCost.toLocaleString("th-TH")}
                </span>
              </div>
              <Progress
                value={costEstimation.breakdown.machineryPercent}
                color="secondary"
                size="sm"
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Duration Estimate */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 sm:p-5 flex flex-col items-center justify-center text-center space-y-3">
          <CalendarDays className="text-primary" size={32} />
          <p className="text-xs text-zinc-400 font-medium">
            ระยะเวลาดำเนินงาน (AI Estimate)
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold">
              {durationEstimate.totalDays}
            </span>
            <span className="text-zinc-400 text-sm">วัน</span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 rounded-full text-xs text-zinc-400">
            สมมติฐาน: {durationEstimate.assumptions}
          </div>
        </div>
      </div>

      {/* ===== AI RISK MANAGEMENT FLAGS ===== */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-warning">
          <AlertTriangle size={18} />
          <h3 className="font-bold text-sm">
            AI Risk Management Flags (แจ้งเตือนความเสี่ยง)
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {risks.map((risk, i) => (
            <div
              key={i}
              className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 space-y-2"
            >
              <div className="flex items-start gap-2">
                {risk.status === "mitigated" ? (
                  <ShieldCheck
                    className="text-success shrink-0 mt-0.5"
                    size={16}
                  />
                ) : (
                  <ShieldAlert
                    className="text-danger shrink-0 mt-0.5"
                    size={16}
                  />
                )}
                <h4 className="font-bold text-sm leading-tight">
                  {risk.name}
                </h4>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                {risk.description}
              </p>
              <div className="flex items-start gap-1.5 text-xs text-success">
                <span>✓</span>
                <span>ป้องกัน: {risk.mitigation}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TaskV2CardTab;
