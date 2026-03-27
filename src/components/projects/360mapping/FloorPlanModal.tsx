import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  Button,
  Tooltip,
} from "@heroui/react";
import {
  Layers,
  X as CloseIcon,
  Plus,
  MousePointerClick,
  Camera,
} from "lucide-react";

export default function FloorPlanModal({
  selectedFloorPlan,
  setSelectedFloorPlan,
  isAddingMode,
  setIsAddingMode,
  setTempPoint,
  handleCancelAddPoint,
  handleMapClick,
  setSelectedMedia,
  tempPoint,
  handleDeletePoint, 
}: any) {
  return (
    <Modal
      isOpen={!!selectedFloorPlan}
      onOpenChange={(open) => {
        if (!open) {
          setSelectedFloorPlan(null);
          setIsAddingMode(false);
          setTempPoint(null);
        }
      }}
      size="5xl"
      backdrop="blur"
      classNames={{
        base: "bg-zinc-950 border border-white/10",
        header: "border-b border-white/10 bg-zinc-900/50",
        closeButton: "z-50 hover:bg-white/10",
      }}
    >
      <ModalContent>
        {() => (
          <>
            <ModalHeader className="flex justify-between items-center pr-10">
              <div className="flex flex-col gap-1">
                <span className="text-lg font-bold flex items-center gap-2 text-white">
                  <Layers className="text-primary" size={20} />
                  {selectedFloorPlan?.name}
                </span>
                <span className="text-xs text-zinc-500 font-normal">
                  มีจุด 360 ทั้งหมด {selectedFloorPlan?.points?.length || 0} จุด
                </span>
              </div>

              {isAddingMode ? (
                <Button
                  color="danger"
                  variant="flat"
                  size="sm"
                  onPress={handleCancelAddPoint}
                  endContent={<CloseIcon size={16} />}
                >
                  ยกเลิกการวาง
                </Button>
              ) : (
                <Button
                  color="primary"
                  size="sm"
                  onPress={() => setIsAddingMode(true)}
                  endContent={<Plus size={16} />}
                >
                  เพิ่มจุด 360°
                </Button>
              )}
            </ModalHeader>

            <ModalBody className="p-4 bg-zinc-950">
              {isAddingMode && (
                <div className="bg-primary/20 border border-primary text-primary px-4 py-2 rounded-lg flex items-center gap-2 animate-pulse mb-2">
                  <MousePointerClick size={16} />
                  <p className="font-bold text-xs">คลิกบนแผนที่เพื่อวางจุด</p>
                </div>
              )}

              <div
                className={`relative w-full aspect-[4/3] md:aspect-[16/9] bg-black rounded-xl overflow-hidden group border border-white/10 ${isAddingMode ? "cursor-crosshair" : "cursor-default"}`}
                onClick={handleMapClick}
              >
                <img
                  src={selectedFloorPlan?.imageUrl}
                  alt="Floor Plan"
                  className={`w-full h-full object-cover transition-opacity duration-500 ${isAddingMode ? "opacity-30" : "opacity-60"}`}
                />

                {selectedFloorPlan?.points?.map((point: any) => (
                  <div
                    key={point.id}
                    className="absolute flex flex-col items-center justify-center transform -translate-x-1/2 -translate-y-1/2 z-10 group/pin"
                    style={{ left: `${point.x}%`, top: `${point.y}%` }}
                  >
                    <Tooltip
                      content={
                        <div className="font-bold text-xs p-1">
                          {point.title}
                        </div>
                      }
                      placement="top"
                      color="foreground"
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedMedia(point); 
                        }}
                        className="relative bg-primary text-white p-2 rounded-full shadow-lg border border-white hover:scale-125 transition-transform"
                      >
                        <Camera size={14} />
                      </button>
                    </Tooltip>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletePoint(point); 
                      }}
                      className="absolute -top-2 -right-2 bg-danger text-white p-1 rounded-full opacity-0 group-hover/pin:opacity-100 transition-opacity shadow-[0_0_10px_rgba(0,0,0,0.5)] hover:scale-110 z-20"
                    >
                      <CloseIcon size={10} strokeWidth={3} />
                    </button>

                    <div className="absolute w-8 h-8 bg-primary/40 rounded-full animate-ping opacity-75 -z-10"></div>
                  </div>
                ))}

                {tempPoint && (
                  <div
                    className="absolute flex flex-col items-center justify-center transform -translate-x-1/2 -translate-y-1/2 z-20"
                    style={{ left: `${tempPoint.x}%`, top: `${tempPoint.y}%` }}
                  >
                    <div className="relative bg-warning text-black p-2 rounded-full shadow-lg border border-white animate-bounce">
                      <Camera size={14} />
                    </div>
                  </div>
                )}
              </div>
            </ModalBody>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
