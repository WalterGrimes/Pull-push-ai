import { useState, useEffect } from 'react';
import { updateProfile } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '../../firebase';

interface Props {
  user: any;
  userData: any;
  onClose: () => void;
}

const ProfileEditor = ({ user, userData, onClose }: Props) => {
  const [nickname, setNickname] = useState(userData?.nickname || '');
  const [description, setDescription] = useState(userData?.description || '');
  const [photoURL, setPhotoURL] = useState(userData?.photoURL || '');
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Обновляем Firebase Auth
      await updateProfile(auth.currentUser!, {
        displayName: nickname,
        photoURL: photoURL || null
      });

      // Обновляем Firestore
      await updateDoc(doc(db, 'users', user.uid), {
        nickname,
        description,
        photoURL: photoURL || null
      });

      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const storageRef = ref(storage, `avatars/${user.uid}/${file.name}`);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    setPhotoURL(url);
  };

  return (
    <div className="profile-editor-overlay">
      <div className="profile-editor">
        <h2>Edit Profile</h2>
        
        <div className="form-group">
          <label>Nickname</label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
          />
        </div>
        
        <div className="form-group">
          <label>Profile Photo</label>
          <div className="avatar-upload">
            <img 
              src={photoURL || '/default-avatar.png'} 
              alt="Current avatar"
            />
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
            />
          </div>
        </div>
        
        <div className="form-group">
          <label>About Me</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </div>
        
        <div className="buttons">
          <button onClick={onClose}>Cancel</button>
          <button onClick={handleSave} disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileEditor;