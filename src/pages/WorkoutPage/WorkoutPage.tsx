import React from 'react';
import { useWorkout } from './hooks/useWorkout';
import { ExerciseTypeToggle } from './components/ExerciseTypeToggle';
import { CameraView } from './components/CameraView';
import { ExerciseTracker } from './components/ExerciseTracker';
import { WorkoutInstructions } from './components/WorkoutInstructions';

export const WorkoutPage = () => {
  const {
    mode,
    setMode,
    isCameraOn,
    toggleCamera,
    poseResults,
    videoFile,
    processingMode,
    handleVideoUpload,
    exitAnalysisMode,
  } = useWorkout();

  return (
    <div className="workout-page">
      <ExerciseTypeToggle 
        mode={mode}
        onChange={setMode}
      />
      
      <CameraView
        isActive={isCameraOn}
        mode={processingMode}
        videoFile={videoFile}
        onToggle={toggleCamera}
        onUpload={handleVideoUpload}
        onExit={exitAnalysisMode}
      />

      {poseResults && (
        <ExerciseTracker
          mode={mode}
          results={poseResults}
        />
      )}

      <WorkoutInstructions mode={mode} />
    </div>
  );
};