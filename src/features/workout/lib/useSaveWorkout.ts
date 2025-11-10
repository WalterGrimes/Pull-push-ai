import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { auth, db, storage } from "../../../firebase";

interface WorkoutData {
  exerciseType: string;
  count: number;
  videoFile?: File;
}

export const useSaveWorkout = () => {
  const saveResult = async ({ exerciseType, count, videoFile }: WorkoutData) => {
    const user = auth.currentUser;
    if (!user) {
      console.error("Нет авторизованного пользователя");
      return;
    }

    let videoUrl: string | null = null;

    // 🔹 Загружаем видео, если передано
    if (videoFile) {
      try {
        const videoRef = ref(storage, `workouts/${user.uid}/${Date.now()}_${videoFile.name}`);
        const snapshot = await uploadBytes(videoRef, videoFile);
        videoUrl = await getDownloadURL(snapshot.ref);
      } catch (err) {
        console.error("Ошибка при загрузке видео:", err);
      }
    }

    try {
      // 🔹 Сохраняем запись в Firestore
      await addDoc(collection(db, "users", user.uid, "workouts"), {
        exerciseType,
        count,
        videoUrl: videoUrl || null,
        date: serverTimestamp(),
      });

      console.log("✅ Тренировка сохранена в Firestore");
    } catch (err) {
      console.error("Ошибка при сохранении тренировки:", err);
    }
  };

  return { saveResult };
};
