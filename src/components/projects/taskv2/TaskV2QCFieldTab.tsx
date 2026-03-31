"use client";

import { Checkbox, Progress } from "@heroui/react";
import { Info, Lightbulb } from "lucide-react";
import type { TaskV2ChecklistItem } from "@/lib/type";

interface TaskV2QCFieldTabProps {
  checklist: TaskV2ChecklistItem[];
  taskName: string;
  onToggle: (index: number) => void;
}

const TaskV2QCFieldTab = ({
  checklist,
  taskName,
  onToggle,
}: TaskV2QCFieldTabProps) => {
  const totalItems = checklist.length;
  const checkedItems = checklist.filter((c) => c.checked).length;
  const progress =
    totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left: Checklist */}
      <div className="space-y-3">
        <div className="space-y-1">
          <h3 className="font-bold text-sm">อัปเดตงานหน้าไซต์</h3>
          <p className="text-xs text-zinc-500 break-words">{taskName}</p>
        </div>

        <div className="space-y-2 max-h-[400px] overflow-y-auto scrollbar-hide pr-1">
          {checklist.map((item, i) => (
            <div
              key={i}
              className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                item.checked
                  ? "bg-success/5 border-success/30"
                  : "bg-zinc-900/40 border-zinc-800 hover:border-zinc-700"
              }`}
              onClick={() => onToggle(i)}
            >
              <Checkbox
                isSelected={item.checked}
                onValueChange={() => onToggle(i)}
                size="sm"
                color="success"
                className="mt-0.5"
              />
              <div className="flex-1 min-w-0 space-y-0.5">
                <p
                  className={`text-sm font-medium leading-tight ${
                    item.checked
                      ? "line-through text-zinc-500"
                      : "text-zinc-200"
                  }`}
                >
                  {item.name}
                </p>
                <p className="text-[10px] text-zinc-500">
                  สัด Progress: {item.progressPercent}%
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Progress summary */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3 space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-zinc-400">ความคืบหน้ารวม</span>
            <span className="font-bold text-primary">{progress}%</span>
          </div>
          <Progress value={progress} color="primary" size="sm" />
          <p className="text-[10px] text-zinc-500">
            {checkedItems}/{totalItems} ขั้นตอน
          </p>
        </div>
      </div>

      {/* Right: Instructions */}
      <div className="space-y-4">
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 sm:p-5 space-y-4">
          <div className="flex items-center gap-2 text-primary">
            <Info size={16} />
            <h3 className="font-bold text-sm">วิธีที่ข้อมูลส่วนนี้ทำงาน</h3>
          </div>

          <div className="space-y-3 text-xs text-zinc-400 leading-relaxed">
            <div className="flex gap-2">
              <span className="text-primary font-bold shrink-0">1.</span>
              <p>
                <strong className="text-zinc-200">ส่งเข้าแอปมือถือโฟร์แมน:</strong>{" "}
                ข้อมูล Step-by-Step ที่ AI สร้างขึ้น จะถูกส่งไปเป็น Checklist
                ในแอปพลิเคชันมือถือของโฟร์แมนหน้าไซต์งาน
                (สำลองหน้าจอลองด้านซ้าย)
              </p>
            </div>

            <div className="flex gap-2">
              <span className="text-primary font-bold shrink-0">2.</span>
              <p>
                <strong className="text-zinc-200">อัปเดตแบบ Real-time:</strong>{" "}
                เมื่อโฟร์แมนทำงานเสร็จในแต่ละขั้น และกด{" "}
                <span className="text-success font-bold">ติ๊กถูก</span>{" "}
                ระบบจะรู้ทันทีว่างานนี้มีความคืบหน้า (Progress)
                ไปแล้วกี่เปอร์เซ็นต์
              </p>
            </div>

            <div className="flex gap-2">
              <span className="text-primary font-bold shrink-0">3.</span>
              <p>
                <strong className="text-zinc-200">
                  สะท้อนกลับมาที่ Dashboard:
                </strong>{" "}
                เปอร์เซ็นต์ความคืบหน้า (เช่น 40%, 75%) จะริงกลับมาแสดงทั้ง
                หลอด Progress Bar สีฟ้า ในหน้า Dashboard ของ Project Manager
                ด้านบนสุดแบบอัตโนมัติ โดยที่ PM ไม่ต้องไปถามโฟร์แมนทีมพ์
                หรือไม่ต้องไปถามทีมฯ
              </p>
            </div>
          </div>
        </div>

        <div className="bg-warning/5 border border-warning/20 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-warning">
            <Lightbulb size={16} />
            <p className="font-bold text-xs">ลองเล่นดูสิ</p>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            ลองคลิกที่ถูกที่ Checklist ในหน้าจอจำลองด้านซ้าย
            แล้วสังเกตหลอดความคืบหน้า (Progress Bar)
            ด้านบนสุดของหน้าจอว่าเปลี่ยนไปอย่างไร
          </p>
        </div>
      </div>
    </div>
  );
};

export default TaskV2QCFieldTab;
