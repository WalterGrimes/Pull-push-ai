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
import "./App.css";

interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

function App() {
  const [mode, setMode] = useState<"pushup" | "pullup">("pushup");
  const [poseResults, setPoseResults] = useState<Results | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [processingMode, setProcessingMode] = useState<"live" | "upload">("live");
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [exerciseCount, setExerciseCount] = useState(0);
  const [showProfileEditor, setShowProfileEditor] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser({
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName,
          photoURL: currentUser.photoURL
        });

        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        setUserData(userDoc.exists() ? userDoc.data() : null);
      } else {
        setUser(null);
        setUserData(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Восстанавливаем необходимые функции
  const toggleIsCamera = () => {
    setIsCameraOn(prev => !prev);
    setVideoFile(null);
    setProcessingMode("live");
    setExerciseCount(0);
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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

  const handleLogout = () => {
    signOut(auth).then(() => {
      navigate('/login');
    });
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
          }

          await addDoc(collection(db, "users", user.uid, "workouts"), {
            exerciseType: mode,
            count: count,
            date: serverTimestamp()
          });
        }
      } catch (error) {
        console.error("Ошибка сохранения результата:", error);
      }
    }
  };

  const exitAnalysisMode = () => {
    setIsCameraOn(false);
    setVideoFile(null);
    setPoseResults(null);
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Pull-Push</h1>
        <nav className="main-nav">
          <Link to="/">Тренировка</Link>
          <Link to="/leaderboard">Таблица лидеров</Link>
          <Link to="/community">Сообщество</Link>
        </nav>

        <div className="user-section">
          {user ? (
            <div className="user-profile" onClick={() => setShowProfileEditor(true)}>
              {user.photoURL || userData?.photoURL ? (
                <img
                  src={user.photoURL || userData?.photoURL}
                  alt="Аватар"
                  className="user-avatar"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/default-avatar.png';
                  }}
                />
              ) : (
                <div className="avatar-placeholder">
                  {user.displayName?.charAt(0) || user.email?.charAt(0)}
                </div>
              )}
              <div className="user-info">
                <span className="user-name">
                  {user.displayName || user.email}
                </span>
                <span className="edit-profile-link">Редактировать профиль</span>
              </div>
              <button onClick={handleLogout} className="auth-button logout-button">Выйти</button>
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

      <Routes>
        <Route path="/" element={
          <>
            <div className="mode-selector">
              <button
                className={mode === "pushup" ? "active" : ""}
                onClick={() => setMode("pushup")}
              >
                Отжимания
              </button>
              <button
                className={mode === "pullup" ? "active" : ""}
                onClick={() => setMode("pullup")}
              >
                Подтягивания
              </button>
            </div>

            <div className="camera-container">
              {isCameraOn && (
                <>
                  {processingMode === "live" ? (
                    <PoseCamera onResults={handleResults} />
                  ) : (
                    videoFile && <VideoFileProcessor videoFile={videoFile} onResults={handleResults} />
                  )}

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

                  <button
                    onClick={exitAnalysisMode}
                    className="exit-analysis-button"
                  >
                    Выйти из режима анализа
                  </button>
                </>
              )}
            </div>

            <div className="camera-controls">
              <TurnCamera
                isCameraOn={isCameraOn}
                toggleCamera={toggleIsCamera}
                handleVideoUpload={handleVideoUpload}
              />
            </div>

            <div className="instructions">
              <h3>Как использовать:</h3>
              <ul>
                <li>Встаньте перед камерой на расстоянии 2-3 метров</li>
                <li>Убедитесь, что вас хорошо видно в полный рост</li>
                <li>Для отжиманий: выполняйте движения в вертикальной плоскости</li>
                <li>Для подтягиваний:
                  <ul>
                    <li>Полностью выпрямляйте руки в нижней точке</li>
                    <li>Подтягивайтесь грудью к перекладине</li>
                    <li>Держите корпус ровно, не раскачивайтесь</li>
                  </ul>
                </li>
                <li>Система автоматически подсчитает повторения</li>
              </ul>
            </div>
          </>
        } />

        <Route path="/community" element={<Community />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
      </Routes>

      {showProfileEditor && user && (
        <ProfileEditor
          user={user}
          userData={userData}
          onClose={() => setShowProfileEditor(false)}
          onUpdate={(updatedData) => {
            setUserData(updatedData);
            if (updatedData.photoURL) {
              setUser(prev => prev ? { ...prev, photoURL: updatedData.photoURL } : null);
            }
          }}
        />
      )}
    </div>
  );
}

export default App;