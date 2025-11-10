// src/features/recording/VideoRecorder.tsx

import React, { useRef, useState, useCallback, useEffect, memo } from 'react';

interface VideoRecorderProps {
  mode: 'pushup' | 'pullup';
  currentCount: number;
  onRecordingComplete(count: number, videoBlob: Blob, duration: number): void;
  onRecordingStatusChange?: (isRecording: boolean) => void;
}

const VideoRecorderComponent: React.FC<VideoRecorderProps> = ({
  mode,
  currentCount,
  onRecordingComplete,
  onRecordingStatusChange
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  
  const chunksRef = useRef<Blob[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Стабильные ссылки на колбэки
  const stableOnRecordingComplete = useRef(onRecordingComplete);
  const stableOnRecordingStatusChange = useRef(onRecordingStatusChange);

  useEffect(() => {
    stableOnRecordingComplete.current = onRecordingComplete;
    stableOnRecordingStatusChange.current = onRecordingStatusChange;
  });

  useEffect(() => {
    stableOnRecordingStatusChange.current?.(isRecording);
  }, [isRecording]);

  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      setRecordingTime(0);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 30 }
        },
        audio: true
      });

      streamRef.current = stream;

      const preferredMimeType = 'video/webm; codecs=vp9,opus';
      let mediaRecorder: MediaRecorder;
      
      try {
        if (MediaRecorder.isTypeSupported(preferredMimeType)) {
          mediaRecorder = new MediaRecorder(stream, { mimeType: preferredMimeType });
        } else {
          mediaRecorder = new MediaRecorder(stream);
        }
      } catch (e) {
        mediaRecorder = new MediaRecorder(stream);
      }
      mediaRecorderRef.current = mediaRecorder;

      chunksRef.current = [];
      setRecordingTime(0);

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
          console.log('📹 Chunk added, size:', event.data.size);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        console.log('📦 Blob created, size:', blob.size, 'bytes');
        console.log('📊 Total chunks:', chunksRef.current.length);

        if (blob.size > 0) {
          stableOnRecordingComplete.current(currentCount, blob, recordingTime);
        } else {
          console.error('❌ Empty blob created');
          alert('Ошибка: видео не записалось');
        }
        
        chunksRef.current = [];
      };

      mediaRecorderRef.current.start(100);
      setIsRecording(true);
      console.log('✅ Recording started');

    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Не удалось начать запись. Проверьте разрешения камеры.');
    }
  }, [currentCount, recordingTime]);

  const stopRecording = useCallback(() => {
    console.log('🛑 Stop recording called');

    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          track.stop();
        });
        streamRef.current = null;
      }
    }
  }, [isRecording]);

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  return (
    <div className="video-recorder">
      <div className="recording-controls">
        {!isRecording ? (
          <button
            onClick={startRecording}
            className="record-button start"
            disabled={isRecording}
          >
            🎥 Начать запись
          </button>
        ) : (
          <button
            onClick={stopRecording}
            className="record-button stop"
          >
            ⏹️ Завершить запись ({formatTime(recordingTime)})
          </button>
        )}
      </div>
      {isRecording && (
        <div className="recording-indicator">
          <div className="recording-dot">●</div>
          Запись... {formatTime(recordingTime)}
        </div>
      )}
    </div>
  );
};

export const VideoRecorder = memo(VideoRecorderComponent);