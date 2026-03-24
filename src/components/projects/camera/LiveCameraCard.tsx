import { useState, useEffect } from "react";
import { Card, CardBody, CardFooter, Chip, Spinner } from "@heroui/react";
import { MapPin, VideoOff } from "lucide-react";
import EzvizCamera from "./EzvizCamera";

import { getCameraCredentials } from "@/lib/camera/cameraGetToken";

const LiveCameraCard = ({ camera }: { camera: any }) => {
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
      if (camera.status !== "online") {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const res = await getCameraCredentials(camera.id, "1");

        if (!isMounted) return;

        if (res.success && res.accessToken && res.ezopenUrl) {
          setLiveToken(res.accessToken);
          setLiveUrl(res.ezopenUrl);
          setLiveAreaDomain(res.areaDomain || "https://open.ezviz.com");
        } else {
          setFetchError(res.error || "ไม่สามารถเชื่อมต่อกล้องได้");
        }
      } catch (err) {
        if (isMounted) setFetchError("เกิดข้อผิดพลาดในการดึงข้อมูล");
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
    <Card className="border-none shadow-md bg-zinc-900 text-white overflow-hidden h-full">
      <CardBody className="p-0 relative aspect-video flex items-center justify-center bg-black">
        <Chip
          color={camera.status === "online" ? "success" : "danger"}
          size="sm"
          className="absolute top-3 right-3 shadow-lg font-bold z-20"
        >
          {camera.status.toUpperCase()}
        </Chip>
        {camera.status !== "online" ? (
          <div className="flex flex-col items-center text-zinc-500">
            <VideoOff size={32} className="mb-2" />
            <span className="text-sm">กล้องออฟไลน์</span>
          </div>
        ) : isLoading ? (
          <div className="flex flex-col items-center text-zinc-400">
            <Spinner size="md" color="primary" />
            <span className="text-xs mt-3">กำลังเชื่อมต่อ...</span>
          </div>
        ) : fetchError ? (
          <div className="text-red-500 text-sm bg-red-950/30 px-4 py-2 rounded text-center">
            {fetchError}
          </div>
        ) : liveToken && liveUrl ? (
          <div className="w-full h-full relative">
            <EzvizCamera
              key={`${camera.id}-${liveToken.substring(0, 10)}`}
              cameraId={camera.id}
              accessToken={liveToken}
              ezopenUrl={liveUrl}
              areaDomain={liveAreaDomain}
            />
          </div>
        ) : null}
      </CardBody>

      <CardFooter className="flex flex-col items-start px-4 py-3 bg-zinc-800/80">
        <h3 className="font-bold text-base truncate w-full">{camera.name}</h3>
        <p className="text-xs text-zinc-400 flex items-center gap-1 mt-1">
          <MapPin size={12} /> {camera.location}
        </p>
      </CardFooter>
    </Card>
  );
};

export default LiveCameraCard;

