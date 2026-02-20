
import React from "react";
import { useDroppable } from "@dnd-kit/core";
import type { Task } from "@/lib/type";
import { MemoizedDragItem } from "./MemoizedDragItem"; 

interface DropColumnProps {
  status: string;
  tasks: Task[];
  onTaskClick: (id: number) => void;
}

export const DropColumn = React.memo(({ status, tasks, onTaskClick }: DropColumnProps) => {
  const { setNodeRef } = useDroppable({ id: status });
  return (
    <div ref={setNodeRef} className="bg-default-100 dark:bg-zinc-900 border border-default-200 dark:border-zinc-800 p-4 rounded-xl space-y-3">
      <h3 className="font-semibold capitalize">{status}</h3>
      {tasks.map((t) => (
        <MemoizedDragItem key={t.id} t={t} onClick={onTaskClick} />
      ))}
    </div>
  );
});

DropColumn.displayName = "DropColumn";