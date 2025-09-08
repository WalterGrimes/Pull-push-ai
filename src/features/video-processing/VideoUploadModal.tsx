const VideoUploadModal = ({ onClose }: { onClose: () => void }) => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [exerciseType, setExerciseType] = useState<'pushup' | 'pullup'>('pushup');
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<number | null>(null);

  const handleUpload = async () => {
    if (!videoFile) return;
    
    setProcessing(true);
    try {
      // Здесь будет логика обработки видео через MediaPipe
      // Временная заглушка - просто сохраняем файл
      const filename = `videos/${auth.currentUser?.uid}/${Date.now()}.mp4`;
      const storageRef = ref(storage, filename);
      await uploadBytes(storageRef, videoFile);
      
      // В реальном приложении здесь будет обработка видео
      // и сохранение результата в Firestore
      setResult(Math.floor(Math.random() * 50) + 10); // временный результат
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="upload-modal">
        <h2>Добавить результат</h2>
        
        <select 
          value={exerciseType}
          onChange={(e) => setExerciseType(e.target.value as 'pushup' | 'pullup')}
        >
          <option value="pushup">Отжимания</option>
          <option value="pullup">Подтягивания</option>
        </select>
        
        <input 
          type="file" 
          accept="video/*"
          onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
        />
        
        {processing ? (
          <div>Обработка видео...</div>
        ) : result ? (
          <div className="result">
            <h3>Результат: {result} повторений</h3>
            <button onClick={onClose}>Закрыть</button>
          </div>
        ) : (
          <div className="actions">
            <button onClick={onClose}>Отмена</button>
            <button 
              onClick={handleUpload}
              disabled={!videoFile}
            >
              Отправить
            </button>
          </div>
        )}
      </div>
    </div>
  );
};