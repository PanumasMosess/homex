import { generateSubtasksAI } from "@/lib/ai/geminiAI";
import { CreateSubtaskFormProps } from "@/lib/type";
import { Button, Input, Spinner, Textarea } from "@heroui/react";
import { Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "react-toastify";

const CreateSubtaskForm = ({
  isAddingSubtask,
  setIsAddingSubtask,
  newSubtask,
  setNewSubtask,
  handleSaveSubtask,
  isSavingSubtask,
  taskName,
  onAISuccess,
}: CreateSubtaskFormProps) => {
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  const handleAIQuery = async () => {
    if (!taskName) {
      toast.warning("ไม่พบชื่อโครงการหลักสำหรับวิเคราะห์");
      return;
    }

    setIsGeneratingAI(true);

    try {
      const myPrompt = `ช่วยลิสต์รายการย่อย (subtasks) สำหรับงานก่อสร้างชื่อ "${taskName}" มาให้หน่อยจำนวน 10 ข้อ โดยขอผลลัพธ์เป็น JSON array ของวัตถุที่มีฟิลด์ detailName, detailDesc, และ weightPercent (รวมกันได้ 100)`;
      const result = await generateSubtasksAI(myPrompt);

      if (result && result.length > 0) {
        if (onAISuccess) {
          await onAISuccess(result);
          toast.success("AI สร้างและบันทึกรายการย่อยเรียบร้อยแล้ว");
        }
      } else {
        toast.error("AI ไม่สามารถสร้างข้อมูลได้");
      }
    } catch (error) {
      console.error("AI Query Error:", error);
      toast.error("เกิดข้อผิดพลาดในการทำงานของ AI");
    } finally {
      setIsGeneratingAI(false);
    }
  };

  if (!isAddingSubtask) {
    return (
      <div className="flex gap-2 mt-2">
        <Button
          color="primary"
          variant="flat"
          size="sm"
          onPress={() => setIsAddingSubtask(true)}
        >
          + เพิ่มรายการย่อย
        </Button>

        <Button
          color="secondary"
          variant="ghost"
          size="sm"
          startContent={!isGeneratingAI && <Sparkles size={16} />}
          onPress={handleAIQuery}
          isLoading={isGeneratingAI}
        >
          {isGeneratingAI ? "AI กำลังคิด..." : "สร้างงานย่อย 10 ข้อด้วย AI"}
        </Button>
      </div>
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
