import { useState, useEffect } from "react";
import {
  Button,
  Card,
  CardBody,
  CardFooter,
  Chip,
  Spinner,
} from "@heroui/react";
import { MapPin, Trash2, VideoOff } from "lucide-react";
import EzvizCamera from "./EzvizCamera";

import { getCameraCredentials } from "@/lib/camera/cameraGetToken";

const LiveCameraCard = ({
  camera,
  onEdit,
  onDelete,
}: {
  camera: any;
  onEdit?: (cam: any) => void;
  onDelete?: (cam: any) => void;
}) => {
  const [liveToken, setLiveToken] = useState("");
  const [liveUrl, setLiveUrl] = useState("");
  const [liveAreaDomain, setLiveAreaDomain] = useState(
    "https://open.ezviz.com",
  );
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");

  useEffect(() => {
    let isMounted = true;
    const fetchStream = async () => {
      // 🌟 ดักเคส 1: ไม่มี SN ตั้งแต่แรก ไม่ต้องเสียเวลาไปเรียก API
      if (!camera?.id) {
        if (isMounted) {
          setFetchError("ไม่พบหมายเลขซีเรียล (SN) ของกล้องตัวนี้");
          setIsLoading(false);
        }
        return;
      }

      // 🌟 ดักเคส 2: กล้อง Offline ปิดไปเลย
      if (camera.status !== "online") {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setFetchError("");

      try {
        const res = await getCameraCredentials(camera.id, "1");
        if (!isMounted) return;

        // 🌟 ดักเคส 3: เรียก API สำเร็จ และได้ URL มาจริงๆ
        if (res.success && res.ezopenUrl && res.accessToken) {
          setLiveToken(res.accessToken);
          setLiveUrl(res.ezopenUrl);
          setLiveAreaDomain(res.areaDomain || "https://open.ezviz.com");
        } else {
          // ถ้า API แจ้ง Error หรือไม่ได้ URL กลับมา
          setFetchError(
            res.error || "เกิดข้อผิดพลาดในการดึงสตรีม หรือ SN ไม่ถูกต้อง",
          );
        }
      } catch (err) {
        if (isMounted) setFetchError("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchStream();
    return () => {
      isMounted = false;
    };
  }, [camera.id, camera.status]);

  return (
    <Card className="border-none shadow-md bg-zinc-900 text-white overflow-hidden h-full group flex flex-col">
      <CardBody className="p-0 relative aspect-video flex items-center justify-center bg-black shrink-0">
        <Chip
          color={camera.status === "online" ? "success" : "danger"}
          size="sm"
          className="absolute top-3 right-3 shadow-lg font-bold z-20"
        >
          {camera.status.toUpperCase()}
        </Chip>
        {camera.status !== "online" ? (
          <div className="flex flex-col items-center text-zinc-600">
            <VideoOff size={40} strokeWidth={1.5} />
            <span className="text-xs mt-2 uppercase tracking-wider">
              Offline
            </span>
          </div>
        ) : isLoading ? (
          <div className="flex flex-col items-center">
            <Spinner size="md" color="primary" />
            <span className="text-[10px] text-zinc-500 mt-3 font-mono">
              CONNECTING...
            </span>
          </div>
        ) : fetchError ? (
          <div className="flex flex-col items-center justify-center p-6 w-full h-full bg-red-950/10">
            <VideoOff size={32} className="text-red-500/50 mb-3" />
            <p className="text-red-500 text-xs font-semibold text-center leading-relaxed max-w-[80%]">
              {fetchError}
            </p>
            <div className="flex gap-2 mt-4">
              <Button
                size="sm"
                variant="flat"
                color="danger"
                className="h-7 text-[10px]"
                onPress={() => window.location.reload()}
              >
                ลองใหม่
              </Button>
            </div>
          </div>
        ) : liveToken && liveUrl ? (
          <div className="w-full h-full relative">
            <EzvizCamera
              key={`${camera.id}-${liveToken.substring(0, 10)}`}
              accessToken={liveToken}
              ezopenUrl={liveUrl}
              areaDomain={liveAreaDomain}
              cameraId={camera.id}
            />
          </div>
        ) : null}
      </CardBody>

      <CardFooter className="flex flex-col items-start px-4 py-4 bg-zinc-800/80 border-t border-white/5 flex-grow">
        <h3 className="font-bold text-sm sm:text-base truncate w-full text-zinc-100 mb-1">
          {camera.name}
        </h3>
        <div className="flex justify-between items-center w-full mt-auto">
          <p className="text-[11px] sm:text-xs text-zinc-500 flex items-center gap-1.5">
            <MapPin size={12} className="text-primary" /> {camera.location}
          </p>
          <div className="flex flex-col items-end">
            <span className="text-[9px] uppercase text-zinc-600 font-bold tracking-tighter">
              Device SN
            </span>
            <p className="text-[10px] sm:text-xs font-mono text-zinc-400 group-hover:text-primary transition-colors">
              {camera.id || "N/A"}
            </p>
          </div>
          {onEdit && (
            <Button
              size="sm"
              variant="bordered"
              className="h-7 text-[10px] border-zinc-700 text-zinc-400 hover:text-white"
              onPress={() => onEdit(camera)}
            >
              แก้ไข SN
            </Button>
          )}

          {onDelete && (
            <Button
              isIconOnly
              size="sm"
              variant="light"
              color="danger"
              className="text-zinc-500 hover:text-danger min-w-0 w-8 h-8 rounded-full"
              onPress={() => onDelete(camera)}
            >
              <Trash2 size={16} />
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};

export default LiveCameraCard;
