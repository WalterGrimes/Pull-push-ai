import React, { useEffect, useRef, useState } from "react";
import { PoseCamera } from "./PoseCamera";
import PullUpTracker from "../workout/PullUpTracker";
import type { Results } from '@mediapipe/pose';


// Добавляем интерфейс для класса PoseCamera
interface PoseCameraClass {
    new(): {
        init: (video: HTMLVideoElement, callback: (results: Results) => void) => void;
        stop: () => void;
    };
}

const CameraFeed: React.FC = () => {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const [results, setResults] = useState<Results | null>(null);

    useEffect(() => {
        // Явно указываем тип для PoseCamera
        const PoseCameraConstructor = PoseCamera as unknown as PoseCameraClass;
        const poseCamera = new PoseCameraConstructor();

        const handleResults = (results: Results) => {
            setResults(results);
        };

        if (videoRef.current) {
            poseCamera.init(videoRef.current, handleResults);
        }

        return () => {
            poseCamera.stop();
        };
    }, []);

    return (
        <div>
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{ display: "none" }}
            />
            {results && <PullUpTracker results={results} />}
        </div>
    );
};

export default CameraFeed;