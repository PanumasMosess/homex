import { Button, Input, Progress, Textarea } from "@heroui/react";
import { formatDate } from "@/lib/setting_data";
import { UpdateMainTaskProps } from "@/lib/type";

const UpdateMainTask = ({
  isEditMode,
  selected,
  editFormData,
  setEditFormData,
  isUpdatingStatusMainTask,
  handleUpdateStatusMainTask,
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
    <>
      <div className="flex gap-3">
        <Button
          color="primary"
          onPress={() => handleUpdateStatusMainTask("PROGRESS")}
          isLoading={isUpdatingStatusMainTask}
          isDisabled={
            selected.status === "PROGRESS" || selected.status === "DONE"
          }
        >
          ✓ เริ่มงาน
        </Button>
        <Button
          variant="bordered"
          onPress={() => handleUpdateStatusMainTask("DONE")}
          isLoading={isUpdatingStatusMainTask}
          isDisabled={selected.status === "DONE"}
        >
          เสร็จสมบูรณ์
        </Button>
      </div>

      {selected.taskDesc && (
        <div className="text-sm bg-default-50 p-3 rounded-lg">
          {selected.taskDesc}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm text-default-500">
        <div>
          <p>กำหนดเริ่ม:</p>
          <p className="text-foreground font-medium">
            {selected.startPlanned ? formatDate(selected.startPlanned) : "-"}
          </p>
        </div>
        <div>
          <p>กำหนดเสร็จ:</p>
          <p className="text-foreground font-medium">
            {selected.finishPlanned ? formatDate(selected.finishPlanned) : "-"}
          </p>
        </div>
        <div>
          <p>งบประมาณ:</p>
          <p className="text-primary font-medium">
            {(selected.budget || 0).toLocaleString()} 
          </p>
        </div>
      </div>

      <div className="space-y-2 max-w-xl">
        <div className="flex justify-between text-sm font-medium">
          <span>ความคืบหน้า</span>
          <span className="text-primary">{selected.progressPercent || 0}%</span>
        </div>
        <Progress
          value={selected.progressPercent || 0}
          color="primary"
          className="h-2"
        />
      </div>
    </>
  );
};

export default UpdateMainTask;