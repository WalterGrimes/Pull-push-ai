import React, { useRef, useEffect, useCallback } from "react";
import { Pose, POSE_CONNECTIONS } from "@mediapipe/pose";
import { Camera } from "@mediapipe/camera_utils";
import { drawConnectors, drawLandmarks } from "@mediapipe/drawing_utils";

const pose = new Pose({
  locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
});

pose.setOptions({
  modelComplexity: 0, // Уменьшаем сложность модели
  smoothLandmarks: false, // Отключаем сглаживание для производительности
  enableSegmentation: false,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5
});

export function PoseCamera({ onResults }: { onResults?: (results: Results) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);
  const cameraRef = useRef<Camera>();

  // Обработчик результатов с throttle
  const handleResults = useCallback((results: Results) => {
    const now = Date.now();
    if (now - lastTimeRef.current < 33) return; // Ограничиваем ~30 FPS
    
    lastTimeRef.current = now;
    
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Рисуем только когда нужно
    if (results.poseLandmarks) {
      drawConnectors(ctx, results.poseLandmarks, POSE_CONNECTIONS, {
        color: '#00FF00',
        lineWidth: 2
      });
      drawLandmarks(ctx, results.poseLandmarks, {
        color: '#FF0000',
        lineWidth: 1
      });
    }

    onResults?.(results);
  }, [onResults]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    pose.onResults(handleResults);

    cameraRef.current = new Camera(video, {
      onFrame: async () => {
        if (video.readyState < 2) return;
        await pose.send({ image: video });
      },
      width: 640,
      height: 480,
      facingMode: "user"
    });
    
    cameraRef.current.start();

    return () => {
      cameraRef.current?.stop();
      cancelAnimationFrame(requestRef.current);
    };
  }, [handleResults]);

  return (
    <div style={{ position: 'relative' }}>
      <video ref={videoRef} style={{ display: 'none' }} playsInline />
      <canvas
        ref={canvasRef}
        width={640}
        height={480}
        style={{
          width: '100%',
          height: 'auto',
          transform: 'scaleX(-1)' // Зеркальное отображение
        }}
      />
    </div>
  );
}