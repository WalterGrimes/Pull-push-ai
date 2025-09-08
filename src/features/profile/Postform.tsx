import { useState, useRef } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../firebase';

interface PostFormProps {
  onSubmit: (text: string, imageUrl?: string) => Promise<void>;
}

const PostForm = ({ onSubmit }: PostFormProps) => {
  const [text, setText] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    setLoading(true);
    try {
      let imageUrl = null;
      
      if (image) {
        // Загружаем изображение в Storage
        const storageRef = ref(storage, `posts/${Date.now()}_${image.name}`);
        const snapshot = await uploadBytes(storageRef, image);
        imageUrl = await getDownloadURL(snapshot.ref);
      }
      
      await onSubmit(text, imageUrl);
      setText('');
      setImage(null);
      setPreview(null);
    } catch (error) {
      console.error("Ошибка при создании поста:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="post-form">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Что нового?"
        required
        maxLength={2000}
      />
      
      <div className="post-form-actions">
        <div className="image-upload">
          <button 
            type="button" 
            onClick={() => fileInputRef.current?.click()}
            className="image-upload-button"
          >
            📷 Добавить фото
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageChange}
            accept="image/*"
            style={{ display: 'none' }}
          />
          {preview && (
            <div className="image-preview">
              <img src={preview} alt="Preview" />
              <button 
                type="button" 
                onClick={() => {
                  setPreview(null);
                  setImage(null);
                }}
                className="remove-image"
              >
                ×
              </button>
            </div>
          )}
        </div>
        
        <button type="submit" disabled={loading || !text.trim()}>
          {loading ? 'Публикация...' : 'Опубликовать'}
        </button>
      </div>
    </form>
  );
};

export default PostForm;