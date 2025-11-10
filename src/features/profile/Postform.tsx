import { useState, useRef } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../firebase';
import { Image, X, Loader2 } from 'lucide-react';

interface PostFormProps {
  onSubmit: (text: string, imageUrl?: string) => Promise<void>;
}

const PostForm = ({ onSubmit }: PostFormProps) => {
  const [text, setText] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Проверка размера (макс 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    // Проверка типа
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    setError(null);
    setImage(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setPreview(null);
    setImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || loading) return;

    setLoading(true);
    setError(null);
    setUploadProgress(0);

    try {
      let imageUrl: string | undefined = undefined;

      // Загружаем изображение если есть
      if (image) {
        setUploadProgress(30);
        const storageRef = ref(storage, `posts/${Date.now()}_${image.name}`);
        
        setUploadProgress(60);
        const snapshot = await uploadBytes(storageRef, image);
        
        setUploadProgress(90);
        imageUrl = await getDownloadURL(snapshot.ref);
      }

      // ✅ ИСПРАВЛЕНО: всегда вызываем onSubmit
      await onSubmit(text, imageUrl);

      // Очищаем форму только после успешной публикации
      setText('');
      setImage(null);
      setPreview(null);
      setUploadProgress(0);
    } catch (err) {
      console.error('Error creating post:', err);
      setError(err instanceof Error ? err.message : 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="post-form">
      <style>{`
        .post-form {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .post-form textarea {
          width: 100%;
          min-height: 100px;
          padding: 12px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          font-size: 15px;
          resize: vertical;
          font-family: inherit;
          transition: border-color 0.2s;
        }

        .post-form textarea:focus {
          outline: none;
          border-color: #3b82f6;
        }

        .post-form-error {
          margin-top: 12px;
          padding: 12px;
          background: #fee;
          border: 1px solid #fcc;
          border-radius: 6px;
          color: #c33;
          font-size: 14px;
        }

        .image-preview {
          margin-top: 12px;
          position: relative;
          border-radius: 8px;
          overflow: hidden;
          max-width: 100%;
        }

        .image-preview img {
          width: 100%;
          max-height: 300px;
          object-fit: cover;
          display: block;
        }

        .remove-image {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(0,0,0,0.6);
          color: white;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s;
        }

        .remove-image:hover {
          background: rgba(0,0,0,0.8);
        }

        .upload-progress {
          margin-top: 12px;
          height: 4px;
          background: #e5e7eb;
          border-radius: 2px;
          overflow: hidden;
        }

        .upload-progress-bar {
          height: 100%;
          background: #3b82f6;
          transition: width 0.3s ease;
        }

        .post-form-actions {
          margin-top: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
        }

        .image-upload-button {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          background: #f3f4f6;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          color: #374151;
          transition: all 0.2s;
        }

        .image-upload-button:hover {
          background: #e5e7eb;
        }

        .image-upload-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .submit-button {
          padding: 10px 24px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .submit-button:hover:not(:disabled) {
          background: #2563eb;
        }

        .submit-button:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }

        .char-count {
          font-size: 12px;
          color: #6b7280;
          margin-top: 4px;
          text-align: right;
        }

        .char-count.warning {
          color: #f59e0b;
        }

        .char-count.danger {
          color: #ef4444;
        }
      `}</style>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Share your fitness journey..."
        required
        maxLength={2000}
        disabled={loading}
      />

      <div className={`char-count ${text.length > 1800 ? 'warning' : ''} ${text.length > 1950 ? 'danger' : ''}`}>
        {text.length} / 2000
      </div>

      {error && (
        <div className="post-form-error">
          {error}
        </div>
      )}

      {preview && (
        <div className="image-preview">
          <img src={preview} alt="Preview" />
          <button
            type="button"
            onClick={removeImage}
            className="remove-image"
            disabled={loading}
          >
            <X size={18} />
          </button>
        </div>
      )}

      {loading && uploadProgress > 0 && (
        <div className="upload-progress">
          <div 
            className="upload-progress-bar" 
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
      )}

      <div className="post-form-actions">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="image-upload-button"
          disabled={loading || !!preview}
        >
          <Image size={18} />
          Add Photo
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageChange}
          accept="image/*"
          style={{ display: 'none' }}
        />

        <button 
          type="submit" 
          disabled={loading || !text.trim()}
          className="submit-button"
        >
          {loading && <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />}
          {loading ? 'Publishing...' : 'Publish'}
        </button>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </form>
  );
};

export default PostForm;