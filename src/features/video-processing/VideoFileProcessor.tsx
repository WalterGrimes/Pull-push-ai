// src/components/VideoFileProcessor.tsx

import React, { useRef, useEffect, useCallback } from "react";
import { Pose, POSE_CONNECTIONS, Results } from "@mediapipe/pose";
import { drawConnectors, drawLandmarks } from "@mediapipe/drawing_utils";

// Создаем один экземпляр Pose, как и в PoseCamera
const pose = new Pose({
  locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
});

pose.setOptions({
  modelComplexity: 1, // Можно использовать более сложную модель для видеофайлов
  smoothLandmarks: true,
  enableSegmentation: false,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5,
});

type Props = {
  videoFile: File;
  onResults: (results: Results) => void;
};

export function VideoFileProcessor({ videoFile, onResults }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number>(0);

  // Этот callback будет вызываться MediaPipe с результатами
  const handlePoseResults = useCallback(
    (results: Results) => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;

      // Очищаем канвас и рисуем кадр видео
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

      // Рисуем скелет
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

      // Отправляем результаты в родительский компонент (App.tsx)
      onResults(results);
    },
    [onResults]
  );

  useEffect(() => {
    pose.onResults(handlePoseResults);
  }, [handlePoseResults]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoFile) return;

    // Создаем URL для файла и запускаем видео
    const videoUrl = URL.createObjectURL(videoFile);
    video.src = videoUrl;
    video.play();

    // Функция для обработки каждого кадра
    const processFrame = async () => {
      if (video.paused || video.ended) {
        // Останавливаем цикл, если видео закончилось
        return;
      }
      await pose.send({ image: video });
      // Запрашиваем следующий кадр для обработки
      animationFrameId.current = requestAnimationFrame(processFrame);
    };

    // Начинаем обработку, когда видео начнет проигрываться
    video.addEventListener("playing", processFrame);

    // Очистка при размонтировании компонента
    return () => {
      video.removeEventListener("playing", processFrame);
      cancelAnimationFrame(animationFrameId.current);
      URL.revokeObjectURL(videoUrl);
    };
  }, [videoFile]);

  return (
    <div style={{ position: "relative" }}>
      {/* Скрытый видеоэлемент для обработки */}
      <video ref={videoRef} style={{ display: "none" }} playsInline />
      {/* Канвас для отображения результата */}
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
}