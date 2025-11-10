import { useCallback, useState } from 'react';
import { updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase';
import type { User } from 'firebase/auth';
import AvatarSelector from './AvatarSelector';
import { AVATARS } from '../../entities/user/user.types';

// Используем тот же интерфейс что и в App.tsx
export interface UserData {
  photoURL?: string;
  pushupRecord?: number;
  pullupRecord?: number;
  displayName?: string;
  pushupRecordDate?: Date;
  pullupRecordDate?: Date;
  nickname?: string;
  description?: string;
}

interface Props {
  user: User;
  userData: UserData | null;
  onClose: () => void;
  onUpdate: (updatedData: UserData) => void;
}

const ProfileEditor = ({ user, userData, onClose, onUpdate }: Props) => {
  const [nickname, setNickname] = useState(userData?.nickname || userData?.displayName || '');
  const [description, setDescription] = useState(userData?.description || '');
  const [selectedAvatar, setSelectedAvatar] = useState(userData?.photoURL || 'avatar1');
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = useCallback(async () => {
    if (!nickname.trim()) {
      alert('Введите никнейм');
      return;
    }

    setIsLoading(true);
    try {
      // Обновляем Firebase Auth
      await updateProfile(auth.currentUser!, {
        displayName: nickname.trim(),
        photoURL: selectedAvatar
      });

      // Обновляем Firestore (или создаем если не существует)
   const userDocRef = doc(db, 'users', user.uid);
      
      const docData: any = { // Используем 'any' для гибкости добавления createdAt
        uid: user.uid,
        email: user.email,
        nickname: nickname.trim(),
        displayName: nickname.trim(),
        description: description.trim(),
        photoURL: selectedAvatar,
        pushupRecord: userData?.pushupRecord || 0,
        pullupRecord: userData?.pullupRecord || 0,
        pushupRecordDate: userData?.pushupRecordDate || null, 
        pullupRecordDate: userData?.pullupRecordDate || null,
        // createdAt: userData ? undefined : new Date().toISOString(), // ❌ Удалите эту строку
        lastLogin: new Date().toISOString()
      }; // merge: true = обновить существующее или создать новое

      // Добавление createdAt только при отсутствии userData (создание)
      if (!userData) {
          docData.createdAt = new Date().toISOString();
      }
      await setDoc(userDocRef, docData, { merge: true });

      // Уведомляем родительский компонент об обновлении
      onUpdate({
        ...userData,
        nickname: nickname.trim(),
        displayName: nickname.trim(),
        description: description.trim(),
        photoURL: selectedAvatar,
      });

      onClose();
    } catch (error) {
      console.error('Ошибка сохранения профиля:', error);
      alert('Не удалось сохранить изменения');
    } finally {
      setIsLoading(false);
    }
  }, [nickname,description,selectedAvatar,user,userData]);

  const currentAvatarData = AVATARS.find(a => a.id === selectedAvatar);

  return (
    <div className="profile-editor-overlay" onClick={onClose}>
      <div className="profile-editor-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>×</button>
        
        <div className="profile-preview">
          <div 
            className="preview-avatar"
            style={{ background: currentAvatarData?.gradient }}
          >
            {currentAvatarData?.emoji}
          </div>
          <h2>{nickname || 'Ваш никнейм'}</h2>
          <p className="preview-description">{description || 'Расскажите о себе'}</p>
        </div>

        <div className="editor-content">
          <h3>Редактирование профиля</h3>

          <div className="form-group">
            <label>Никнейм</label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Введите никнейм"
              maxLength={30}
            />
          </div>

          <div className="form-group">
            <label>Выберите аватарку</label>
            <AvatarSelector
              onSelect={setSelectedAvatar}
              currentAvatar={selectedAvatar}
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label>О себе</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Расскажите немного о себе..."
              rows={4}
              maxLength={200}
            />
            <span className="char-counter">{description.length}/200</span>
          </div>

          <div className="editor-buttons">
            <button className="cancel-btn" onClick={onClose}>
              Отмена
            </button>
            <button 
              className="save-btn" 
              onClick={handleSave} 
              disabled={isLoading}
            >
              {isLoading ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .profile-editor-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .profile-editor-modal {
          background: white;
          border-radius: 20px;
          width: 90%;
          max-width: 600px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          animation: slideUp 0.3s ease;
          position: relative;
        }

        @keyframes slideUp {
          from {
            transform: translateY(30px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .close-button {
          position: absolute;
          top: 20px;
          right: 20px;
          background: rgba(0, 0, 0, 0.1);
          border: none;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          font-size: 24px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          z-index: 10;
        }

        .close-button:hover {
          background: rgba(0, 0, 0, 0.2);
          transform: rotate(90deg);
        }

        .profile-preview {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 40px 20px 30px;
          text-align: center;
          color: white;
          border-radius: 20px 20px 0 0;
        }

        .preview-avatar {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          margin: 0 auto 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 60px;
          border: 5px solid white;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
          transition: transform 0.3s ease;
        }

        .preview-avatar:hover {
          transform: scale(1.05);
        }

        .profile-preview h2 {
          margin: 0 0 10px;
          font-size: 28px;
          font-weight: 700;
          text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        }

        .preview-description {
          margin: 0;
          opacity: 0.95;
          font-size: 14px;
          max-width: 400px;
          margin: 0 auto;
          line-height: 1.5;
        }

        .editor-content {
          padding: 30px;
        }

        .editor-content h3 {
          margin: 0 0 20px;
          color: #333;
          font-size: 20px;
        }

        .form-group {
          margin-bottom: 24px;
        }

        .form-group label {
          display: block;
          margin-bottom: 8px;
          color: #555;
          font-weight: 600;
          font-size: 14px;
        }

        .form-group input,
        .form-group textarea {
          width: 100%;
          padding: 12px 16px;
          border: 2px solid #e0e0e0;
          border-radius: 12px;
          font-size: 15px;
          transition: all 0.2s;
          font-family: inherit;
        }

        .form-group input:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .form-group textarea {
          resize: vertical;
          min-height: 100px;
        }

        .char-counter {
          display: block;
          text-align: right;
          font-size: 12px;
          color: #999;
          margin-top: 4px;
        }

        .editor-buttons {
          display: flex;
          gap: 12px;
          margin-top: 30px;
        }

        .editor-buttons button {
          flex: 1;
          padding: 14px 24px;
          border: none;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .cancel-btn {
          background: #f0f0f0;
          color: #666;
        }

        .cancel-btn:hover {
          background: #e0e0e0;
        }

        .save-btn {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }

        .save-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(102, 126, 234, 0.5);
        }

        .save-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        /* Адаптивность */
        @media (max-width: 640px) {
          .profile-editor-modal {
            width: 95%;
            margin: 20px;
          }

          .preview-avatar {
            width: 100px;
            height: 100px;
            font-size: 50px;
          }

          .profile-preview h2 {
            font-size: 24px;
          }

          .editor-content {
            padding: 20px;
          }
        }
      `}</style>
    </div>
  );
};

export default ProfileEditor;