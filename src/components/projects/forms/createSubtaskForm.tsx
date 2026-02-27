import { CreateSubtaskFormProps } from "@/lib/type";
import { Button, Input, Textarea } from "@heroui/react";

const CreateSubtaskForm = ({
  isAddingSubtask,
  setIsAddingSubtask,
  newSubtask,
  setNewSubtask,
  handleSaveSubtask,
  isSavingSubtask,
}: CreateSubtaskFormProps) => {
  if (!isAddingSubtask) {
    return (
      <Button
        color="primary"
        variant="flat"
        size="sm"
        className="mt-2"
        onPress={() => setIsAddingSubtask(true)}
      >
        + เพิ่มรายการย่อย
      </Button>
    );
  }
  return (
    <div className="bg-default-50 dark:bg-zinc-800/50 p-4 rounded-xl space-y-3 mt-3 border border-default-200 dark:border-zinc-700 animate-appearance-in">
      <p className="text-sm font-semibold text-primary">เพิ่มรายการย่อยใหม่</p>

      <Input
        size="sm"
        isRequired
        label="ชื่อรายการย่อย"
        variant="bordered"
        value={newSubtask.detailName}
        onValueChange={(val) =>
          setNewSubtask({ ...newSubtask, detailName: val })
        }
      />

      <Textarea
        size="sm"
        label="รายละเอียด"
        variant="bordered"
        minRows={1}
        value={newSubtask.detailDesc}
        onValueChange={(val) =>
          setNewSubtask({ ...newSubtask, detailDesc: val })
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        <Input
          size="sm"
          type="date"
          label="วันที่เริ่ม"
          variant="bordered"
          value={newSubtask.startPlanned}
          onValueChange={(val) =>
            setNewSubtask({ ...newSubtask, startPlanned: val })
          }
        />
        <Input
          size="sm"
          type="number"
          label="ระยะเวลา (วัน)"
          variant="bordered"
          min={1}
          value={newSubtask.durationDays}
          onValueChange={(val) =>
            setNewSubtask({ ...newSubtask, durationDays: val })
          }
        />
        <Input
          size="sm"
          type="number"
          label="น้ำหนักงาน (%)"
          variant="bordered"
          min={0}
          max={100}
          value={newSubtask.weightPercent}
          onValueChange={(val) =>
            setNewSubtask({ ...newSubtask, weightPercent: val })
          }
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button
          size="sm"
          variant="light"
          color="danger"
          onPress={() => setIsAddingSubtask(false)}
          isDisabled={isSavingSubtask}
        >
          ยกเลิก
        </Button>
        <Button
          size="sm"
          color="primary"
          onPress={handleSaveSubtask}
          isLoading={isSavingSubtask}
        >
          บันทึก
        </Button>
      </div>
    </div>
  );
};

export default CreateSubtaskForm;
