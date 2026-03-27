import { Modal, ModalContent, ModalHeader, ModalBody, Spinner, Button, Chip } from "@heroui/react";
import { Eye, Clock, History, PlusCircle, View } from "lucide-react";
import dynamic from "next/dynamic";
import { useState, useEffect } from "react";

const DynamicInsta360Viewer = dynamic(() => import("./Insta360Viewer"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-black/80">
      <Spinner size="lg" color="primary" label="กำลังโหลดภาพ 360 องศา..." />
    </div>
  ),
});

export default function Viewer360Modal({ selectedMedia, onClose, handleAddNewHistory }: any) {
  // 🌟 State เก็บรูปภาพที่กำลังดูอยู่ (เริ่มแรกดึงรูปประวัติล่าสุดมาโชว์)
  const [currentImage, setCurrentImage] = useState<any>(null);

  useEffect(() => {
    if (selectedMedia) {
      // ตั้งค่าเป็นรูปประวัติล่าสุดเป็นค่าเริ่มต้น
      const latestHistory = selectedMedia.histories && selectedMedia.histories.length > 0 
        ? selectedMedia.histories[0] 
        : null;
        
      setCurrentImage({
        ...selectedMedia,
        imageUrl: latestHistory?.imageUrl || selectedMedia.thumbnail, // รองรับข้อมูลเก่า
        versionDate: latestHistory?.createdAt || null,
      });
    }
  }, [selectedMedia]);

  const formattedDate = currentImage?.versionDate
    ? new Date(currentImage.versionDate).toLocaleDateString("th-TH", {
        year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit",
      })
    : "";

  const captionText = currentImage?.title
    ? `<b>${currentImage.title}</b> ${formattedDate ? `(ถ่ายเมื่อ: ${formattedDate})` : ""}`
    : "";

  return (
    <Modal
      isOpen={!!selectedMedia}
      onOpenChange={(open) => !open && onClose()}
      size="5xl"
      backdrop="opaque"
      classNames={{
        base: "bg-zinc-950 text-white",
        header: "border-b border-white/10",
        closeButton: "z-50 hover:bg-white/10",
      }}
    >
      <ModalContent>
        {() => (
          <>
            <ModalHeader className="flex justify-between items-center pr-10">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <Eye className="text-primary" size={20} />
                  <span className="text-lg font-bold">{currentImage?.title}</span>
                </div>
                {formattedDate && (
                  <div className="flex items-center gap-1 text-xs text-primary-400 font-normal">
                    <Clock size={12} />
                    <span>{formattedDate}</span>
                  </div>
                )}
              </div>
            </ModalHeader>

            {/* 🌟 แบ่งหน้าจอเป็น 2 ส่วน: Viewer และ Sidebar */}
            <ModalBody className="p-0 bg-black flex flex-col md:flex-row">
              
              {/* ซ้าย: Viewer 360 */}
              <div className="w-full md:flex-1 h-[50vh] md:h-[70vh] relative border-b md:border-b-0 md:border-r border-white/10">
                {currentImage?.imageUrl ? (
                  <DynamicInsta360Viewer imageUrl={currentImage.imageUrl} caption={captionText} />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-zinc-500">
                    <History size={48} className="mb-4 opacity-50" />
                    <p>ยังไม่มีประวัติรูปภาพในจุดนี้</p>
                  </div>
                )}
              </div>

              {/* ขวา: แถบประวัติ (Timeline) */}
              <div className="w-full md:w-64 bg-zinc-900 p-4 flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold flex items-center gap-1"><History size={14}/> ประวัติรูปภาพ</span>
                  <Chip size="sm" color="primary" variant="flat" className="text-[10px]">
                    {selectedMedia.histories?.length || 0} เวอร์ชัน
                  </Chip>
                </div>

                {/* 🌟 รายการประวัติที่ให้ผู้ใช้กดสลับดูได้ */}
                <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar">
                  {selectedMedia.histories?.map((history: any, index: number) => {
                    // เช็คว่ากำลังดูรูปนี้อยู่หรือเปล่า
                    const isActive = currentImage?.versionDate === history.createdAt;
                    return (
                      <button
                        key={history.id}
                        onClick={() => {
                          setCurrentImage({
                            ...selectedMedia,
                            imageUrl: history.imageUrl,
                            versionDate: history.createdAt,
                          });
                        }}
                        className={`w-full text-left p-3 rounded-lg flex justify-between items-center transition-all ${
                          isActive 
                            ? "bg-primary/20 border border-primary text-primary" 
                            : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                        }`}
                      >
                        <div className="flex flex-col">
                          <span className="text-xs font-bold">
                            {index === 0 ? "ล่าสุด: " : ""}{new Date(history.createdAt).toLocaleDateString("th-TH")}
                          </span>
                          <span className="text-[10px] opacity-70">
                            {new Date(history.createdAt).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        {isActive && <View size={14} />}
                      </button>
                    );
                  })}
                </div>

                {/* 🌟 ปุ่มอัปโหลดรูปใหม่ (ย้ายมาไว้ตรงนี้) */}
                <Button
                  color="primary"
                  className="w-full font-bold shadow-lg"
                  startContent={<PlusCircle size={16} />}
                  onPress={() => handleAddNewHistory(selectedMedia)}
                >
                  อัปโหลดรูปปัจจุบัน
                </Button>
              </div>

            </ModalBody>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}