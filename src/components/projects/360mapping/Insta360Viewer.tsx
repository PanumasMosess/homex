"use client";

import { ReactPhotoSphereViewer } from "react-photo-sphere-viewer";

type Insta360ViewerProps = {
  imageUrl: string;
};

export default function Insta360Viewer({ imageUrl }: Insta360ViewerProps) {
  if (!imageUrl) return null;

  return (
    <div className="w-full h-full bg-black">
      <ReactPhotoSphereViewer
        src={imageUrl}
        height="100%"
        width="100%"
        littlePlanet={false} // เปลี่ยนเป็น true ถ้าอยากให้ตอนเริ่มโหลดมันหมุนมาจากลูกโลกจิ๋ว
        navbar={[
          "zoom",
          "move",
          "download",
          "caption",
          "fullscreen",
        ]}
        // ตั้งค่ามุมกล้องเริ่มต้นได้ (ถ้าต้องการ)
        // defaultYaw={0} 
        // defaultPitch={0}
      />
    </div>
  );
}