// src/components/AvatarUploader.tsx
import React, { useState, useRef } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';
import './AvatarUploader.css';

interface AvatarUploaderProps {
  onUpload: (url: string) => void;
}

const AvatarUploader = ({ onUpload }: AvatarUploaderProps) => {
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Создаем превью
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Загружаем файл в Firebase Storage
    try {
      const storageRef = ref(storage, `avatars/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      onUpload(downloadURL); // Передаем URL обратно в форму
    } catch (error) {
      console.error("Ошибка загрузки:", error);
    }
  };

  return (
    <div className="avatar-uploader">
      <div 
        className="avatar-preview" 
        onClick={() => fileInputRef.current?.click()}
      >
        {preview ? (
          <img src={preview} alt="Preview" />
        ) : (
          <div className="avatar-placeholder">
            <span>+</span>
          </div>
        )}
      </div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        style={{ display: 'none' }}
      />
    </div>
  );
};

export default AvatarUploader;