import React, { useRef, useEffect, useState } from "react";

type VideoProcessorProps = {
  mode: "live" | "upload";
  videoFile: File | null;
  onProcessFrame?: (imageData: ImageData) => void;
};

const VideoProcessor: React.FC<VideoProcessorProps> = ({ mode, videoFile, onProcessFrame }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (mode === "live") {
      navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      });
    } else if (mode === "upload" && videoFile) {
      const url = URL.createObjectURL(videoFile);
      if (videoRef.current) {
        videoRef.current.src = url;
        videoRef.current.load();
        videoRef.current.play();
      }
    }
  }, [mode, videoFile]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const processFrame = () => {
      if (!video.paused && !video.ended) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        onProcessFrame?.(imageData);
      }
      requestAnimationFrame(processFrame);
    };

    video.onloadeddata = () => {
      setIsReady(true);
      processFrame();
    };
  }, [onProcessFrame]);

  return (
    <div>
      <video
        ref={videoRef}
        width={640}
        height={480}
        muted
        autoPlay
        style={{ border: "1px solid gray" }}
      />
    </div>
  );
};

export default VideoProcessor;
