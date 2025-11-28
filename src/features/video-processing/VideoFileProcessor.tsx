// src/features/video-processing/VideoFileProcessor.tsx

import React, { useRef, useEffect, useCallback, memo, useState } from "react";
import { Pose, POSE_CONNECTIONS } from "@mediapipe/pose";
import type { Results } from "@mediapipe/pose";
import { drawConnectors, drawLandmarks } from "@mediapipe/drawing_utils";

// Создаём единственный экземпляр Pose
let poseInstance: Pose | null = null;

const getPoseInstance = () => {
  if (!poseInstance) {
    poseInstance = new Pose({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
    });

    poseInstance.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      enableSegmentation: false,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });
  }
  return poseInstance;
};

type Props = {
  videoFile: File;
  onResults: (results: Results) => void;
};

const VideoFileProcessorComponent: React.FC<Props> = ({ videoFile, onResults }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [videoReady, setVideoReady] = useState(false);
  const lastProcessTime = useRef<number>(0);
  
  // Стабильная ссылка на колбэк
  const stableOnResults = useRef(onResults);
  
  useEffect(() => {
    stableOnResults.current = onResults;
  });

  const handlePoseResults = useCallback((results: Results) => {
    const now = performance.now();
    
    // Throttle: обрабатываем не чаще 30 FPS (33ms)
    if (now - lastProcessTime.current < 33) return;
    lastProcessTime.current = now;

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
        radius: 2
      });

      // ✅ ВАЖНО: Передаём результаты в трекер
      stableOnResults.current(results);
    }
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (!video || !canvas || !videoFile) return;

    // Сброс состояния при смене файла
    setIsLoading(true);
    setError(null);
    setVideoReady(false);
    cancelAnimationFrame(animationFrameId.current);

    const videoUrl = URL.createObjectURL(videoFile);
    const pose = getPoseInstance();
    
    // Подключаем обработчик результатов
    pose.onResults(handlePoseResults);
    
    // Обработчики событий видео
    const handleLoadedMetadata = () => {
      console.log("✅ Video metadata loaded");
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
    };

    const handleLoadedData = () => {
      console.log("✅ Video data loaded");
      setVideoReady(true);
      setIsLoading(false);
    };

    const handleError = (e: Event) => {
      console.error("❌ Video loading error:", e);
      setError("Ошибка загрузки видео. Проверьте формат файла.");
      setIsLoading(false);
    };

    const handleCanPlay = () => {
      console.log("✅ Video can play");
      video.play().catch((err) => {
        console.error("❌ Video play error:", err);
        setError("Не удалось воспроизвести видео");
      });
    };

    // Добавляем обработчики
    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("loadeddata", handleLoadedData);
    video.addEventListener("error", handleError);
    video.addEventListener("canplay", handleCanPlay);

    // Устанавливаем источник видео
    video.src = videoUrl;
    video.load();

    // Функция обработки кадров
    const processFrame = async () => {
      if (!video || video.paused || video.ended) {
        return;
      }

      // Проверяем готовность видео
      if (video.readyState >= 2) {
        try {
          await pose.send({ image: video });
        } catch (err) {
          console.error("❌ Pose processing error:", err);
        }
      }

      animationFrameId.current = requestAnimationFrame(processFrame);
    };

    // Начинаем обработку после начала воспроизведения
    const handlePlaying = () => {
      console.log("✅ Video started playing, начинаем обработку кадров");
      processFrame();
    };

    video.addEventListener("playing", handlePlaying);

    // Cleanup
    return () => {
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("loadeddata", handleLoadedData);
      video.removeEventListener("error", handleError);
      video.removeEventListener("canplay", handleCanPlay);
      video.removeEventListener("playing", handlePlaying);
      
      cancelAnimationFrame(animationFrameId.current);
      
      video.pause();
      video.src = "";
      
      URL.revokeObjectURL(videoUrl);
    };
  }, [videoFile, handlePoseResults]);

  return (
    <div style={{ position: "relative", width: "100%" }}>
      {isLoading && (
        <div style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          background: "rgba(0, 0, 0, 0.8)",
          color: "white",
          padding: "20px",
          borderRadius: "8px",
          zIndex: 10
        }}>
          <div>⏳ Загрузка видео...</div>
        </div>
      )}
      
      {error && (
        <div style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          background: "rgba(255, 0, 0, 0.9)",
          color: "white",
          padding: "20px",
          borderRadius: "8px",
          zIndex: 10,
          textAlign: "center"
        }}>
          <div>❌ {error}</div>
          <div style={{ fontSize: "0.9em", marginTop: "10px" }}>
            Поддерживаются форматы: MP4, WebM, MOV
          </div>
        </div>
      )}

      <video 
        ref={videoRef} 
        style={{ display: "none" }} 
        playsInline 
        muted
        preload="metadata"
      />
      
      <canvas
        ref={canvasRef}
        width={640}
        height={480}
        style={{
          width: "100%",
          height: "auto",
          display: videoReady ? "block" : "none",
          borderRadius: "8px",
          transform: "scaleX(-1)" // Зеркальное отображение как в камере
        }}
      />
    </div>
  );
};

export const VideoFileProcessor = memo(VideoFileProcessorComponent);