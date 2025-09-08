// src/features/workout/lib/useWorkout.ts
import { useState, useMemo, useCallback } from "react";
import { useSaveWorkout } from 'features/workout/lib/useSaveWorkout';
import type { Results } from '@mediapipe/pose';

export const useWorkout = () => {
  const [mode, setMode] = useState<ExerciseType>("pushup");
  const [poseResults, setPoseResults] = useState<Results | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [processingMode, setProcessingMode] = useState<ProcessingMode>("live");
  
  const { saveResult } = useSaveWorkout();

  // Обработчики и логика...
  
  return {
    mode,
    setMode,
    poseResults,
    isCameraOn,
    toggleCamera,
    videoFile,
    processingMode,
    handleResults,
    handleVideoUpload,
    exitAnalysisMode,
    saveResult
  };
};