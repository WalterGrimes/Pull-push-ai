// features/leaderboard/Leaderboard.tsx
import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, where } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import './Leaderboard.css';

interface LeaderboardEntry {
  id: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  exerciseType: 'pushup' | 'pullup';
  count: number;
  videoUrl: string;
  date: Date;
  verified: boolean;
}

const Leaderboard = () => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'pushup' | 'pullup'>('pushup');
  const [user] = useAuthState(auth);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'leaderboard'),
      where('exerciseType', '==', activeTab),
      where('verified', '==', true),
      orderBy('count', 'desc'),
      orderBy('date', 'asc') // или 'desc' в зависимости от ваших потребностей
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const leaderboardData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate()
      })) as LeaderboardEntry[];

      setEntries(leaderboardData.slice(0, 20));
      setLoading(false);
    }, (error) => {
      console.error('Error loading leaderboard:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [activeTab]);
  if (loading) {
    return (
      <div className="leaderboard">
        <div className="loading">Загрузка таблицы лидеров...</div>
      </div>
    );
  }

  return (
    <div className="leaderboard">
      <h1>Таблица лидеров</h1>

      <div className="tabs">
        <button
          className={activeTab === 'pushup' ? 'active' : ''}
          onClick={() => setActiveTab('pushup')}
        >
          💪 Отжимания
        </button>
        <button
          className={activeTab === 'pullup' ? 'active' : ''}
          onClick={() => setActiveTab('pullup')}
        >
          👆 Подтягивания
        </button>
      </div>

      <div className="leaderboard-table">
        <div className="table-header">
          <span>Место</span>
          <span>Участник</span>
          <span>Результат</span>
          <span>Видео</span>
        </div>

        {entries.map((entry, index) => (
          <div key={entry.id} className={`table-row ${index < 3 ? `top-${index + 1}` : ''}`}>
            <span className="rank">
              {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
            </span>

            <span className="user-info">
              <img
                src={entry.userPhoto || '/default-avatar.png'}
                alt={entry.userName}
                className="user-avatar"
              />
              <span className="user-name">{entry.userName}</span>
            </span>

            <span className="count">{entry.count} повтор.</span>

            <span className="video-link">
              <a href={entry.videoUrl} target="_blank" rel="noopener noreferrer">
                📹 Смотреть
              </a>
            </span>
          </div>
        ))}

        {entries.length === 0 && (
          <div className="empty-state">
            <p>Пока нет записей в лидерборде</p>
            <p>Будьте первым!</p>
          </div>
        )}
      </div>

      <div className="leaderboard-info">
        <h3>Как попасть в таблицу лидеров?</h3>
        <ol>
          <li>Запишите видео выполнения упражнения</li>
          <li>Сохраните запись в разделе "Мои записи"</li>
          <li>Нажмите "Опубликовать в лидерборд"</li>
          <li>Дождитесь проверки модератором</li>
        </ol>
      </div>
    </div>
  );
};

export default Leaderboard;