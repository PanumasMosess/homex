"use client";

import {  Video } from "lucide-react";
import { DashboardCameraProp } from "@/lib/type";
import LiveCameraCard from "./LiveCameraCard";

const mockCameras = [
  {
    id: "BG5492715",
    name: "กล้องหน้าไซต์งาน (ประตู 1)",
    location: "โซน A - ทางเข้าหลัก",
    status: "online",
  },
  // สามารถเพิ่มกล้องตัวอื่นได้เลย
  // {
  //   id: "cam02",
  //   name: "กล้องมุมสูง (เครน)",
  //   location: "โซน B - โครงสร้าง",
  //   status: "online",
  // },
];

const DashboardCamera = ({
  accessToken: initialToken,
}: DashboardCameraProp) => {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Video className="text-primary" /> ระบบกล้องวงจรปิด (CCTV)
          </h1>
          <p className="text-default-500 text-sm mt-1">
            ดูสถานะกล้องวงจรปิดหน้างานแบบ Real-time
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {mockCameras.map((cam) => (
          <LiveCameraCard key={cam.id} camera={cam} />
        ))}
      </div>
    </div>
  );
};

export default DashboardCamera;
