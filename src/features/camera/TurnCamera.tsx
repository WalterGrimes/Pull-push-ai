import React from "react";

type Props = {
    isCameraOn: boolean;
    toggleCamera: () => void;
    handleVideoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const TurnCamera: React.FC<Props> = ({
    isCameraOn,
    toggleCamera,
    handleVideoUpload,

}) => {
    return(
        <div>
            <button onClick={toggleCamera}>
                {isCameraOn ? "Выключить камеру" : "Включить камеру"}
            </button>
            <input type="file" accept="video/*" onChange={handleVideoUpload} />
        </div>
    )
}

export default TurnCamera;