// src/features/video-processing/VideoFileProcessor.tsx

import React, { useRef, useEffect, useCallback, memo } from "react";
import { Pose, POSE_CONNECTIONS } from "@mediapipe/pose";
import type { Results } from "@mediapipe/pose";
import { drawConnectors, drawLandmarks } from "@mediapipe/drawing_utils";

const pose = new Pose({
  locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
});

pose.setOptions({
  modelComplexity: 1,
  smoothLandmarks: true,
  enableSegmentation: false,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5,
});

type Props = {
  videoFile: File;
  onResults: (results: Results) => void;
};

const VideoFileProcessorComponent: React.FC<Props> = ({ videoFile, onResults }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number>(0);
  
  // Стабильная ссылка на колбэк
  const stableOnResults = useRef(onResults);
  
  useEffect(() => {
    stableOnResults.current = onResults;
  });

  const handlePoseResults = useCallback((results: Results) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

    if (results.poseLandmarks) {
      drawConnectors(ctx, results.poseLandmarks, POSE_CONNECTIONS, {
        color: "#00FF00",
        lineWidth: 2,
      });
      drawLandmarks(ctx, results.poseLandmarks, {
        color: "#FF0000",
        lineWidth: 1,
      });
    }

    stableOnResults.current(results);
  }, []);

  useEffect(() => {
    pose.onResults(handlePoseResults);
  }, [handlePoseResults]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoFile) return;

    const videoUrl = URL.createObjectURL(videoFile);
    video.src = videoUrl;
    video.play();

    const processFrame = async () => {
      if (video.paused || video.ended) {
        return;
      }
      await pose.send({ image: video });
      animationFrameId.current = requestAnimationFrame(processFrame);
    };

    video.addEventListener("playing", processFrame);

    return () => {
      video.removeEventListener("playing", processFrame);
      cancelAnimationFrame(animationFrameId.current);
      URL.revokeObjectURL(videoUrl);
    };
  }, [videoFile]);

  return (
    <div style={{ position: "relative" }}>
      <video ref={videoRef} style={{ display: "none" }} playsInline />
      <canvas
        ref={canvasRef}
        width={640}
        height={480}
        style={{
          width: "100%",
          height: "auto",
        }}
      />
    </div>
  );
};

export const VideoFileProcessor = memo(VideoFileProcessorComponent);