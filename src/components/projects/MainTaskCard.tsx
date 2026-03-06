import { calcProgress, getStatusMainTaskColor } from "@/lib/setting_data";
import { MainTaskCardProps } from "@/lib/type";
import { Card, CardBody, Chip, Progress } from "@heroui/react";
import { Banknote } from "lucide-react";

const MainTaskCard = ({ task, onSelect }: MainTaskCardProps) => {
  return (
    <Card
      isPressable
      onPress={() => onSelect(task.id)}
      // 🌟 1. เพิ่ม overflow-hidden เพื่อการันตีว่าไม่มีอะไรในการ์ดนี้ล้นออกไปข้างนอกได้
      className="h-full w-full bg-default-100 dark:bg-zinc-900 border border-default-200 dark:border-zinc-800 transition-all hover:shadow-md overflow-hidden"
    >
      <CardBody className="space-y-2.5 sm:space-y-3 p-3 sm:p-4 w-full overflow-hidden">
        <img
          src={task.coverImageUrl || "/placeholder-image.jpg"}
          className="h-32 sm:h-40 w-full object-cover rounded-lg shrink-0"
          alt={task.taskName || "Task"}
          loading="lazy"
        />

        {/* 🌟 2. เพิ่ม w-full และ min-w-0 ตรงนี้สำคัญมาก! บังคับให้ flex หดตัวลง เพื่อให้ truncate ทำงานได้ */}
        <div className="flex justify-between items-start gap-2 w-full min-w-0">
          <p className="truncate text-sm sm:text-base font-medium flex-1 min-w-0">
            {task.taskName || "Untitled Task"}
          </p>
          <Chip
            size="sm"
            className="text-[10px] sm:text-xs shrink-0"
            color={getStatusMainTaskColor(task.status)}
            variant="flat"
          >
            {task.status || "TODO"}
          </Chip>
        </div>

        <div className="flex flex-wrap justify-between items-center gap-2 text-[10px] sm:text-xs text-default-500 dark:text-zinc-400 w-full">
          <p className="whitespace-nowrap shrink-0">
            Checklist{" "}
            {(task.details || []).filter((s: any) => !!s.status).length || 0}/
            {(task.details || []).length || 0}
          </p>

          <div className="flex items-center gap-1 sm:gap-1.5 font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 sm:px-2 rounded-md shrink-0 max-w-full min-w-0">
            <Banknote className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
            <span className="truncate">
              {(task.budget || 0).toLocaleString()}
            </span>
          </div>
        </div>

        <Progress
          size="sm"
          value={calcProgress(task)}
          color={
            getStatusMainTaskColor(task.status) === "default"
              ? "primary"
              : getStatusMainTaskColor(task.status)
          }
          className="pt-1 sm:pt-0 w-full"
        />
      </CardBody>
    </Card>
  );
};

export default MainTaskCard;
