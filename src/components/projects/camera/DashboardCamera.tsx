"use client";

import { useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  useDisclosure,
  Card,
  CardBody,
  CardFooter,
  Button,
  Chip,
} from "@heroui/react";
import { Play, MapPin, Video, Signal } from "lucide-react";
import EzvizCamera from "./EzvizCamera";
import { DashboardCameraProp } from "@/lib/type";

const mockCameras = [
  {
    id: "BG5492715",
    name: "กล้องหน้าไซต์งาน (ประตู 1)",
    location: "โซน A - ทางเข้าหลัก",
    status: "online",
    thumbnail:
      "https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=600&auto=format&fit=crop",
    ezopenUrl: "ezopen://open.ezviz.com/BG5492715/1.hd.live",
  },
  {
    id: "cam02",
    name: "กล้องมุมสูง (เครน)",
    location: "โซน B - โครงสร้าง",
    status: "online",
    thumbnail:
      "https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=600&auto=format&fit=crop",
    ezopenUrl: "ezopen://open.ezviz.com/BG5492715/1.hd.live",
  },
];

const DashboardCamera = ({ accessToken }: DashboardCameraProp) => {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [selectedCamera, setSelectedCamera] = useState<any>(null);

  const [currentToken, setCurrentToken] = useState<string>(accessToken);

  const handleViewCamera = (camera: any) => {
    setSelectedCamera(camera);
    onOpen();
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Video className="text-primary" /> ระบบกล้องวงจรปิด (CCTV)
          </h1>
          <p className="text-default-500 text-sm mt-1">
            เลือกกล้องที่ต้องการตรวจสอบสถานะหน้างานแบบ Real-time
          </p>
        </div>
      </div>

      {/* 🌟 2. แสดงรายการกล้องแบบ Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {mockCameras.map((cam) => (
          <Card
            key={cam.id}
            isPressable={cam.status === "online"} // ถ้าออฟไลน์กดไม่ได้
            onPress={() => handleViewCamera(cam)}
            className={`border-none shadow-md hover:scale-[1.02] transition-transform ${
              cam.status === "offline" ? "opacity-60 grayscale" : ""
            }`}
          >
            <CardBody className="p-0 relative group">
              <div
                className="w-full h-48 bg-cover bg-center"
                style={{ backgroundImage: `url(${cam.thumbnail})` }}
              >
                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors" />
              </div>

              <Chip
                startContent={<Signal size={14} />}
                color={cam.status === "online" ? "success" : "danger"}
                size="sm"
                className="absolute top-3 right-3 shadow-lg font-bold"
              >
                {cam.status.toUpperCase()}
              </Chip>

              {/* ปุ่ม Play วงกลมตรงกลาง (โชว์ตอน Online) */}
              {cam.status === "online" && (
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="bg-primary/90 text-white p-4 rounded-full shadow-xl">
                    <Play fill="currentColor" size={24} />
                  </div>
                </div>
              )}
            </CardBody>

            <CardFooter className="flex flex-col items-start px-4 py-3 bg-default-50/50">
              <h3 className="font-bold text-base truncate w-full">
                {cam.name}
              </h3>
              <p className="text-xs text-default-500 flex items-center gap-1 mt-1">
                <MapPin size={12} /> {cam.location}
              </p>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* 🌟 3. Modal สำหรับดูไลฟ์สด */}
      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        size="4xl" // ขนาดใหญ่เต็มตา
        backdrop="blur" // พื้นหลังเบลอ
        placement="center"
        classNames={{
          base: "bg-zinc-900 text-white", // ธีมสีเข้มเหมาะกับวิดีโอ
          closeButton: "hover:bg-white/10 active:bg-white/20",
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1 border-b border-white/10 pb-4">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-danger opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-danger"></span>
                  </span>
                  <span className="text-lg font-bold">
                    LIVE: {selectedCamera?.name}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 font-normal flex items-center gap-1">
                  <MapPin size={12} /> {selectedCamera?.location}
                </p>
              </ModalHeader>

              <ModalBody className="p-4 sm:p-6 bg-black">
                {/* 🌟 โหลด Component วิดีโอเฉพาะตอนที่ Modal เปิดอยู่ 
                  เพื่อให้ประหยัดทรัพยากร (Unmount ทิ้งตอนปิด)
                */}
                {selectedCamera && selectedCamera.status === "online" ? (
                  <EzvizCamera
                    key={selectedCamera.id}
                    cameraId={selectedCamera.id}
                    accessToken={currentToken}
                    ezopenUrl={selectedCamera.ezopenUrl}
                  />
                ) : (
                  <div className="w-full aspect-video flex items-center justify-center text-zinc-500">
                    สัญญาณขาดหาย หรือ กล้องออฟไลน์
                  </div>
                )}
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
};

export default DashboardCamera;
