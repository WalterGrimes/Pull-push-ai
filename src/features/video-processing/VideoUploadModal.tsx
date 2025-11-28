// src/features/video-upload/VideoUploadModal.tsx

import React, { useState, useRef } from "react";
import { uploadBytes, getDownloadURL } from "firebase/storage";
import { ref } from "firebase/storage";
import { storage, auth, db } from "../../firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { VideoFileProcessor } from "../video-processing/VideoFileProcessor";
import type { Results } from "@mediapipe/pose";

interface VideoUploadModalProps {
  onClose: () => void;
}

const VideoUploadModal: React.FC<VideoUploadModalProps> = ({ onClose }) => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [exerciseType, setExerciseType] = useState<'pushup' | 'pullup'>('pushup');
  const [processing, setProcessing] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const countRef = useRef(0);
  const isDownRef = useRef(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      setError('❌ Пожалуйста, выберите видео файл');
      return;
    }

    const maxSize = 500 * 1024 * 1024; // 500MB
    if (file.size > maxSize) {
      setError('❌ Файл слишком большой (макс 500MB)');
      return;
    }

    setVideoFile(file);
    setError(null);
    setResult(null);
    setAnalyzing(true);
    countRef.current = 0;
  };

  const handlePoseResults = (results: Results) => {
    if (!results.poseLandmarks) return;

    const landmarks = results.poseLandmarks;
    
    if (exerciseType === 'pushup') {
      // Логика подсчета отжиманий
      const leftAngle = getAngle(landmarks[11], landmarks[13], landmarks[15]);
      const rightAngle = getAngle(landmarks[12], landmarks[14], landmarks[16]);
      const avgAngle = (leftAngle + rightAngle) / 2;

      if (avgAngle > 160 && !isDownRef.current) {
        isDownRef.current = true;
      } else if (avgAngle < 90 && isDownRef.current) {
        countRef.current++;
        isDownRef.current = false;
      }
    } else {
      // Логика подсчета подтягиваний
      const leftAngle = getAngle(landmarks[11], landmarks[13], landmarks[15]);
      const rightAngle = getAngle(landmarks[12], landmarks[14], landmarks[16]);
      const avgAngle = (leftAngle + rightAngle) / 2;

      if (avgAngle > 160 && !isDownRef.current) {
        isDownRef.current = true;
      } else if (avgAngle < 60 && isDownRef.current) {
        countRef.current++;
        isDownRef.current = false;
      }
    }
  };

  const getAngle = (a: any, b: any, c: any): number => {
    const ab = { x: b.x - a.x, y: b.y - a.y };
    const cb = { x: b.x - c.x, y: b.y - c.y };
    const dot = ab.x * cb.x + ab.y * cb.y;
    const abLen = Math.hypot(ab.x, ab.y);
    const cbLen = Math.hypot(cb.x, cb.y);
    const angleRad = Math.acos(dot / (abLen * cbLen));
    return (angleRad * 180) / Math.PI;
  };

  const handleUpload = async () => {
    if (!videoFile || !auth.currentUser) return;
    
    setProcessing(true);
    setError(null);
    setUploadProgress(0);
    
    try {
      // Останавливаем анализ
      setAnalyzing(false);
      
      // Сохраняем результат подсчета
      const finalCount = countRef.current;
      setResult(finalCount);

      // Загружаем видео в Firebase Storage
      const filename = `videos/${auth.currentUser.uid}/${Date.now()}_${exerciseType}.${videoFile.name.split('.').pop()}`;
      const storageRef = ref(storage, filename);
      
      console.log('📤 Uploading video to Firebase...');
      
      await uploadBytes(storageRef, videoFile, {
        contentType: videoFile.type,
        customMetadata: {
          'uploadedBy': auth.currentUser.uid,
          'exerciseType': exerciseType,
          'count': finalCount.toString()
        }
      });

      setUploadProgress(50);

      const videoUrl = await getDownloadURL(storageRef);
      
      setUploadProgress(75);

      // Сохраняем результат в Firestore
      await addDoc(collection(db, 'users', auth.currentUser.uid, 'recordings'), {
        exerciseType,
        count: finalCount,
        videoUrl,
        date: serverTimestamp(),
        isPublished: false,
        uploadedFromFile: true
      });

      setUploadProgress(100);
      
      console.log('✅ Video uploaded successfully!');
      
    } catch (err: any) {
      console.error('❌ Upload error:', err);
      setError(`Ошибка загрузки: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="upload-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Добавить результат из видео</h2>
          <button onClick={onClose} className="close-button">×</button>
        </div>
        
        <div className="modal-body">
          <div className="form-group">
            <label>Тип упражнения:</label>
            <select 
              value={exerciseType}
              onChange={(e) => setExerciseType(e.target.value as 'pushup' | 'pullup')}
              disabled={analyzing || processing}
            >
              <option value="pushup">💪 Отжимания</option>
              <option value="pullup">👆 Подтягивания</option>
            </select>
          </div>

          <div className="form-group">
            <label>Выберите видео:</label>
            <input 
              type="file" 
              accept="video/mp4,video/webm,video/mov,video/avi"
              onChange={handleFileSelect}
              disabled={processing}
            />
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {videoFile && analyzing && (
            <div className="video-preview">
              <h3>🎬 Анализ видео...</h3>
              <p>Обнаружено повторений: <strong>{countRef.current}</strong></p>
              <VideoFileProcessor 
                videoFile={videoFile}
                onResults={handlePoseResults}
              />
            </div>
          )}

          {result !== null && !processing && (
            <div className="result-box">
              <h3>✅ Анализ завершен!</h3>
              <p className="result-count">
                Обнаружено повторений: <strong>{result}</strong>
              </p>
            </div>
          )}

          {processing && (
            <div className="upload-progress">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p>Загрузка... {uploadProgress}%</p>
            </div>
          )}
        </div>

        <div className="modal-footer">
          {!result ? (
            <>
              <button onClick={onClose} disabled={processing}>
                Отмена
              </button>
              <button 
                onClick={() => {
                  setAnalyzing(false);
                  setResult(countRef.current);
                }}
                disabled={!videoFile || processing}
              >
                Завершить анализ
              </button>
            </>
          ) : (
            <>
              <button onClick={onClose} disabled={processing}>
                Закрыть
              </button>
              <button 
                onClick={handleUpload}
                disabled={processing || !videoFile}
              >
                {processing ? 'Загрузка...' : '📤 Сохранить результат'}
              </button>
            </>
          )}
        </div>
      </div>

      <style>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .upload-modal {
          background: white;
          border-radius: 12px;
          width: 90%;
          max-width: 700px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid #eee;
        }

        .modal-header h2 {
          margin: 0;
          font-size: 1.5rem;
        }

        .close-button {
          background: none;
          border: none;
          font-size: 2rem;
          cursor: pointer;
          color: #666;
          padding: 0;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .modal-body {
          padding: 20px;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: 600;
          color: #333;
        }

        .form-group select,
        .form-group input[type="file"] {
          width: 100%;
          padding: 10px;
          border: 2px solid #ddd;
          border-radius: 8px;
          font-size: 1rem;
        }

        .error-message {
          background: #fee;
          color: #c00;
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 15px;
        }

        .video-preview {
          margin-top: 20px;
          padding: 15px;
          background: #f5f5f5;
          border-radius: 8px;
        }

        .video-preview h3 {
          margin-top: 0;
          color: #333;
        }

        .result-box {
          background: #e8f5e9;
          padding: 20px;
          border-radius: 8px;
          text-align: center;
          margin-top: 15px;
        }

        .result-count {
          font-size: 1.2rem;
          margin: 10px 0;
        }

        .result-count strong {
          font-size: 2rem;
          color: #4caf50;
        }

        .upload-progress {
          margin-top: 20px;
        }

        .progress-bar {
          height: 8px;
          background: #eee;
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 10px;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #4caf50, #8bc34a);
          transition: width 0.3s ease;
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          padding: 20px;
          border-top: 1px solid #eee;
        }

        .modal-footer button {
          padding: 10px 20px;
          border: none;
          border-radius: 8px;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .modal-footer button:first-child {
          background: #f5f5f5;
          color: #333;
        }

        .modal-footer button:last-child {
          background: #4caf50;
          color: white;
        }

        .modal-footer button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .modal-footer button:not(:disabled):hover {
          transform: translateY(-2px);
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        }
      `}</style>
    </div>
  );
};

export default VideoUploadModal;