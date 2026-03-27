"use client";

import { ReactPhotoSphereViewer } from "react-photo-sphere-viewer";

type Insta360ViewerProps = {
  imageUrl: string;
  caption?: string; 
};

export default function Insta360Viewer({ imageUrl, caption }: Insta360ViewerProps) {
  if (!imageUrl) return null;

  return (
    <div className="w-full h-full bg-black">
      <ReactPhotoSphereViewer
        key={imageUrl} 
        src={imageUrl}
        height="100%"
        width="100%"
        littlePlanet={false}
        caption={caption} 
        navbar={[
          "zoom",
          "move",
          "download",
          "caption", 
          "fullscreen",
        ]}
      />
    </div>
  );
}