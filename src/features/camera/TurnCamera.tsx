// src/features/camera/TurnCamera.tsx

import React, { useRef } from "react";

interface TurnCameraProps {
  isCameraOn: boolean;
  toggleCamera: () => void;
  handleVideoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const TurnCamera: React.FC<TurnCameraProps> = ({
  isCameraOn,
  toggleCamera,
  handleVideoUpload,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    if (!file) return;

    // Проверка типа файла
    if (!file.type.startsWith('video/')) {
      alert('❌ Пожалуйста, выберите видео файл');
      return;
    }

    // Проверка размера файла (макс 500MB)
    const maxSize = 500 * 1024 * 1024; // 500MB
    if (file.size > maxSize) {
      alert('❌ Файл слишком большой. Максимальный размер: 500MB');
      return;
    }

    console.log('✅ Video file selected:', {
      name: file.name,
      type: file.type,
      size: `${(file.size / 1024 / 1024).toFixed(2)} MB`
    });

    handleVideoUpload(e);
    
    // Сбрасываем input для возможности загрузить тот же файл снова
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="camera-controls">
      <button 
        onClick={toggleCamera}
        className={`control-button ${isCameraOn ? 'active' : ''}`}
      >
        {isCameraOn ? '📹 Остановить камеру' : '📷 Включить камеру'}
      </button>

      <button 
        onClick={handleFileClick}
        className="control-button upload-button"
      >
        📁 Загрузить видео
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="video/mp4,video/webm,video/mov,video/avi"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      <div className="supported-formats">
        <small>Поддерживаемые форматы: MP4, WebM, MOV, AVI</small>
      </div>
    </div>
  );
};

export default TurnCamera;