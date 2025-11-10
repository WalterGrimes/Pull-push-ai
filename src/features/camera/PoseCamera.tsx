import React, { useRef, useEffect, useCallback, memo } from "react";
import { Pose, POSE_CONNECTIONS } from "@mediapipe/pose";
import { Camera } from "@mediapipe/camera_utils";
import { drawConnectors, drawLandmarks } from "@mediapipe/drawing_utils";
import type { Results } from "@mediapipe/pose";

// ✅ Создаём Pose ОДИН раз вне компонента
let poseInstance: Pose | null = null;

const getPoseInstance = () => {
  if (!poseInstance) {
    poseInstance = new Pose({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
    });

    poseInstance.setOptions({
      modelComplexity: 0, // Самая быстрая модель
      smoothLandmarks: false, // Отключаем сглаживание
      enableSegmentation: false,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });
  }
  return poseInstance;
};

interface PoseCameraProps {
  onResults?: (results: Results) => void;
}

// ✅ Мемоизируем компонент
const PoseCamera: React.FC<PoseCameraProps> = memo(({ onResults }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cameraRef = useRef<Camera | null>(null);
  const lastTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number>(0);

  // ✅ Мемоизированный обработчик с throttle
  const handleResults = useCallback((results: Results) => {
    const now = performance.now();
    
    // Throttle: обрабатываем не чаще ~30 FPS (33ms)
    if (now - lastTimeRef.current < 33) return;
    lastTimeRef.current = now;
    
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    // Очищаем canvas
    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Рисуем скелет только если есть landmarks
    if (results.poseLandmarks) {
      // Connections (зелёные линии)
      drawConnectors(ctx, results.poseLandmarks, POSE_CONNECTIONS, {
        color: '#00FF00',
        lineWidth: 2
      });
      
      // Landmarks (красные точки)
      drawLandmarks(ctx, results.poseLandmarks, {
        color: '#FF0000',
        lineWidth: 1,
        radius: 2
      });
    }
    
    ctx.restore();

    // Передаём результаты в родительский компонент
    if (onResults) {
      onResults(results);
    }
  }, [onResults]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const pose = getPoseInstance();
    
    // Подключаем обработчик результатов
    pose.onResults(handleResults);

    // Создаём камеру
    const camera = new Camera(video, {
      onFrame: async () => {
        // Проверяем готовность видео
        if (video.readyState < 2) return;
        
        try {
          await pose.send({ image: video });
        } catch (error) {
          console.error('Ошибка обработки кадра:', error);
        }
      },
      width: 640,
      height: 480,
      facingMode: "user"
    });
    
    cameraRef.current = camera;
    camera.start();

    // Cleanup
    return () => {
      camera?.stop();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [handleResults]);

  return (
    <div style={{ 
      position: 'relative', 
      width: '100%', 
      maxWidth: '640px',
      margin: '0 auto' 
    }}>
      <video 
        ref={videoRef} 
        style={{ display: 'none' }} 
        playsInline 
        autoPlay
        muted
      />
      <canvas
        ref={canvasRef}
        width={640}
        height={480}
        style={{
          width: '100%',
          height: 'auto',
          transform: 'scaleX(-1)', // Зеркальное отображение
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
        }}
      />
    </div>
  );
});

PoseCamera.displayName = 'PoseCamera';

export { PoseCamera };