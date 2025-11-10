// src/features/workout/lib/useWorkout.ts
import { useState } from "react";
import { useSaveWorkout } from "../../features/workout/lib/useSaveWorkout";
import type { Results } from "@mediapipe/pose";

type ExerciseType = "pushup" | "squat" | "plank" | "pullup";
type ProcessingMode = "live" | "file";

export const useWorkout = () => {
  const [mode, setMode] = useState<ExerciseType>("pushup");
  const [poseResults, setPoseResults] = useState<Results | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [processingMode, setProcessingMode] =
    useState<ProcessingMode>("live");

  const { saveResult } = useSaveWorkout();

  return {
    mode,
    setMode,
    poseResults,
    isCameraOn,
    videoFile,
    processingMode,
    saveResult,
  };
};
