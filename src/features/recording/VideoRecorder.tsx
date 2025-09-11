import React, { useRef, useState, useCallback, useEffect } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage, db } from '../../firebase';
import { doc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { auth } from '../../firebase';

interface VideoRecorderProps {
  mode: 'pushup' | 'pullup';
  onRecordingComplete: (count: number, videoUrl: string) => void;
  onRecordingStatusChange?: (isRecording: boolean) => void;
}

export const VideoRecorder: React.FC<VideoRecorderProps> = ({
  mode,
  onRecordingComplete,
  onRecordingStatusChange
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [count, setCount] = useState(0);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    onRecordingStatusChange?.(isRecording);
  }, [isRecording, onRecordingStatusChange]);

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

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        },
        audio: false
      });

      streamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm; codecs=vp9'
      });

      mediaRecorderRef.current = mediaRecorder;
      setRecordedChunks([]);
      setRecordingTime(0);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setRecordedChunks(prev => [...prev, event.data]);
        }
      };

      mediaRecorder.start(1000);
      setIsRecording(true);

    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Не удалось начать запись. Проверьте разрешения камеры.');
    }
  };

  const stopRecording = useCallback(async () => {
    console.log('🛑 Stop recording called');
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      if (recordedChunks.length > 0) {
        const blob = new Blob(recordedChunks, { type: 'video/webm' });
        console.log('📦 Blob created, size:', blob.size, 'bytes'); // <-- ДОБАВЬ ЭТУ СТРОЧКУ
        await saveRecording(blob);
      } else {
        console.log('❌ No recorded chunks found'); // <-- И ЭТУ
      }
    }
  }, [isRecording, recordedChunks]);

  const saveRecording = async (blob: Blob) => {
    console.log('💾 Save recording started');
    try {
      const user = auth.currentUser;
      if (!user) {
        alert('Необходимо войти в аккаунт для сохранения записи');
        return;
      }

      const filename = `recordings/${user.uid}/${Date.now()}_${mode}.webm`;
      const storageRef = ref(storage, filename);

      await uploadBytes(storageRef, blob);
      const videoUrl = await getDownloadURL(storageRef);

      await addDoc(collection(db, 'users', user.uid, 'recordings'), {
        exerciseType: mode,
        count: count,
        videoUrl: videoUrl,
        date: serverTimestamp(),
        duration: recordingTime,
        filename: filename
      });

      onRecordingComplete(count, videoUrl);

    } catch (error) {
      console.error('Error saving recording:', error);
      alert('❌ Ошибка сохранения записи. Попробуйте ещё раз.');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

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
            ⏹️ Завершить запись
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