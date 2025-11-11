import React from "react";

type Props = {
  isCameraOn: boolean;
  toggleCamera: () => void;
  handleVideoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

const TurnCamera: React.FC<Props> = React.memo(
  ({ isCameraOn, toggleCamera, handleVideoUpload }) => {
    return (
      <div className="camera-buttons">
        <button
          onClick={toggleCamera}
          className={`camera-toggle ${isCameraOn ? "on" : "off"}`}
        >
          {isCameraOn ? "🔴 Камера включена" : "🎥 Включить камеру"}
        </button>

        <label className="upload-btn">
          📹 Загрузить видео
          <input
            type="file"
            accept="video/*"
            onChange={handleVideoUpload}
            style={{ display: "none" }}
          />
        </label>

        <style>{`
          .camera-buttons {
            display: flex;
            gap: 12px;
            justify-content: center;
            flex-wrap: wrap;
          }
          .camera-toggle {
            border: none;
            border-radius: 12px;
            padding: 12px 20px;
            font-size: 15px;
            font-weight: 600;
            cursor: pointer;
            transition: 0.25s;
          }
          .camera-toggle.on {
            background: linear-gradient(135deg, #ff5858, #f857a6);
            color: white;
          }
          .camera-toggle.off {
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
          }
          .camera-toggle:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
          }

          .upload-btn {
            background: linear-gradient(135deg, #43cea2, #185a9d);
            color: white;
            border-radius: 12px;
            padding: 12px 20px;
            font-size: 15px;
            font-weight: 600;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            transition: 0.25s;
          }
          .upload-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.25);
          }
        `}</style>
      </div>
    );
  }
);

TurnCamera.displayName = "TurnCamera";
export default TurnCamera;
