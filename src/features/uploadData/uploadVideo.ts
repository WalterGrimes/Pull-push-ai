// src/shared/lib/firebase/uploadVideo.ts
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../../firebase';

interface UploadProgress {
  progress: number;
  status: 'uploading' | 'success' | 'error';
  url?: string;
  error?: string;
}

export const uploadVideo = (
  file: File,
  userId: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<string> => {
  return new Promise((resolve, reject) => {
    // Валидация
    const MAX_SIZE = 100 * 1024 * 1024; // 100 MB
    const ALLOWED_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
    
    if (!ALLOWED_TYPES.includes(file.type)) {
      const error = 'Неподдерживаемый формат видео. Используйте MP4, WebM или MOV';
      onProgress?.({ progress: 0, status: 'error', error });
      reject(new Error(error));
      return;
    }
    
    if (file.size > MAX_SIZE) {
      const error = 'Видео слишком большое. Максимум 100 MB';
      onProgress?.({ progress: 0, status: 'error', error });
      reject(new Error(error));
      return;
    }

    // Генерация уникального имени
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `videos/${userId}/${timestamp}_${sanitizedFileName}`;
    const storageRef = ref(storage, fileName);

    // Загрузка с отслеживанием прогресса
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = Math.round(
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        );
        onProgress?.({
          progress,
          status: 'uploading',
        });
      },
      (error) => {
        console.error('Upload error:', error);
        onProgress?.({
          progress: 0,
          status: 'error',
          error: error.message,
        });
        reject(error);
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          onProgress?.({
            progress: 100,
            status: 'success',
            url: downloadURL,
          });
          resolve(downloadURL);
        } catch (error) {
          reject(error);
        }
      }
    );
  });
};