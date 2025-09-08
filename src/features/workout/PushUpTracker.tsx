import React, { useEffect, useState } from "react";
import type { Results } from "@mediapipe/pose";
import { getAngle } from "../../shared/utils/poseUtils";
import { auth, db } from "../../firebase";
import { doc, updateDoc, serverTimestamp, getDoc, collection, addDoc } from "firebase/firestore";

interface PushUpTrackerProps {
  results: Results | null;
  onExerciseComplete?: (count: number) => void;
}

const PushUpTracker = React.memo(({ results, onExerciseComplete }: PushUpTrackerProps) => {
  const [count, setCount] = useState(0);
  const [isDown, setIsDown] = useState(false);
  const [feedback, setFeedback] = useState("Примите положение упора лёжа");
  const [showFeedback, setShowFeedback] = useState(false);
  const [lastSavedCount, setLastSavedCount] = useState(0);

  const saveResult = async (finalCount: number) => {
    const user = auth.currentUser;
    if (!user || finalCount <= lastSavedCount) return;

    try {
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const currentRecord = userDoc.data().pushupRecord || 0;

        if (finalCount > currentRecord) {
          await updateDoc(userDocRef, {
            pushupRecord: finalCount,
            pushupRecordDate: serverTimestamp()
          });
          console.log("Новый рекорд по отжиманиям сохранен!");
          setLastSavedCount(finalCount);
        }

        // Добавляем в историю тренировок
        await addDoc(collection(db, "users", user.uid, "workouts"), {
          exerciseType: "pushup",
          count: finalCount,
          date: serverTimestamp()
        });
      }
    } catch (error) {
      console.error("Ошибка сохранения результата:", error);
    }
  };

  useEffect(() => {
    if (!results || !results.poseLandmarks) {
      setFeedback("Встаньте в положение для отжиманий");
      return;
    }

    const landmarks = results.poseLandmarks;
    const leftAngle = getAngle(landmarks[11], landmarks[13], landmarks[15]);
    const rightAngle = getAngle(landmarks[12], landmarks[14], landmarks[16]);
    const avgAngle = (leftAngle + rightAngle) / 2;

    const bodyAlignment = Math.abs(landmarks[11].y - landmarks[23].y) +
      Math.abs(landmarks[12].y - landmarks[24].y);

    if (avgAngle > 160 && !isDown) {
      setIsDown(true);
      setFeedback("Опускайтесь до угла 90°");
      setShowFeedback(true);
    } else if (avgAngle < 90 && isDown) {
      if (bodyAlignment < 0.2) {
        const newCount = count + 1;
        setCount(newCount);
        setIsDown(false);
        setFeedback("✓ Повторение засчитано");
        if (onExerciseComplete) {
          onExerciseComplete(newCount);
        }
      } else {
        setFeedback("Держите корпус ровно!");
      }
      setShowFeedback(true);
    }

    const timer = setTimeout(() => setShowFeedback(false), 2000);
    return () => clearTimeout(timer);
  }, [results]);

  useEffect(() => {
    return () => {
      if (count > 0) {
        saveResult(count);
      }
    };
  }, [count]);

  return (
    <div style={{
      position: "absolute",
      top: "20px",
      right: "20px",
      background: "rgba(30, 30, 40, 0.9)",
      color: "#f0f0f0",
      padding: "12px 16px",
      borderRadius: "12px",
      fontSize: "0.95rem",
      border: "1px solid #444",
      boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
      minWidth: "160px",
      zIndex: 100,
      transition: "opacity 0.3s",
      opacity: showFeedback ? 1 : 0.7
    }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "8px"
      }}>
        <span>Отжимания:</span>
        <strong style={{
          fontSize: "1.3rem",
          color: "#4caf50",
          minWidth: "30px",
          textAlign: "right"
        }}>{count}</strong>
      </div>

      <div style={{
        height: "3px",
        background: "#333",
        borderRadius: "2px",
        margin: "6px 0",
        overflow: "hidden"
      }}>
        <div style={{
          width: `${isDown ? 100 : 0}%`,
          height: "100%",
          background: "#ff5252",
          transition: "width 0.3s ease"
        }} />
      </div>

      <div style={{
        fontSize: "0.85rem",
        color: showFeedback ? "#fff" : "#aaa",
        height: "20px",
        transition: "color 0.3s",
        whiteSpace: "nowrap"
      }}>
        {showFeedback ? feedback : "Выполняйте отжимания"}
      </div>
    </div>
  );
});

export default PushUpTracker;