import { Modal, ModalContent, ModalHeader, ModalBody, Spinner } from "@heroui/react";
import { Eye } from "lucide-react";
import dynamic from "next/dynamic";

const DynamicInsta360Viewer = dynamic(() => import("./Insta360Viewer"), { // 🌟 เช็ค path ไฟล์ Insta360Viewer ของคุณด้วยนะครับ
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-black/50">
      <Spinner size="lg" color="primary" />
    </div>
  ),
});

export default function Viewer360Modal({ selectedMedia, onClose }: any) {
  return (
    <Modal
      isOpen={!!selectedMedia}
      onOpenChange={(open) => !open && onClose()}
      size="5xl"
      backdrop="opaque"
      classNames={{ base: "bg-zinc-950", header: "border-b border-white/10", closeButton: "z-50" }}
    >
      <ModalContent>
        <ModalHeader className="flex items-center gap-2">
          <Eye className="text-primary" size={20} /> {selectedMedia?.title}
        </ModalHeader>
        <ModalBody className="p-0 bg-black">
          <div className="w-full h-[60vh] md:h-[70vh] relative">
            {selectedMedia && (
              <DynamicInsta360Viewer
                imageUrl={`${selectedMedia.thumbnail}?t=${new Date().getTime()}`}
              />
            )}
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}