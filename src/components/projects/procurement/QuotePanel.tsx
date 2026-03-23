"use client";

import { useState, useTransition } from "react";
import {
  Button,
  Chip,
  Tooltip,
  Spinner,
} from "@heroui/react";
import {
  Plus,
  Trash2,
  Save,
  X,
  Check,
  Sparkles,
} from "lucide-react";
import { toast } from "react-toastify";
import type {
  ProcurementItemData,
  ProcurementSupplierQuote,
  CreateSupplierQuoteData,
} from "@/lib/type";
import {
  createSupplierQuote,
  updateSupplierQuote,
  deleteSupplierQuote,
  selectSupplierQuote,
} from "@/lib/actions/actionProcurement";
import TaskLinkPanel from "./TaskLinkPanel";

interface QuotePanelProps {
  item: ProcurementItemData;
  suppliers: { id: number; supplierName: string }[];
  onRefresh: () => void;
  onAiEstimate: (itemId: number) => void;
  isEstimating: boolean;
  tasks: { id: number; taskName: string | null; status: string; startPlanned: string | Date | null; coverImageUrl: string | null }[];
}

const QuotePanel = ({
  item,
  suppliers,
  onRefresh,
  onAiEstimate,
  isEstimating,
  tasks,
}: QuotePanelProps) => {
  const [isPending, startTransition] = useTransition();
  const [isAdding, setIsAdding] = useState(false);
  const [newQuote, setNewQuote] = useState({
    supplierId: "",
    unitPrice: "",
    totalPrice: "",
    quoteDate: "",
    validUntil: "",
    note: "",
  });

  const handleAddQuote = async () => {
    if (!newQuote.supplierId) {
      toast.warning("กรุณาเลือก Supplier");
      return;
    }

    startTransition(async () => {
      const res = await createSupplierQuote({
        procurementItemId: item.id,
        supplierId: Number(newQuote.supplierId),
        unitPrice: newQuote.unitPrice ? Number(newQuote.unitPrice) : undefined,
        totalPrice: newQuote.totalPrice ? Number(newQuote.totalPrice) : undefined,
        quoteDate: newQuote.quoteDate || undefined,
        validUntil: newQuote.validUntil || undefined,
        note: newQuote.note || undefined,
      });

      if (res.success) {
        toast.success("เพิ่มใบเสนอราคาสำเร็จ");
        setIsAdding(false);
        setNewQuote({ supplierId: "", unitPrice: "", totalPrice: "", quoteDate: "", validUntil: "", note: "" });
        onRefresh();
      } else {
        toast.error(res.message || "เพิ่มไม่สำเร็จ");
      }
    });
  };

  const handleSelectQuote = async (quoteId: number) => {
    startTransition(async () => {
      const res = await selectSupplierQuote(item.id, quoteId);
      if (res.success) {
        toast.success("เลือก Supplier สำเร็จ");
        onRefresh();
      } else {
        toast.error(res.message || "เลือก Supplier ไม่สำเร็จ");
      }
    });
  };

  const handleDeleteQuote = async (quoteId: number) => {
    if (!confirm("ต้องการลบใบเสนอราคานี้ใช่หรือไม่?")) return;
    startTransition(async () => {
      const res = await deleteSupplierQuote(quoteId);
      if (res.success) {
        toast.success("ลบใบเสนอราคาสำเร็จ");
        onRefresh();
      } else {
        toast.error(res.message || "ลบไม่สำเร็จ");
      }
    });
  };

  return (
    <div className="bg-default-50 dark:bg-zinc-900/50 rounded-xl p-4 space-y-3 border border-default-200 dark:border-zinc-700">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-bold text-sm">{item.materialName}</h4>
          <p className="text-xs text-default-400">
            {item.specification || "ไม่มี spec"} | {item.quantity ?? "-"} {item.unit || ""}
          </p>
        </div>
        <div className="flex gap-2">
          <Tooltip content="AI ประเมินราคากลาง">
            <Button
              size="sm"
              variant="flat"
              color="secondary"
              startContent={<Sparkles size={14} />}
              onPress={() => onAiEstimate(item.id)}
              isLoading={isEstimating}
            >
              AI ราคากลาง
            </Button>
          </Tooltip>
          <Button
            size="sm"
            color="primary"
            variant="flat"
            startContent={<Plus size={14} />}
            onPress={() => setIsAdding(true)}
          >
            เพิ่ม Supplier
          </Button>
        </div>
      </div>

      {/* AI Estimate Display */}
      {(item.aiEstimateMin || item.aiEstimateMid || item.aiEstimateMax) && (
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-success-50 dark:bg-success-900/20 rounded-lg p-2 text-center">
            <p className="text-[10px] uppercase text-success-600 font-bold">ประหยัด</p>
            <p className="text-sm font-bold text-success-700">
              ฿{item.aiEstimateMin?.toLocaleString() || "-"}
            </p>
          </div>
          <div className="bg-primary-50 dark:bg-primary-900/20 rounded-lg p-2 text-center">
            <p className="text-[10px] uppercase text-primary-600 font-bold">กลาง</p>
            <p className="text-sm font-bold text-primary-700">
              ฿{item.aiEstimateMid?.toLocaleString() || "-"}
            </p>
          </div>
          <div className="bg-warning-50 dark:bg-warning-900/20 rounded-lg p-2 text-center">
            <p className="text-[10px] uppercase text-warning-600 font-bold">Premium</p>
            <p className="text-sm font-bold text-warning-700">
              ฿{item.aiEstimateMax?.toLocaleString() || "-"}
            </p>
          </div>
        </div>
      )}

      {/* Quote List */}
      {item.quotes.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-default-200 text-default-500">
                <th className="text-left py-2 px-2 font-bold">Supplier</th>
                <th className="text-right py-2 px-2 font-bold">ราคา/หน่วย</th>
                <th className="text-right py-2 px-2 font-bold">ราคารวม</th>
                <th className="text-center py-2 px-2 font-bold">วันเสนอราคา</th>
                <th className="text-center py-2 px-2 font-bold">หมดอายุ</th>
                <th className="text-left py-2 px-2 font-bold">โน้ต</th>
                <th className="text-center py-2 px-2 font-bold">เลือก</th>
                <th className="py-2 px-2"></th>
              </tr>
            </thead>
            <tbody>
              {item.quotes.map((q) => (
                <tr
                  key={q.id}
                  className={`border-b border-default-100 hover:bg-default-100/50 ${
                    q.isSelected ? "bg-success-50/50 dark:bg-success-900/10" : ""
                  }`}
                >
                  <td className="py-2 px-2 font-medium">{q.supplier.supplierName}</td>
                  <td className="py-2 px-2 text-right">
                    {q.unitPrice != null ? `฿${Number(q.unitPrice).toLocaleString()}` : "-"}
                  </td>
                  <td className="py-2 px-2 text-right">
                    {q.totalPrice != null ? `฿${Number(q.totalPrice).toLocaleString()}` : "-"}
                  </td>
                  <td className="py-2 px-2 text-center">
                    {q.quoteDate ? new Date(q.quoteDate).toLocaleDateString("th-TH", { day: "2-digit", month: "short" }) : "-"}
                  </td>
                  <td className="py-2 px-2 text-center">
                    {q.validUntil ? new Date(q.validUntil).toLocaleDateString("th-TH", { day: "2-digit", month: "short" }) : "-"}
                  </td>
                  <td className="py-2 px-2 text-default-400 max-w-[120px] truncate">
                    {q.note || "-"}
                  </td>
                  <td className="py-2 px-2 text-center">
                    {q.isSelected ? (
                      <Chip size="sm" color="success" variant="flat" className="text-[10px]">
                        เลือกแล้ว
                      </Chip>
                    ) : (
                      <Button
                        isIconOnly
                        size="sm"
                        variant="light"
                        color="success"
                        onPress={() => handleSelectQuote(q.id)}
                        isLoading={isPending}
                      >
                        <Check size={14} />
                      </Button>
                    )}
                  </td>
                  <td className="py-2 px-2">
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      color="danger"
                      onPress={() => handleDeleteQuote(q.id)}
                    >
                      <Trash2 size={12} />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-xs text-default-400 text-center py-4">
          ยังไม่มีใบเสนอราคา
        </p>
      )}

      {/* Add New Quote Form */}
      {isAdding && (
        <div className="bg-white dark:bg-zinc-800 rounded-lg p-3 border border-default-200 space-y-2">
          <p className="text-xs font-bold text-default-500 uppercase">เพิ่มใบเสนอราคาใหม่</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <select
              value={newQuote.supplierId}
              onChange={(e) => setNewQuote((p) => ({ ...p, supplierId: e.target.value }))}
              className="col-span-2 sm:col-span-1 px-2 py-1.5 text-xs bg-default-100 dark:bg-zinc-700 border border-default-300 rounded-md"
            >
              <option value="">-- เลือก Supplier --</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.supplierName}
                </option>
              ))}
            </select>
            <input
              type="number"
              placeholder="ราคา/หน่วย"
              value={newQuote.unitPrice}
              onChange={(e) => setNewQuote((p) => ({ ...p, unitPrice: e.target.value }))}
              className="px-2 py-1.5 text-xs bg-default-100 dark:bg-zinc-700 border border-default-300 rounded-md"
            />
            <input
              type="number"
              placeholder="ราคารวม"
              value={newQuote.totalPrice}
              onChange={(e) => setNewQuote((p) => ({ ...p, totalPrice: e.target.value }))}
              className="px-2 py-1.5 text-xs bg-default-100 dark:bg-zinc-700 border border-default-300 rounded-md"
            />
            <input
              type="date"
              value={newQuote.quoteDate}
              onChange={(e) => setNewQuote((p) => ({ ...p, quoteDate: e.target.value }))}
              className="px-2 py-1.5 text-xs bg-default-100 dark:bg-zinc-700 border border-default-300 rounded-md"
              title="วันเสนอราคา"
            />
            <input
              type="date"
              value={newQuote.validUntil}
              onChange={(e) => setNewQuote((p) => ({ ...p, validUntil: e.target.value }))}
              className="px-2 py-1.5 text-xs bg-default-100 dark:bg-zinc-700 border border-default-300 rounded-md"
              title="หมดอายุ"
            />
            <input
              type="text"
              placeholder="โน้ต"
              value={newQuote.note}
              onChange={(e) => setNewQuote((p) => ({ ...p, note: e.target.value }))}
              className="px-2 py-1.5 text-xs bg-default-100 dark:bg-zinc-700 border border-default-300 rounded-md"
            />
          </div>
          <div className="flex gap-2 pt-1">
            <Button
              size="sm"
              color="success"
              variant="flat"
              startContent={<Save size={14} />}
              onPress={handleAddQuote}
              isLoading={isPending}
            >
              บันทึก
            </Button>
            <Button
              size="sm"
              variant="flat"
              onPress={() => setIsAdding(false)}
            >
              ยกเลิก
            </Button>
          </div>
        </div>
      )}

      {/* Task Links */}
      <TaskLinkPanel item={item} tasks={tasks} onRefresh={onRefresh} />
    </div>
  );
};

export default QuotePanel;
