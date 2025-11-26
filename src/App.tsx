import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { PoseCamera } from "./features/camera/PoseCamera";
import PushUpTracker from "./features/workout/PushUpTracker";
import PullUpTracker from "./features/workout/PullUpTracker";
import type { Results } from '@mediapipe/pose';
import TurnCamera from "./features/camera/TurnCamera";
import { VideoFileProcessor } from "./features/video-processing/VideoFileProcessor";
import { Link, useNavigate, Routes, Route } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, updateDoc, getDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import Community from "./features/community/Community.";
import Leaderboard from "./features/leaderboard/Leaderboard";
import ProfileEditor from "./features/profile/ProfileEditor";
import { VideoRecorder } from './features/recording/VideoRecorder';
import Recordings from "./pages/Recordings/Recording";
import Login from "./features/auth/Login";
import Register from "./features/auth/Register";
import { auth, db, storage } from "./firebase";
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import "./App.css";
import type { User as FirebaseUser } from "firebase/auth";
import { AVATARS } from "./entities/user/user.types";
import { useAvatarData } from "./hooks/useAvatarData";

interface UserData {
    photoURL?: string;
    pushupRecord?: number;
    pullupRecord?: number;
    displayName?: string;
    pushupRecordDate?: Date;
    pullupRecordDate?: Date;
    nickname?: string;
    description?: string;
}

function App() {
    // ✅ 1. ВСЕ useState (13 штук)
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
    const [user, setUser] = useState<FirebaseUser | null>(null);
    const [userData, setUserData] = useState<UserData | null>(null);
    const [exerciseCount, setExerciseCount] = useState(0);
    const [showProfileEditor, setShowProfileEditor] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // ✅ 2. useRef (3 штуки)
    const userDataCache = useRef<Map<string, UserData>>(new Map());
    const exerciseCountRef = useRef(exerciseCount);
    const lastProcessed = useRef(0);

    // ✅ 3. useNavigate (это хук из react-router)
    const navigate = useNavigate();

   
    const currentAvatarData = useAvatarData(userData,user)

    const userName = useMemo(() => {
        if (userData?.displayName) return userData.displayName;
        if (user?.displayName) return user.displayName;
        if (user?.email) return user.email;
        return "Пользователь";
    }, [userData?.displayName, user?.displayName, user?.email]);

    const avatarUrl = useMemo(() => {
        return userData?.photoURL || user?.photoURL || undefined;
    }, [userData?.photoURL, user?.photoURL]);

    // ✅ 5. useEffect (2 штуки)
    useEffect(() => {
        exerciseCountRef.current = exerciseCount;
    }, [exerciseCount]);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setIsLoading(true);

            try {
                if (currentUser) {
                    setUser(currentUser);

                    // Проверяем кеш перед запросом
                    const cached = userDataCache.current.get(currentUser.uid);
                    if (cached) {
                        console.log('✅ Using cached userData');
                        setUserData(cached);
                        setIsLoading(false);
                        return;
                    }

                    // Если кеша нет - загружаем из Firestore
                    console.log('📥 Loading userData from Firestore');
                    const userDoc = await getDoc(doc(db, "users", currentUser.uid));

                    if (userDoc.exists()) {
                        const data = userDoc.data() as UserData;
                        // Сохраняем в кеш
                        userDataCache.current.set(currentUser.uid, data);
                        setUserData(data);
                    } else {
                        console.warn('⚠️ User document not found');
                        setUserData(null);
                    }
                } else {
                    setUser(null);
                    setUserData(null);
                    userDataCache.current.clear();
                }
            } catch (error) {
                console.error("Ошибка загрузки данных пользователя:", error);
                setUserData(null);
            } finally {
                setIsLoading(false);
            }
        });

        return () => unsubscribe();
    }, []);

    // ✅ 6. useCallback (9 штук)
    const toggleIsCamera = useCallback(() => {
        setIsCameraOn(prev => !prev);
        setVideoFile(null);
        setProcessingMode("live");
        setExerciseCount(0);
    }, []);

    const handleRecordingStatusChange = useCallback((recording: boolean) => {
        setIsRecording(recording);
    }, []);

    const handleRecordingComplete = useCallback(async (count: number, videoBlob: Blob, duration: number) => {
        try {
            const user = auth.currentUser;
            if (!user) {
                alert('Необходимо войти в аккаунт для сохранения записи');
                return;
            }

            console.log('💾 Saving recording to Firebase...');
            console.log('📦 Blob size:', (videoBlob.size / 1024 / 1024).toFixed(2), 'MB');

            if (videoBlob.size > 100 * 1024 * 1024) {
                alert('Видео слишком большое (>100MB). Попробуйте записать короче.');
                return;
            }

            const filename = `recordings/${user.uid}/${Date.now()}_${mode}.webm`;
            const storageRef = ref(storage, filename);

            let uploadTask;
            let retries = 0;
            const maxRetries = 3;

            while (retries < maxRetries) {
                try {
                    console.log(`📤 Uploading... Attempt ${retries + 1}/${maxRetries}`);
                    uploadTask = await uploadBytes(storageRef, videoBlob, {
                        contentType: 'video/webm',
                        customMetadata: {
                            'uploadedBy': user.uid,
                            'exerciseType': mode,
                            'count': count.toString()
                        }
                    });
                    break;
                } catch (uploadError: any) {
                    retries++;
                    console.error(`❌ Upload attempt ${retries} failed:`, uploadError);

                    if (retries >= maxRetries) {
                        throw new Error('Не удалось загрузить видео после нескольких попыток. Проверьте интернет соединение.');
                    }

                    await new Promise(resolve => setTimeout(resolve, 1000 * retries));
                }
            }

            const videoUrl = await getDownloadURL(uploadTask!.ref);
            console.log('✅ Video successfully uploaded. URL:', videoUrl);

            await addDoc(collection(db, 'users', user.uid, 'recordings'), {
                exerciseType: mode,
                count,
                videoUrl,
                duration,
                date: serverTimestamp(),
                isPublished: false,
            });

            console.log('✅ Metadata saved to Firestore.');

            setCurrentRecording({ count, videoUrl });
            setExerciseCount(count);
            setShowSuccessMessage(true);

            setTimeout(() => {
                setShowSuccessMessage(false);
            }, 5000);

        } catch (error: any) {
            console.error('❌ Error saving recording:', error);
            alert(`Ошибка при сохранении записи: ${error.message || 'Пожалуйста, попробуйте снова.'}`);
        }
    }, [mode]);

    const handleVideoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
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
    }, []);

    const handleResults = useCallback((results: Results) => {
        const now = Date.now();
        // Обновляем максимум раз в 200мс
        if (now - lastProcessed.current < 200) return;
        lastProcessed.current = now;
        setPoseResults(results);
    }, []);

    const handleLogout = useCallback(async () => {
        try {
            await signOut(auth);
            // Очищаем кеш при выходе
            userDataCache.current.clear();
            navigate('/login');
        } catch (error) {
            console.error("Ошибка выхода:", error);
            alert("Не удалось выйти из системы");
        }
    }, [navigate]);

    const handleExerciseComplete = useCallback(async (count: number) => {
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

                        const updatedData = {
                            ...userData,
                            [recordField]: count,
                            [`${mode}RecordDate`]: new Date()
                        } as UserData;

                        // Обновляем кеш
                        userDataCache.current.set(user.uid, updatedData);
                        setUserData(updatedData);
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
    }, [user, mode, userData]);

    const exitAnalysisMode = useCallback(() => {
        setIsCameraOn(false);
        setVideoFile(null);
        setPoseResults(null);
    }, []);

    const handleProfileUpdate = useCallback((updatedData: UserData) => {
        if (user) {
            // Обновляем кеш
            userDataCache.current.set(user.uid, updatedData);
        }
        setUserData(updatedData);
    }, [user]);

    // ✅ 7. Логика загрузки
    if (isLoading) {
        return (
            <div className="app-container">
                <div className="loading-spinner">Загрузка...</div>
            </div>
        );
    }

    // ✅ 8. Рендер JSX
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
                        <div className="user-profile">
                            {/* ✅ Контейнер с аватаркой и инфо */}
                            <div
                                className="user-avatar-section"
                                onClick={() => setShowProfileEditor(true)}
                            >
                                <div
                                    className="user-avatar"
                                    style={{ background: currentAvatarData.gradient }}
                                >
                                    {currentAvatarData.imageUrl ? (
                                        <img
                                            src={currentAvatarData.imageUrl}
                                            alt={currentAvatarData.name}
                                            className="avatar-image"
                                        />
                                    ) : currentAvatarData.emoji ? (
                                        <span className="avatar-emoji">{currentAvatarData.emoji}</span>
                                    ) : (
                                        <span className="avatar-fallback">
                                            {userName.charAt(0).toUpperCase()}
                                        </span>
                                    )}
                                </div>

                                <div className="user-info">
                                    <span className="user-name">{userName}</span>
                                    <span className="edit-profile-link">Редактировать профиль</span>
                                </div>
                            </div>

                            {/* ✅ Кнопка выхода под аватаркой */}
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
                                    currentCount={exerciseCountRef.current}
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
                        </div>
                    } />

                    <Route path="/community" element={<Community userData={userData} user={user}/>} />
                    <Route path="/leaderboard" element={<Leaderboard />} />
                    <Route path="/recordings" element={<Recordings user={user} />} />
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