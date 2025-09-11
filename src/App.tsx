import React, { useState, useMemo, useEffect } from "react";
import { PoseCamera } from "./features/camera/PoseCamera";
import PushUpTracker from "./features/workout/PushUpTracker";
import PullUpTracker from "./features/workout/PullUpTracker";
import type { Results } from '@mediapipe/pose';
import TurnCamera from "./features/camera/TurnCamera";
import { VideoFileProcessor } from "./features/video-processing/VideoFileProcessor";
import { Link, useNavigate, Routes, Route } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, db } from "./firebase";
import { doc, updateDoc, getDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import Community from "./pages/Community/Community.";
import Leaderboard from "./features/leaderboard/Leaderboard";
import ProfileEditor from "./features/profile/ProfileEditor";
import { VideoRecorder } from './features/recording/VideoRecorder';
import Recordings from "./pages/Recordings/Recording";
import "./App.css";
import Login from "./features/auth/Login";
import Register from "./features/auth/Register";

interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

interface UserData {
  photoURL?: string;
  pushupRecord?: number;
  pullupRecord?: number;
  displayName?: string;
  pushupRecordDate?: Date;
  pullupRecordDate?: Date;
}

function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [currentRecording, setCurrentRecording] = useState<{
    count: number;
    videoUrl: string;
  } | null>(null);
  const [mode, setMode] = useState<"pushup" | "pullup">("pushup");
  const [poseResults, setPoseResults] = useState<Results | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [processingMode, setProcessingMode] = useState<"live" | "upload">("live");
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [exerciseCount, setExerciseCount] = useState(0);
  const [showProfileEditor, setShowProfileEditor] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setIsLoading(true);
      try {
        if (currentUser) {
          setUser({
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName,
            photoURL: currentUser.photoURL
          });

          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (userDoc.exists()) {
            setUserData(userDoc.data() as UserData);
          } else {
            setUserData(null);
          }
        } else {
          setUser(null);
          setUserData(null);
        }
      } catch (error) {
        console.error("Ошибка загрузки данных пользователя:", error);
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const toggleIsCamera = () => {
    setIsCameraOn(prev => !prev);
    setVideoFile(null);
    setProcessingMode("live");
    setExerciseCount(0);
  };

  const handleRecordingStatusChange = (recording: boolean) => {
    setIsRecording(recording);
  };

  const handleRecordingComplete = (count: number, videoUrl: string) => {
    setCurrentRecording({ count, videoUrl });
    setExerciseCount(count);
    setShowSuccessMessage(true);

    setTimeout(() => {
      setShowSuccessMessage(false);
    }, 5000);
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      alert('Пожалуйста, выберите видео файл');
      return;
    }

    setVideoFile(file);
    setIsCameraOn(true);
    setProcessingMode("upload");
    setExerciseCount(0);
  };

  const handleResults = useMemo(() => {
    let lastProcessed = 0;
    return (results: Results) => {
      const now = Date.now();
      if (now - lastProcessed < 100) return;
      lastProcessed = now;
      setPoseResults(results);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error("Ошибка выхода:", error);
      alert("Не удалось выйти из системы");
    }
  };

  const handleExerciseComplete = async (count: number) => {
    setExerciseCount(count);

    if (user && count > 0) {
      try {
        const recordField = `${mode}Record`;
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const currentRecord = userDoc.data()[recordField] || 0;

          if (count > currentRecord) {
            await updateDoc(userDocRef, {
              [recordField]: count,
              [`${mode}RecordDate`]: serverTimestamp()
            });

            setUserData(prev => ({
              ...prev,
              [recordField]: count,
              [`${mode}RecordDate`]: new Date()
            } as UserData));
          }

          await addDoc(collection(db, "users", user.uid, "workouts"), {
            exerciseType: mode,
            count: count,
            date: serverTimestamp(),
            isRecord: count > currentRecord
          });
        }
      } catch (error) {
        console.error("Ошибка сохранения результата:", error);
        alert("Не удалось сохранить результат");
      }
    }
  };

  const exitAnalysisMode = () => {
    setIsCameraOn(false);
    setVideoFile(null);
    setPoseResults(null);
  };

  const getUserAvatar = (): string | undefined => {
    if (userData?.photoURL) return userData.photoURL;
    if (user?.photoURL) return user.photoURL;
    return undefined;
  };

  const getUserName = () => {
    if (userData?.displayName) return userData.displayName;
    if (user?.displayName) return user.displayName;
    if (user?.email) return user.email;
    return "Пользователь";
  };

  const handleProfileUpdate = (updatedData: UserData) => {
    setUserData(updatedData);
    if (updatedData.photoURL) {
      setUser(prev => prev ? { ...prev, photoURL: updatedData.photoURL } : null);
    }
  };

  const avatarUrl = getUserAvatar();

  if (isLoading) {
    return (
      <div className="app-container">
        <div className="loading-spinner">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Pull-Push AI</h1>
        <nav className="main-nav">
          <Link to="/" className="nav-link">Тренировка</Link>
          <Link to="/leaderboard" className="nav-link">Таблица лидеров</Link>
          <Link to="/community" className="nav-link">Сообщество</Link>
          <Link to="/recordings" className="nav-link">Мои записи</Link>
        </nav>

        <div className="user-section">
          {user ? (
            <div className="user-profile" onClick={() => setShowProfileEditor(true)}>
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Аватар"
                  className="user-avatar"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/default-avatar.png';
                  }}
                />
              ) : (
                <div className="avatar-placeholder">
                  {getUserName().charAt(0).toUpperCase()}
                </div>
              )}
              <div className="user-info">
                <span className="user-name">{getUserName()}</span>
                <span className="edit-profile-link">Редактировать профиль</span>
              </div>
              <button onClick={handleLogout} className="auth-button logout-button">
                Выйти
              </button>
            </div>
          ) : (
            <div className="auth-buttons">
              <Link to="/login">
                <button className="auth-button">Войти</button>
              </Link>
              <Link to="/register">
                <button className="auth-button primary">Регистрация</button>
              </Link>
            </div>
          )}
        </div>
      </header>

      <main className="app-main">
        <Routes>
          <Route path="/" element={
            <div className="training-section">
              <div className="mode-selector">
                <button
                  className={`mode-button ${mode === "pushup" ? "active" : ""}`}
                  onClick={() => setMode("pushup")}
                >
                  📊 Отжимания
                </button>
                <button
                  className={`mode-button ${mode === "pullup" ? "active" : ""}`}
                  onClick={() => setMode("pullup")}
                >
                  💪 Подтягивания
                </button>
              </div>

              {exerciseCount > 0 && (
                <div className="exercise-result">
                  <h3>Результат: {exerciseCount} повторений</h3>
                  {userData && (
                    <p>
                      Ваш рекорд в {mode === "pushup" ? "отжиманиях" : "подтягиваниях"}:{" "}
                      {userData[`${mode}Record`] || 0}
                    </p>
                  )}
                </div>
              )}

              <div className="camera-container">
                {isCameraOn ? (
                  <>
                    <div className="camera-view">
                      {processingMode === "live" ? (
                        <PoseCamera onResults={handleResults} />
                      ) : (
                        videoFile && <VideoFileProcessor videoFile={videoFile} onResults={handleResults} />
                      )}
                    </div>

                    <div className="tracker-container">
                      {mode === "pushup" && (
                        <PushUpTracker
                          results={poseResults}
                          onExerciseComplete={handleExerciseComplete}
                        />
                      )}
                      {mode === "pullup" && (
                        <PullUpTracker
                          results={poseResults}
                          onExerciseComplete={handleExerciseComplete}
                        />
                      )}
                    </div>

                    <button
                      onClick={exitAnalysisMode}
                      className="exit-analysis-button"
                    >
                      🚪 Выйти из режима анализа
                    </button>
                  </>
                ) : (
                  <div className="camera-placeholder">
                    <p>Включите камеру или загрузите видео для анализа</p>
                  </div>
                )}
              </div>

              <div className="camera-controls">
                <TurnCamera
                  isCameraOn={isCameraOn}
                  toggleCamera={toggleIsCamera}
                  handleVideoUpload={handleVideoUpload}
                />
              </div>

              <div className="recording-section">
                <VideoRecorder
                  mode={mode}
                  onRecordingComplete={handleRecordingComplete}
                  onRecordingStatusChange={handleRecordingStatusChange}
                />

                {showSuccessMessage && (
                  <div className="success-message">
                    <div className="success-content">
                      <span className="success-icon">✅</span>
                      <div>
                        <h3>Запись успешно сохранена!</h3>
                        <p>Перейдите во вкладку <Link to="/recordings">"Мои записи"</Link> чтобы посмотреть</p>
                      </div>
                      <button
                        onClick={() => setShowSuccessMessage(false)}
                        className="close-button"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                )}

                {currentRecording && (
                  <div className="recording-result">
                    <h3>🎉 Запись завершена!</h3>
                    <p>Результат: {currentRecording.count} повторений</p>
                    <video src={currentRecording.videoUrl} controls width="300" />
                    <button onClick={() => setCurrentRecording(null)}>
                      Закрыть
                    </button>
                  </div>
                )}
              </div>

              <div className="instructions">
                <h3>📋 Как использовать:</h3>
                <ul>
                  <li>🎥 Встаньте перед камеру на расстоянии 2-3 метров</li>
                  <li>👀 Убедитесь, что вас хорошо видно в полный рост</li>
                  <li>💪 Для отжиманий: выполняйте движения в вертикальной плоскости</li>
                  <li>🏋️ Для подтягиваний:
                    <ul>
                      <li>🔄 Полностью выпрямляйте руки в нижней точке</li>
                      <li>📈 Подтягивайтесь грудью к перекладине</li>
                      <li>⚖️ Держите корпус ровно, не раскачивайтесь</li>
                    </ul>
                  </li>
                  <li>🔢 Система автоматически подсчитает повторения</li>
                </ul>
              </div>
            </div>
          } />

          <Route path="/community" element={<Community />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/recordings" element={<Recordings />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </main>

      {showProfileEditor && user && (
        <ProfileEditor
          user={user}
          userData={userData}
          onClose={() => setShowProfileEditor(false)}
          onUpdate={handleProfileUpdate}
        />
      )}
    </div>
  );
}

export default App;