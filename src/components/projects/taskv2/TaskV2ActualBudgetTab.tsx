"use client";

import { useState, useEffect, useTransition, useRef } from "react";
import { Button, Input, Chip } from "@heroui/react";
import {
  Package,
  HardHat,
  Cog,
  Plus,
  Trash2,
  Camera,
  X,
} from "lucide-react";
import { toast } from "react-toastify";
import type {
  TaskActualCostEntry,
  TaskActualCostSummary,
  ActualCostCategory,
} from "@/lib/type";
import {
  createActualCost,
  getActualCostEntries,
  getActualCostSummary,
  deleteActualCost,
} from "@/lib/actions/actionTaskV2ActualCost";
import { uploadImageFormData } from "@/lib/actions/actionIndex";

interface TaskV2ActualBudgetTabProps {
  taskId: number;
  organizationId: number;
}

const CATEGORIES: {
  key: ActualCostCategory;
  label: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}[] = [
  {
    key: "MATERIAL",
    label: "วัสดุ",
    icon: <Package size={14} />,
    color: "text-amber-400",
    bgColor: "bg-amber-500/20",
  },
  {
    key: "LABOR",
    label: "ค่าแรง",
    icon: <HardHat size={14} />,
    color: "text-blue-400",
    bgColor: "bg-blue-500/20",
  },
  {
    key: "MACHINERY",
    label: "เครื่องจักร",
    icon: <Cog size={14} />,
    color: "text-purple-400",
    bgColor: "bg-purple-500/20",
  },
];

const TaskV2ActualBudgetTab = ({
  taskId,
  organizationId,
}: TaskV2ActualBudgetTabProps) => {
  const [summary, setSummary] = useState<TaskActualCostSummary>({
    material: 0,
    labor: 0,
    machinery: 0,
    total: 0,
  });
  const [entries, setEntries] = useState<TaskActualCostEntry[]>([]);
  const [selectedCategory, setSelectedCategory] =
    useState<ActualCostCategory>("MATERIAL");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch data on mount
  useEffect(() => {
    loadData();
  }, [taskId]);

  const loadData = async () => {
    const [summaryRes, entriesRes] = await Promise.all([
      getActualCostSummary(taskId),
      getActualCostEntries(taskId),
    ]);
    if (summaryRes.success) setSummary(summaryRes.data);
    if (entriesRes.success) setEntries(entriesRes.data);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = () => {
    if (!amount || Number(amount) <= 0) {
      toast.error("กรุณากรอกยอดเงิน");
      return;
    }

    startTransition(async () => {
      let imageUrl: string | undefined;

      if (imageFile) {
        const formData = new FormData();
        formData.append("file", imageFile);
        formData.append("path", `actual-cost/${taskId}`);
        const uploadRes = await uploadImageFormData(formData);
        if (uploadRes.success && uploadRes.url) {
          imageUrl = uploadRes.url;
        }
      }

      const res = await createActualCost({
        taskId,
        organizationId,
        category: selectedCategory,
        amount: Number(amount),
        description: description || undefined,
        imageUrl,
      });

      if (res.success) {
        toast.success("บันทึกรายการสำเร็จ");
        setAmount("");
        setDescription("");
        clearImage();
        await loadData();
      } else {
        toast.error(res.message || "บันทึกไม่สำเร็จ");
      }
    });
  };

  const handleDelete = (id: number) => {
    setDeletingId(id);
    startTransition(async () => {
      const res = await deleteActualCost(id);
      if (res.success) {
        toast.success("ลบรายการสำเร็จ");
        await loadData();
      } else {
        toast.error(res.message || "ลบไม่สำเร็จ");
      }
      setDeletingId(null);
    });
  };

  const getCategoryMeta = (cat: string) =>
    CATEGORIES.find((c) => c.key === cat) || CATEGORIES[0];

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString("th-TH", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("th-TH", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-5">
      {/* ===== SECTION 1: Summary ===== */}
      <div className="grid grid-cols-3 gap-3">
        {[
          {
            label: "วัสดุ",
            value: summary.material,
            icon: <Package size={16} />,
            color: "text-amber-400",
            bgColor: "bg-amber-500/10",
            borderColor: "border-amber-500/30",
          },
          {
            label: "ค่าแรง",
            value: summary.labor,
            icon: <HardHat size={16} />,
            color: "text-blue-400",
            bgColor: "bg-blue-500/10",
            borderColor: "border-blue-500/30",
          },
          {
            label: "เครื่องจักร",
            value: summary.machinery,
            icon: <Cog size={16} />,
            color: "text-purple-400",
            bgColor: "bg-purple-500/10",
            borderColor: "border-purple-500/30",
          },
        ].map((item) => (
          <div
            key={item.label}
            className={`${item.bgColor} border ${item.borderColor} rounded-xl p-3 sm:p-4 text-center space-y-1`}
          >
            <div
              className={`flex items-center justify-center gap-1.5 ${item.color} text-xs font-medium`}
            >
              {item.icon}
              {item.label}
            </div>
            <p className="text-lg sm:text-xl font-bold">
              ฿ {item.value.toLocaleString("th-TH")}
            </p>
          </div>
        ))}
      </div>

      {/* ===== SECTION 2: Form ===== */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4 space-y-4">
        <p className="text-sm font-medium text-zinc-300">เลือกหมวดหมู่</p>

        {/* Category Selector */}
        <div className="flex gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(cat.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedCategory === cat.key
                  ? "bg-primary text-white shadow-md"
                  : "bg-zinc-800/60 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200"
              }`}
            >
              {cat.icon}
              {cat.label}
            </button>
          ))}
        </div>

        {/* Amount Input */}
        <Input
          type="number"
          placeholder="0"
          value={amount}
          onValueChange={setAmount}
          startContent={
            <span className="text-zinc-400 text-sm font-bold">฿</span>
          }
          size="lg"
          variant="bordered"
          classNames={{
            input: "text-lg font-bold text-white",
            inputWrapper:
              "bg-zinc-900/80 border-zinc-700 hover:border-zinc-600",
          }}
        />

        {/* Description + Image */}
        <div className="flex items-center gap-2">
          <Input
            placeholder="รายละเอียดรายการ..."
            value={description}
            onValueChange={setDescription}
            variant="bordered"
            classNames={{
              input: "text-sm text-white",
              inputWrapper:
                "bg-zinc-900/80 border-zinc-700 hover:border-zinc-600",
            }}
            className="flex-1"
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageSelect}
          />
          <Button
            isIconOnly
            variant="bordered"
            className="border-zinc-700 hover:border-zinc-600 shrink-0"
            onPress={() => fileInputRef.current?.click()}
          >
            <Camera size={18} className="text-zinc-400" />
          </Button>
        </div>

        {/* Image Preview */}
        {imagePreview && (
          <div className="relative inline-block">
            <img
              src={imagePreview}
              alt="preview"
              className="h-20 w-20 object-cover rounded-lg border border-zinc-700"
            />
            <button
              onClick={clearImage}
              className="absolute -top-2 -right-2 w-5 h-5 bg-danger rounded-full flex items-center justify-center"
            >
              <X size={12} className="text-white" />
            </button>
          </div>
        )}

        {/* Submit Button */}
        <Button
          color="primary"
          className="w-full font-bold text-sm"
          size="lg"
          onPress={handleSubmit}
          isLoading={isPending}
          startContent={!isPending ? <Plus size={16} /> : undefined}
        >
          + เพิ่มรายการ
        </Button>
      </div>

      {/* ===== SECTION 3: History ===== */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-zinc-300">
            ประวัติรายการทั้งหมด
          </p>
          <p className="text-sm font-bold text-zinc-200">
            รวม: ฿ {summary.total.toLocaleString("th-TH")}
          </p>
        </div>

        {entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-zinc-500">
            <Package size={28} className="mb-2 opacity-50" />
            <p className="text-sm">ยังไม่มีรายการ</p>
          </div>
        ) : (
          <div className="space-y-2">
            {entries.map((entry) => {
              const meta = getCategoryMeta(entry.category);
              return (
                <div
                  key={entry.id}
                  className="flex items-center gap-3 p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl hover:border-zinc-700 transition-colors"
                >
                  {/* Icon */}
                  <div
                    className={`w-9 h-9 rounded-lg ${meta.bgColor} flex items-center justify-center shrink-0`}
                  >
                    <span className={meta.color}>{meta.icon}</span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <p className="text-sm font-medium text-zinc-200 truncate">
                      {entry.description || meta.label}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                      <span>{formatDate(entry.createdAt)}</span>
                      <span>{formatTime(entry.createdAt)}</span>
                      {entry.imageUrl && (
                        <Chip size="sm" variant="flat" color="default" className="h-4 text-[10px]">
                          📷 รูปแนบ
                        </Chip>
                      )}
                    </div>
                  </div>

                  {/* Amount */}
                  <p className="text-sm font-bold text-zinc-100 shrink-0">
                    ฿ {entry.amount.toLocaleString("th-TH")}
                  </p>

                  {/* Delete */}
                  <button
                    onClick={() => handleDelete(entry.id)}
                    disabled={deletingId === entry.id}
                    className="p-1.5 rounded-lg hover:bg-danger/20 text-zinc-500 hover:text-danger transition-colors shrink-0 disabled:opacity-50"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskV2ActualBudgetTab;
