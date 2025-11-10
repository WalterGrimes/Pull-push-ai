// components/DebugInfo.tsx
import { useState, useEffect } from 'react';
import { ref, listAll } from 'firebase/storage';
import { storage } from './firebase';
import { auth } from './firebase';

export const DebugInfo = () => {
  const [storageFiles, setStorageFiles] = useState<string[]>([]);

  const checkStorage = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const listRef = ref(storage, `recordings/${user.uid}/`);
      const res = await listAll(listRef);
      setStorageFiles(res.items.map(item => item.name));
    } catch (error) {
      console.error('Error checking storage:', error);
    }
  };

  useEffect(() => {
    checkStorage();
  }, []);

  return (
    <div style={{ padding: '10px', background: '#f0f0f0', margin: '10px' }}>
      <h3>Отладочная информация:</h3>
      <button onClick={checkStorage}>Проверить Storage</button>
      <h4>Файлы в Storage:</h4>
      <ul>
        {storageFiles.map(file => (
          <li key={file}>{file}</li>
        ))}
      </ul>
      {storageFiles.length === 0 && <p>Нет файлов в Storage</p>}
    </div>
  );
};