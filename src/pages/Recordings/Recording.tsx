// pages/Recordings/Recordings.tsx
import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { addDoc } from 'firebase/firestore';
import './Recordings.css';
import type { User as FirebaseUser } from '@firebase/auth';

interface RecordingsProps { 
  user: FirebaseUser | null;
}

interface Recording {
  id: string;
  exerciseType: string;
  count: number;
  videoUrl: string;
  date: any;
  duration: number;
  isPublished: boolean;
}

const Recordings:React.FC<RecordingsProps> = ({ }) => {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [selectedType, setSelectedType] = useState<'all' | 'pushup' | 'pullup'>('all');
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState<string | null>(null);

  // pages/Recordings/Recordings.tsx
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'users', user.uid, 'recordings'),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(q,
      (snapshot) => {
        const recordingsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          date: doc.data().date // сохраняем как Timestamp для консистентности
        })) as Recording[];

        setRecordings(recordingsData);
        setLoading(false);
      },
      (error) => {
        console.error('Error loading recordings:', error);
        // Если ошибка индекса, предлагаем создать
        if (error.code === 'failed-precondition') {
          alert('Необходимо создать индекс в Firestore. Сообщите администратору.');
        }
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);
  const handlePublish = async (recording: Recording) => {
    try {
      setPublishing(recording.id);
      const user = auth.currentUser;
      if (!user) return;

      // Обновляем запись - помечаем как опубликованную
      await updateDoc(doc(db, 'users', user.uid, 'recordings', recording.id), {
        isPublished: true
      });

      // Добавляем запись в лидерборд
      await addDoc(collection(db, 'leaderboard'), {
        userId: user.uid,
        userName: user.displayName || user.email,
        userPhoto: user.photoURL,
        exerciseType: recording.exerciseType,
        count: recording.count,
        videoUrl: recording.videoUrl,
        date: new Date(),
        verified: false
      });

      alert('Запись отправлена на модерацию для публикации в лидерборде!');

    } catch (error) {
      console.error('Error publishing recording:', error);
      alert('Ошибка при публикации записи');
    } finally {
      setPublishing(null);
    }
  };

  const filteredRecordings = selectedType === 'all'
    ? recordings
    : recordings.filter(r => r.exerciseType === selectedType);

  const getExerciseIcon = (type: string) => {
    return type === 'pushup' ? '💪' : '👆';
  };

  if (loading) {
    return (
      <div className="recordings-page">
        <div className="loading">Загрузка записей...</div>
      </div>
    );
  }

  return (
    <div className="recordings-page">
      <h1>Мои записи</h1>

      <div className="filters">
        <button
          className={selectedType === 'all' ? 'active' : ''}
          onClick={() => setSelectedType('all')}
        >
          Все
        </button>
        <button
          className={selectedType === 'pushup' ? 'active' : ''}
          onClick={() => setSelectedType('pushup')}
        >
          💪 Отжимания
        </button>
        <button
          className={selectedType === 'pullup' ? 'active' : ''}
          onClick={() => setSelectedType('pullup')}
        >
          👆 Подтягивания
        </button>
      </div>

      <div className="recordings-grid">
        {filteredRecordings.map(recording => (
          <div key={recording.id} className="recording-card">
            <video
              src={recording.videoUrl}
              controls
              className="recording-video"
            />

            <div className="recording-info">
              <div className="exercise-type">
                {getExerciseIcon(recording.exerciseType)}
                {recording.exerciseType === 'pushup' ? 'Отжимания' : 'Подтягивания'}
              </div>

              <div className="recording-stats">
                <span className="count">🎯 {recording.count} повторений</span>
                <span className="duration">⏱️ {recording.duration} сек</span>
                <span className="date">
                  📅 {recording.date?.toDate().toLocaleDateString()}
                </span>
                <span className="status">
                  {recording.isPublished ? '✅ Опубликовано' : '📝 Черновик'}
                </span>
              </div>

              {!recording.isPublished && (
                <button
                  onClick={() => handlePublish(recording)}
                  disabled={publishing === recording.id}
                  className="publish-button"
                >
                  {publishing === recording.id ? 'Публикация...' : '📢 Опубликовать в лидерборд'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredRecordings.length === 0 && (
        <div className="empty-state">
          <h3>Записей пока нет</h3>
          <p>Начните тренировку и сохраните свои первые достижения!</p>
        </div>
      )}
    </div>
  );
};

export default Recordings;