"use client";

import { useState, useCallback } from "react";
import { Checkbox, Input, Progress } from "@heroui/react";
import { GripVertical, Info, Lightbulb, Pencil, Check, X } from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import type { TaskV2ChecklistItem } from "@/lib/type";

interface TaskV2QCFieldTabProps {
  checklist: TaskV2ChecklistItem[];
  taskName: string;
  onToggle: (index: number) => void;
  onReorder: (reordered: TaskV2ChecklistItem[]) => void;
  onEditSubtask: (subtaskId: number, newName: string) => void;
}

/* ─── Sortable Item ─── */
const SortableChecklistItem = ({
  item,
  index,
  onToggle,
  onStartEdit,
  editingId,
  editValue,
  setEditValue,
  onSaveEdit,
  onCancelEdit,
}: {
  item: TaskV2ChecklistItem;
  index: number;
  onToggle: (i: number) => void;
  onStartEdit: (id: number, name: string) => void;
  editingId: number | null;
  editValue: string;
  setEditValue: (v: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
}) => {
  const isEditing = editingId === item.id;
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id ?? index });

  const style = {
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : ("auto" as const),
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 p-3 rounded-xl border transition-all group ${
        item.checked
          ? "bg-success/5 border-success/30"
          : "bg-zinc-900/40 border-zinc-800 hover:border-zinc-700"
      }`}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-zinc-600 hover:text-zinc-400 shrink-0 touch-none"
        tabIndex={-1}
      >
        <GripVertical size={16} />
      </button>

      {/* Checkbox */}
      <Checkbox
        isSelected={item.checked}
        onValueChange={() => onToggle(index)}
        size="sm"
        color="success"
        className="shrink-0"
      />

      {/* Content */}
      {isEditing ? (
        <div className="flex-1 flex items-center gap-1.5">
          <Input
            size="sm"
            variant="bordered"
            value={editValue}
            onValueChange={setEditValue}
            autoFocus
            classNames={{
              input: "text-sm text-white",
              inputWrapper: "bg-zinc-800 border-zinc-600 min-h-8 h-8",
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSaveEdit();
              if (e.key === "Escape") onCancelEdit();
            }}
          />
          <button
            onClick={onSaveEdit}
            className="p-1 rounded hover:bg-success/20 text-success shrink-0"
          >
            <Check size={14} />
          </button>
          <button
            onClick={onCancelEdit}
            className="p-1 rounded hover:bg-danger/20 text-danger shrink-0"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <div className="flex-1 min-w-0 space-y-0.5">
            <p
              className={`text-sm font-medium leading-tight cursor-pointer ${
                item.checked
                  ? "line-through text-zinc-500"
                  : "text-zinc-200"
              }`}
              onClick={() => onToggle(index)}
            >
              {item.name}
            </p>
            <p className="text-[10px] text-zinc-500">
              สัดส่วน: {item.progressPercent}%
            </p>
          </div>
          {item.id && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onStartEdit(item.id!, item.name);
              }}
              className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-zinc-700 text-zinc-500 hover:text-zinc-300 transition-all shrink-0"
            >
              <Pencil size={13} />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

/* ─── Main Component ─── */
const TaskV2QCFieldTab = ({
  checklist,
  taskName,
  onToggle,
  onReorder,
  onEditSubtask,
}: TaskV2QCFieldTabProps) => {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");

  const totalItems = checklist.length;
  const checkedItems = checklist.filter((c) => c.checked).length;
  const progress =
    totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    })
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = checklist.findIndex(
        (item) => (item.id ?? checklist.indexOf(item)) === active.id
      );
      const newIndex = checklist.findIndex(
        (item) => (item.id ?? checklist.indexOf(item)) === over.id
      );

      if (oldIndex !== -1 && newIndex !== -1) {
        const reordered = arrayMove(checklist, oldIndex, newIndex);
        onReorder(reordered);
      }
    },
    [checklist, onReorder]
  );

  const handleStartEdit = useCallback((id: number, name: string) => {
    setEditingId(id);
    setEditValue(name);
  }, []);

  const handleSaveEdit = useCallback(() => {
    if (editingId && editValue.trim()) {
      onEditSubtask(editingId, editValue.trim());
    }
    setEditingId(null);
    setEditValue("");
  }, [editingId, editValue, onEditSubtask]);

  const handleCancelEdit = useCallback(() => {
    setEditingId(null);
    setEditValue("");
  }, []);

  const sortableIds = checklist.map(
    (item, i) => item.id ?? i
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left: Checklist */}
      <div className="space-y-3">
        <div className="space-y-1">
          <h3 className="font-bold text-sm">อัปเดตงานหน้าไซต์</h3>
          <p className="text-xs text-zinc-500 break-words">{taskName}</p>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={sortableIds}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2 max-h-[400px] overflow-y-auto scrollbar-hide pr-1">
              {checklist.map((item, i) => (
                <SortableChecklistItem
                  key={item.id ?? i}
                  item={item}
                  index={i}
                  onToggle={onToggle}
                  onStartEdit={handleStartEdit}
                  editingId={editingId}
                  editValue={editValue}
                  setEditValue={setEditValue}
                  onSaveEdit={handleSaveEdit}
                  onCancelEdit={handleCancelEdit}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

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
                <strong className="text-zinc-200">จัดลำดับงาน:</strong>{" "}
                ลากไอคอน <GripVertical size={12} className="inline text-zinc-500" /> เพื่อจัดเรียงลำดับขั้นตอนการทำงานตามความสำคัญ
              </p>
            </div>

            <div className="flex gap-2">
              <span className="text-primary font-bold shrink-0">2.</span>
              <p>
                <strong className="text-zinc-200">แก้ไขชื่อ:</strong>{" "}
                คลิกไอคอน <Pencil size={12} className="inline text-zinc-500" /> ที่แต่ละรายการ เพื่อแก้ไขชื่อขั้นตอน
              </p>
            </div>

            <div className="flex gap-2">
              <span className="text-primary font-bold shrink-0">3.</span>
              <p>
                <strong className="text-zinc-200">อัปเดตความคืบหน้า:</strong>{" "}
                กด <span className="text-success font-bold">ติ๊กถูก</span>{" "}
                เมื่อทำงานเสร็จในแต่ละขั้นตอน Progress จะอัปเดตอัตโนมัติ
              </p>
            </div>
          </div>
        </div>

        <div className="bg-warning/5 border border-warning/20 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-warning">
            <Lightbulb size={16} />
            <p className="font-bold text-xs">เคล็ดลับ</p>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            ลากรายการเพื่อจัดลำดับใหม่ ระบบจะบันทึกอัตโนมัติ
            หรือคลิกไอคอนดินสอเพื่อแก้ไขชื่อรายการย่อย
          </p>
        </div>
      </div>
    </div>
  );
};

export default TaskV2QCFieldTab;
