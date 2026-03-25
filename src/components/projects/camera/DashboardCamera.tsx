"use client";

import { useState } from "react";
import {
  Video,
  Plus,
  Camera as CameraIcon,
  MapPin,
  Settings2,
  X,
} from "lucide-react";
import {
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Input,
  Select,
  SelectItem,
} from "@heroui/react";
import { DashboardCameraProp } from "@/lib/type";
import LiveCameraCard from "./LiveCameraCard";

// เริ่มต้นด้วย Mock Data เดิม
const initialCameras = [
  {
    id: "BG5492715",
    name: "กล้องหน้าไซต์งาน (ประตู 1)",
    location: "โซน A - ทางเข้าหลัก",
    status: "online",
  },
];

const DashboardCamera = ({
  projectId,
  organizationId,
  currentUserId,
}: DashboardCameraProp) => {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [cameras, setCameras] = useState(initialCameras);

  // State สำหรับ Form
  const [newCamera, setNewCamera] = useState({
    id: "",
    name: "",
    location: "",
    status: "online",
  });

  const handleAddCamera = () => {
    if (!newCamera.id || !newCamera.name) return;
    setCameras([...cameras, newCamera]);
    setNewCamera({ id: "", name: "", location: "", status: "online" });
    onOpenChange();
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-default-100 pb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Video className="text-primary" /> ระบบกล้องวงจรปิด (CCTV)
          </h1>
          <p className="text-default-500 text-sm mt-1">
            จัดการและดูสถานะกล้องวงจรปิดหน้างานแบบ Real-time
          </p>
        </div>

        <Button
          onPress={onOpen}
          color="primary"
          endContent={<Plus size={18} />}
          className="font-bold shadow-lg"
        >
          เพิ่มกล้องใหม่
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {cameras.map((cam) => (
          <LiveCameraCard key={cam.id} camera={cam} />
        ))}

        {cameras.length === 0 && (
          <div className="col-span-full py-20 flex flex-col items-center justify-center border-2 border-dashed border-default-200 rounded-3xl text-default-400">
            <CameraIcon size={48} strokeWidth={1} />
            <p className="mt-4">ยังไม่มีการเพิ่มกล้องในระบบ</p>
          </div>
        )}
      </div>

      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        backdrop="blur"
        classNames={{
          base: "bg-zinc-900 text-white",
          header: "border-b border-white/10",
          footer: "border-t border-white/10",
          closeButton: "hover:bg-white/10",
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex gap-2 items-center">
                <Settings2 size={20} className="text-primary" />
                <span>ลงทะเบียนกล้องใหม่</span>
              </ModalHeader>
              <ModalBody className="py-6 space-y-4">
                <Input
                  label="Device Serial Number (ID)"
                  placeholder="เช่น BG5492715"
                  labelPlacement="outside"
                  variant="bordered"
                  value={newCamera.id}
                  onValueChange={(val) =>
                    setNewCamera({ ...newCamera, id: val })
                  }
                  classNames={{ label: "text-zinc-300" }}
                />
                <Input
                  label="ชื่อเรียกกล้อง"
                  placeholder="เช่น กล้องประตูหน้า"
                  labelPlacement="outside"
                  variant="bordered"
                  value={newCamera.name}
                  onValueChange={(val) =>
                    setNewCamera({ ...newCamera, name: val })
                  }
                  classNames={{ label: "text-zinc-300" }}
                />
                <Input
                  label="ตำแหน่งที่ติดตั้ง (Location)"
                  placeholder="เช่น โซน A ทางเข้า"
                  labelPlacement="outside"
                  variant="bordered"
                  value={newCamera.location}
                  onValueChange={(val) =>
                    setNewCamera({ ...newCamera, location: val })
                  }
                  classNames={{ label: "text-zinc-300" }}
                />
                <Select
                  label="สถานะเริ่มต้น"
                  labelPlacement="outside"
                  variant="bordered"
                  selectedKeys={[newCamera.status]}
                  onChange={(e) =>
                    setNewCamera({ ...newCamera, status: e.target.value })
                  }
                  classNames={{ label: "text-zinc-300", trigger: "text-white" }}
                >
                  <SelectItem key="online" textValue="Online">
                    Online
                  </SelectItem>
                  <SelectItem key="offline" textValue="Offline">
                    Offline
                  </SelectItem>
                </Select>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" color="danger" onPress={onClose}>
                  ยกเลิก
                </Button>
                <Button
                  color="primary"
                  onPress={handleAddCamera}
                  isDisabled={!newCamera.id || !newCamera.name}
                  className="font-bold px-8"
                >
                  บันทึกข้อมูล
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
};

export default DashboardCamera;
