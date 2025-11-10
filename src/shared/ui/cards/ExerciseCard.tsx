// shared/ui/cards/ExerciseCard.tsx
import React from "react";
import { ExerciseType } from "@/entities/exercise/type";
import { ExerciseType } from "@/entities/exercise/types";

interface ExerciseCardProps {
  type: ExerciseType;
  isActive: boolean;
  onClick: () => void;
}

const ExerciseCard: React.FC<ExerciseCardProps> = ({ 
  type, 
  isActive, 
  onClick 
}) => {
  const config = {
    pushup: { label: "Отжимания", icon: "💪" },
    pullup: { label: "Подтягивания", icon: "👆" }
  }[type];

  return (
    <button
      className={`exercise-card ${isActive ? "active" : ""}`}
      onClick={onClick}
      aria-pressed={isActive}
    >
      <span className="exercise-icon">{config.icon}</span>
      <span className="exercise-label">{config.label}</span>
    </button>
  );
};

export default React.memo(ExerciseCard);