import { Button, Chip, Input, Progress, Textarea } from "@heroui/react";
import { formatDate } from "@/lib/setting_data";
import { UpdateMainTaskProps } from "@/lib/type";

const UpdateMainTask = ({
  isEditMode,
  selected,
  editFormData,
  setEditFormData,
  isUpdatingStatusMainTask,
  handleUpdateStatusMainTask,
  isOwner,
}: UpdateMainTaskProps) => {
  if (isEditMode) {
    return (
      <div className="space-y-4">
        <Input
          label="ชื่องาน"
          variant="bordered"
          value={editFormData.taskName || ""}
          onChange={(e) =>
            setEditFormData({
              ...editFormData,
              taskName: e.target.value,
            })
          }
        />
        <Textarea
          label="รายละเอียด"
          variant="bordered"
          minRows={2}
          value={editFormData.taskDesc || ""}
          onChange={(e) =>
            setEditFormData({
              ...editFormData,
              taskDesc: e.target.value,
            })
          }
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-start">
          <Input
            label="วันที่เริ่ม"
            type="date"
            labelPlacement="outside"
            variant="bordered"
            value={
              editFormData.startPlanned
                ? new Date(editFormData.startPlanned)
                    .toISOString()
                    .split("T")[0]
                : ""
            }
            onChange={(e) =>
              setEditFormData({
                ...editFormData,
                startPlanned: e.target.value,
              })
            }
          />
          <Input
            type="number"
            label="ระยะเวลา (วัน)"
            labelPlacement="outside"
            variant="bordered"
            min={1}
            value={editFormData.durationDays || ""}
            onValueChange={(val) =>
              setEditFormData({
                ...editFormData,
                durationDays: val ? Number(val) : null,
              })
            }
          />
          <Input
            type="number"
            label="งบประมาณ (บาท)"
            labelPlacement="outside"
            variant="bordered"
            min={0}
            value={editFormData.budget || ""}
            onValueChange={(val) =>
              setEditFormData({
                ...editFormData,
                budget: val ? Number(val) : 0,
              })
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {isOwner ? (
          <div className="flex flex-wrap gap-3">
            <Button
              color="primary"
              size="sm"
              onPress={() => handleUpdateStatusMainTask("PROGRESS")}
              isLoading={isUpdatingStatusMainTask}
              isDisabled={
                selected.status === "PROGRESS" || selected.status === "DONE"
              }
              startContent={selected.status === "TODO" && <span>✓</span>}
            >
              เริ่มงาน
            </Button>
            <Button
              variant="bordered"
              size="sm"
              onPress={() => handleUpdateStatusMainTask("DONE")}
              isLoading={isUpdatingStatusMainTask}
              isDisabled={selected.status === "DONE"}
            >
              เสร็จสมบูรณ์
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-sm text-default-500">สถานะงาน:</span>
            <Chip
              variant="flat"
              color={
                selected.status === "DONE"
                  ? "success"
                  : selected.status === "PROGRESS"
                    ? "primary"
                    : "default"
              }
              size="sm"
              className="font-bold"
            >
              {selected.status || "TODO"}
            </Chip>
          </div>
        )}

        {/* แสดงคนรับผิดชอบงาน (ถ้ามี) ช่วยให้ Layout ดูเต็มขึ้น */}
        <div className="text-xs text-default-400 italic">
          ID ผู้รับผิดชอบ: {selected.createdById || "-"}
        </div>
      </div>

      {/* รายละเอียดงาน */}
      {selected.taskDesc && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-default-400 uppercase tracking-wider">
            รายละเอียดงาน
          </p>
          <div className="text-sm bg-default-50 dark:bg-zinc-800/50 p-4 rounded-xl border border-default-100 leading-relaxed text-default-700">
            {selected.taskDesc}
          </div>
        </div>
      )}

      {/* ข้อมูลสถิติและกำหนดการ */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6 bg-default-50/50 p-4 rounded-2xl border border-default-100">
        <div className="space-y-1">
          <p className="text-[10px] text-default-400 font-bold uppercase">
            กำหนดเริ่ม
          </p>
          <p className="text-sm font-semibold">
            {selected.startPlanned ? formatDate(selected.startPlanned) : "-"}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] text-default-400 font-bold uppercase">
            กำหนดเสร็จ
          </p>
          <p className="text-sm font-semibold">
            {selected.finishPlanned ? formatDate(selected.finishPlanned) : "-"}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] text-default-400 font-bold uppercase">
            งบประมาณ
          </p>
          <p className="text-sm font-bold text-primary">
            ฿{(selected.budget || 0).toLocaleString()}
          </p>
        </div>
      </div>

      {/* แถบความคืบหน้า */}
      <div className="bg-default-50/50 p-4 rounded-2xl border border-default-100 space-y-3">
        <div className="flex justify-between items-end">
          <div className="space-y-0.5">
            <p className="text-[10px] text-default-400 font-bold uppercase">
              ความคืบหน้าโดยรวม
            </p>
            <p className="text-xl font-black text-primary">
              {selected.progressPercent || 0}
              <span className="text-xs ml-0.5">%</span>
            </p>
          </div>
        </div>
        <Progress
          value={selected.progressPercent || 0}
          color={selected.progressPercent === 100 ? "success" : "primary"}
          className="h-2.5"
          showValueLabel={false}
        />
      </div>
    </div>
  );
};

export default UpdateMainTask;
