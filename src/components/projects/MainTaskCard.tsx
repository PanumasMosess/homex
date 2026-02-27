import { calcProgress, getStatusMainTaskColor } from "@/lib/setting_data";
import { MainTaskCardProps } from "@/lib/type";
import { Card, CardBody, Chip, Progress } from "@heroui/react";

const MainTaskCard = ({ task, onSelect }: MainTaskCardProps) => {
  return (
    <Card
      isPressable
      onPress={() => onSelect(task.id)}
      className="h-full bg-default-100 dark:bg-zinc-900 border border-default-200 dark:border-zinc-800"
    >
      <CardBody className="space-y-3">
        <img
          src={task.coverImageUrl || "/placeholder-image.jpg"}
          className="h-40 w-full object-cover rounded-lg"
          alt={task.taskName || "Task"}
          loading="lazy"
        />
        <div className="flex justify-between items-start gap-2">
          <p className="truncate font-medium flex-1">
            {task.taskName || "Untitled Task"}
          </p>
          <Chip
            size="sm"
            color={getStatusMainTaskColor(task.status)}
            variant="flat"
          >
            {task.status || "TODO"}
          </Chip>
        </div>
        <p className="text-xs text-default-500 dark:text-zinc-400">
          Checklist{" "}
          {(task.details || []).filter((s: any) => !!s.status).length || 0}/
          {(task.details || []).length || 0}
        </p>
        <Progress
          value={calcProgress(task)}
          color={
            getStatusMainTaskColor(task.status) === "default"
              ? "primary"
              : getStatusMainTaskColor(task.status)
          }
        />
      </CardBody>
    </Card>
  );
};

export default MainTaskCard;
