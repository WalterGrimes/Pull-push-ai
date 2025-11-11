import React, { useCallback, useState } from "react";
import { updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../../firebase";
import type { User } from "firebase/auth";
import AvatarSelector from "./AvatarSelector";
import { AVATARS } from "../../entities/user/user.types";

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

const ProfileEditor: React.FC<Props> = ({ user, userData, onClose, onUpdate }) => {
  const [nickname, setNickname] = useState(userData?.nickname || userData?.displayName || "");
  const [description, setDescription] = useState(userData?.description || "");
  const [selectedAvatar, setSelectedAvatar] = useState(userData?.photoURL || "avatar1");
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = useCallback(async () => {
    if (!nickname.trim()) {
      alert("Введите никнейм");
      return;
    }

    setIsLoading(true);
    try {
      await updateProfile(auth.currentUser!, {
        displayName: nickname.trim(),
        photoURL: selectedAvatar,
      });

      const userDocRef = doc(db, "users", user.uid);
      const docData: any = {
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
        lastLogin: new Date().toISOString(),
      };

      if (!userData) docData.createdAt = new Date().toISOString();

      await setDoc(userDocRef, docData, { merge: true });

      onUpdate({
        ...userData,
        nickname: nickname.trim(),
        displayName: nickname.trim(),
        description: description.trim(),
        photoURL: selectedAvatar,
      });

      onClose();
    } catch (error) {
      console.error("Ошибка сохранения профиля:", error);
      alert("Не удалось сохранить изменения");
    } finally {
      setIsLoading(false);
    }
  }, [nickname, description, selectedAvatar, user, userData, onUpdate, onClose]);

  const currentAvatarData = AVATARS.find((a) => a.id === selectedAvatar);

  return (
    <div className="editor-overlay" onClick={onClose}>
      <div className="editor-card" onClick={(e) => e.stopPropagation()}>
        <header className="editor-header">
          <h2>Редактировать профиль</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </header>

        <section className="avatar-section">
          {/* ❌ УБРАЛИ этот блок - он дублирует аватарку */}
          <AvatarSelector
            onSelect={setSelectedAvatar}
            currentAvatar={selectedAvatar}
            disabled={isLoading}
          />
        </section>

        <section className="info-section">
          <label>
            Никнейм
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Введите никнейм"
              maxLength={30}
            />
          </label>

          <label>
            О себе
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Расскажите немного о себе..."
              rows={4}
              maxLength={200}
            />
          </label>
          <span className="char-count">{description.length}/200</span>
        </section>

        <footer className="editor-footer">
          <button className="cancel-btn" onClick={onClose}>Отмена</button>
          <button
            className="save-btn"
            onClick={handleSave}
            disabled={isLoading}
          >
            {isLoading ? "Сохранение..." : "💾 Сохранить"}
          </button>
        </footer>
      </div>

      <style>{`
        .editor-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.6);
          backdrop-filter: blur(6px);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
          animation: fadeIn 0.25s ease;
        }
        .editor-card {
          background: #fff;
          border-radius: 18px;
          width: 90%;
          max-width: 560px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 8px 40px rgba(0,0,0,0.3);
          display: flex;
          flex-direction: column;
          animation: slideUp 0.25s ease;
        }
        .editor-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 24px;
          border-bottom: 1px solid #eee;
          background: #f8f8ff;
          position: sticky;
          top: 0;
          z-index: 1;
        }
        .editor-header h2 {
          margin: 0;
          font-size: 20px;
          font-weight: 700;
        }
        .close-btn {
          background: transparent;
          border: none;
          font-size: 20px;
          cursor: pointer;
          opacity: 0.6;
          transition: 0.2s;
        }
        .close-btn:hover { opacity: 1; }

        .avatar-section {
          padding: 24px 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .info-section {
          padding: 24px;
        }
        label {
          display: flex;
          flex-direction: column;
          font-weight: 600;
          margin-bottom: 16px;
          color: #444;
        }
        input, textarea {
          margin-top: 8px;
          padding: 10px 14px;
          border: 2px solid #e0e0e0;
          border-radius: 10px;
          font-size: 15px;
          transition: all 0.2s;
        }
        input:focus, textarea:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102,126,234,0.15);
        }
        textarea { resize: vertical; }
        .char-count {
          text-align: right;
          font-size: 12px;
          color: #888;
          margin-top: -8px;
          margin-bottom: 12px;
        }

        .editor-footer {
          display: flex;
          justify-content: space-between;
          padding: 16px 24px;
          border-top: 1px solid #eee;
          background: #fafafa;
          position: sticky;
          bottom: 0;
        }
        .editor-footer button {
          flex: 1;
          padding: 12px 0;
          margin: 0 6px;
          border: none;
          border-radius: 10px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: 0.2s;
        }
        .cancel-btn {
          background: #f1f1f1;
          color: #555;
        }
        .cancel-btn:hover { background: #e5e5e5; }
        .save-btn {
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
          box-shadow: 0 4px 10px rgba(102,126,234,0.4);
        }
        .save-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(102,126,234,0.5);
        }
        .save-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        @keyframes fadeIn { from {opacity:0} to {opacity:1} }
        @keyframes slideUp {
          from {transform: translateY(20px); opacity:0;}
          to {transform: translateY(0); opacity:1;}
        }
      `}</style>
    </div>
  );
};

export default ProfileEditor;