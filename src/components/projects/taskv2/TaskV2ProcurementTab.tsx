"use client";

import { Button } from "@heroui/react";
import { ShoppingCart, Plus } from "lucide-react";
import type { TaskV2Material } from "@/lib/type";
import { toast } from "react-toastify";

interface TaskV2ProcurementTabProps {
  materials: TaskV2Material[];
}

const TaskV2ProcurementTab = ({ materials }: TaskV2ProcurementTabProps) => {
  const handleCreatePR = () => {
    toast.info("ฟีเจอร์สร้างใบขอซื้อ (PR) กำลังพัฒนา");
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShoppingCart className="text-primary" size={18} />
          <h3 className="font-bold text-sm">
            ข้อมูลส่งระบบจัดซื้อ (Draft PR)
          </h3>
        </div>
        <Button
          color="primary"
          size="sm"
          variant="flat"
          startContent={<Plus size={14} />}
          onPress={handleCreatePR}
          className="font-medium"
        >
          + สร้างใบขอซื้อ (Create PR)
        </Button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-zinc-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900/60">
              <th className="text-left p-3 text-xs font-bold text-zinc-400 uppercase">
                รายการวัสดุ (SPEC)
              </th>
              <th className="text-center p-3 text-xs font-bold text-zinc-400 uppercase">
                ปริมาณ (รวม WASTE)
              </th>
              <th className="text-center p-3 text-xs font-bold text-zinc-400 uppercase">
                ราคาประเมิน (AI)
              </th>
              <th className="text-right p-3 text-xs font-bold text-zinc-400 uppercase">
                รวมเป็นเงิน
              </th>
            </tr>
          </thead>
          <tbody>
            {materials.map((mat, i) => (
              <tr
                key={i}
                className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors"
              >
                <td className="p-3 font-medium">{mat.spec}</td>
                <td className="p-3 text-center">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
                    {mat.quantity}
                  </span>
                </td>
                <td className="p-3 text-center text-zinc-400">
                  {mat.unitPrice.toLocaleString("th-TH")} ฿/{mat.unit}
                </td>
                <td className="p-3 text-right font-bold text-warning">
                  {mat.totalPrice.toLocaleString("th-TH")} ฿
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-zinc-900/80">
              <td colSpan={3} className="p-3 text-right font-bold text-xs uppercase text-zinc-400">
                รวมทั้งหมด
              </td>
              <td className="p-3 text-right font-bold text-primary text-base">
                {materials
                  .reduce((sum, m) => sum + m.totalPrice, 0)
                  .toLocaleString("th-TH")}{" "}
                ฿
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {materials.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
          <ShoppingCart size={32} className="mb-2 opacity-50" />
          <p className="text-sm">ยังไม่มีรายการวัสดุ</p>
        </div>
      )}
    </div>
  );
};

export default TaskV2ProcurementTab;
