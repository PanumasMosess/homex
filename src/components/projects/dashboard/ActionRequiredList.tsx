import { useState } from "react";
import {
  AlertCircle,
  CircleDashed,
  Calendar,
  TrendingDown,
  AlertTriangle,
} from "lucide-react";
import { ActionRequiredListProps } from "@/lib/type";

const ActionRequiredList = ({
  isAnalyzing,
  aiActions,
}: ActionRequiredListProps) => {
  const [showAll, setShowAll] = useState(false);

  const displayedActions = showAll ? aiActions : aiActions?.slice(0, 3) || [];
  const hasMore = aiActions?.length > 3;

  return (
    <div className="bg-[#161b22] border border-zinc-800/80 rounded-xl p-5 lg:col-span-2">
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-base font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500" />
          สิ่งที่ต้องจัดการด่วน (Action Required)
        </h2>
        {hasMore && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
          >
            {showAll ? "ย่อรายการลง" : `ดูทั้งหมด (${aiActions.length})`}
          </button>
        )}
      </div>

      <div className="space-y-4">
        {isAnalyzing ? (
          <div className="text-sm text-zinc-400 animate-pulse flex items-center gap-2">
            <CircleDashed className="w-4 h-4 animate-spin text-blue-400" />
            AI กำลังวิเคราะห์ข้อมูลโครงการ...
          </div>
        ) : aiActions && aiActions.length > 0 ? (
          <>
            {/* แสดงรายการตามจำนวนที่คำนวณไว้ */}
            {displayedActions.map((action, index) => (
              <div
                key={action.id || index}
                className="flex gap-4 items-start pb-4 border-b border-zinc-800/50 last:border-0 last:pb-0"
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border ${
                    action.type === "DELAY"
                      ? "bg-red-950/50 border-red-900/50 text-red-400"
                      : action.type === "BUDGET"
                        ? "bg-yellow-950/50 border-yellow-900/50 text-yellow-400"
                        : "bg-orange-950/50 border-orange-900/50 text-orange-400"
                  }`}
                >
                  {action.type === "DELAY" ? (
                    <Calendar className="w-4 h-4" />
                  ) : action.type === "BUDGET" ? (
                    <TrendingDown className="w-4 h-4" />
                  ) : (
                    <AlertTriangle className="w-4 h-4" />
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h4 className="text-sm font-medium text-white mb-1">
                      {action.title}
                    </h4>
                    <span className="text-[10px] text-zinc-500">
                      {action.time}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mb-2">
                    {action.description}
                  </p>
                  <div className="flex gap-2">
                    <span className="bg-zinc-800 text-zinc-300 text-[10px] px-2 py-1 rounded">
                      {action.tag}
                    </span>
                    {action.hasCCTV && (
                      <span className="bg-orange-950 text-orange-400 border border-orange-900/50 text-[10px] px-2 py-1 rounded cursor-pointer hover:bg-orange-900/80 transition-colors">
                        ดูภาพ CCTV
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* ปุ่มดูเพิ่มเติมด้านล่าง (จะโชว์เมื่อยังมีรายการเหลือและยังไม่ได้กดดูทั้งหมด) */}
            {!showAll && hasMore && (
              <button
                onClick={() => setShowAll(true)}
                className="w-full mt-2 py-2 text-xs text-zinc-500 hover:text-zinc-300 bg-zinc-800/30 hover:bg-zinc-800/50 rounded-lg transition-colors"
              >
                ดูรายการแจ้งเตือนอีก {aiActions.length - 3} รายการ...
              </button>
            )}
          </>
        ) : (
          <div className="text-sm text-zinc-500 py-4 text-center">
            🎉 ไม่มีรายการแจ้งเตือนด่วนในขณะนี้
          </div>
        )}
      </div>
    </div>
  );
};

export default ActionRequiredList;
