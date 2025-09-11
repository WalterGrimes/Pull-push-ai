import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import './Recordings.css';

interface Recording {
  id: string;
  exerciseType: string;
  count: number;
  videoUrl: string;
  date: any;
  duration: number;
}

const Recordings = () => {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [selectedType, setSelectedType] = useState<'all' | 'pushup' | 'pullup'>('all');
  const [loading, setLoading] = useState(true);

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

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const recordingsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Recording[];
      
      setRecordings(recordingsData);
      setLoading(false);
    }, (error) => {
      console.error('Error loading recordings:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

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
              </div>
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