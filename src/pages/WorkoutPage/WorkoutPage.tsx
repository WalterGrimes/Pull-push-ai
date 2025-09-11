import React from 'react';


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