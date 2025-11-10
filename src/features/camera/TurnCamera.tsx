import React from "react";

type Props = {
    isCameraOn: boolean;
    toggleCamera: () => void;
    handleVideoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

// ✅ ПРАВИЛЬНЫЙ синтаксис React.memo
const TurnCamera: React.FC<Props> = React.memo(({ 
    isCameraOn,
    toggleCamera,
    handleVideoUpload,
}) => {
    return (
        <div className="camera-controls-buttons">
            <button onClick={toggleCamera} className="camera-toggle-btn">
                {isCameraOn ? "🔴 Выключить камеру" : "🎥 Включить камеру"}
            </button>
            <label className="video-upload-btn">
                📹 Загрузить видео
                <input 
                    type="file" 
                    accept="video/*" 
                    onChange={handleVideoUpload}
                    style={{ display: 'none' }}
                />
            </label>
        </div>
    );
});

TurnCamera.displayName = 'TurnCamera';

export default TurnCamera;