// src/components/profile/AvatarSelector.tsx
import React from 'react';
import { AVATARS } from '../../entities/user/user.types';

interface AvatarSelectorProps {
    onSelect: (avatarId: string) => void;
    currentAvatar?: string;
    disabled?: boolean;
}

const AvatarSelector: React.FC<AvatarSelectorProps> = ({
    onSelect,
    currentAvatar,
    disabled = false
}) => {
    const selected = currentAvatar || 'avatar1';
    const currentAvatarData = AVATARS.find(a => a.id === selected);

    return (
        <div className="avatar-selector">
            {currentAvatarData && (
                <div className="current-avatar-preview">
                    <div 
                        className="avatar-display"
                        style={{ background: currentAvatarData.gradient }}
                    >
                        {currentAvatarData.imageUrl ? (
                            <img 
                                src={currentAvatarData.imageUrl} 
                                alt={currentAvatarData.name}
                                className="avatar-image"
                            />
                        ) : (
                            <span className="avatar-emoji">{currentAvatarData.emoji}</span>
                        )}
                    </div>
                    <span className="current-label">Текущая: {currentAvatarData.name}</span>
                </div>
            )}

            <div className="avatars-grid">
                {AVATARS.map((avatar) => (
                    <button
                        key={avatar.id}
                        type="button"
                        className={`avatar-option ${selected === avatar.id ? 'selected' : ''}`}
                        onClick={() => onSelect(avatar.id)}
                        disabled={disabled}
                        style={{ background: avatar.gradient }}
                        title={avatar.name}
                    >
                        {avatar.imageUrl ? (
                            <img 
                                src={avatar.imageUrl} 
                                alt={avatar.name}
                                className="avatar-image"
                            />
                        ) : (
                            <span className="avatar-emoji">{avatar.emoji}</span>
                        )}
                        {selected === avatar.id && (
                            <div className="selected-indicator">✓</div>
                        )}
                    </button>
                ))}
            </div>

            <style>{`
        .avatar-selector {
          width: 100%;
        }

        .current-avatar-preview {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          margin-bottom: 24px;
          padding: 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(102, 126, 234, 0.3);
        }

        .avatar-display {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 50px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
          border: 4px solid white;
          transition: transform 0.3s ease;
          overflow: hidden;
        }

        .avatar-display:hover {
          transform: scale(1.05);
        }

        .avatar-image {
          width: 60%;
          height: 60%;
          object-fit: contain;
          filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.3));
        }

        .current-label {
          color: white;
          font-weight: 600;
          font-size: 14px;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .avatars-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 12px;
          padding: 4px;
        }

        .avatar-option {
          position: relative;
          aspect-ratio: 1;
          border: 3px solid transparent;
          border-radius: 16px;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          overflow: hidden;
        }

        .avatar-option .avatar-image {
          width: 50%;
          height: 50%;
          object-fit: contain;
          transition: transform 0.3s ease;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
        }

        .avatar-option:hover:not(:disabled) {
          transform: translateY(-4px) scale(1.05);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.25);
          border-color: rgba(255, 255, 255, 0.5);
        }

        .avatar-option:hover:not(:disabled) .avatar-image {
          transform: scale(1.15) rotate(5deg);
        }

        .avatar-option:active:not(:disabled) {
          transform: translateY(-2px) scale(1.02);
        }

        .avatar-option.selected {
          border-color: #fff;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3), 0 0 0 4px rgba(102, 126, 234, 0.3);
          transform: scale(1.05);
        }

        .avatar-option:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .avatar-emoji {
          font-size: 40px;
          transition: transform 0.3s ease;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
        }

        .avatar-option:hover:not(:disabled) .avatar-emoji {
          transform: scale(1.1) rotate(5deg);
        }

        .selected-indicator {
          position: absolute;
          top: 6px;
          right: 6px;
          width: 28px;
          height: 28px;
          background: white;
          color: #667eea;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 16px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
          animation: checkmark-appear 0.3s ease;
        }

        @keyframes checkmark-appear {
          0% {
            transform: scale(0) rotate(-180deg);
            opacity: 0;
          }
          50% {
            transform: scale(1.2) rotate(10deg);
          }
          100% {
            transform: scale(1) rotate(0deg);
            opacity: 1;
          }
        }

        @media (max-width: 768px) {
          .avatars-grid {
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
          }

          .avatar-emoji {
            font-size: 32px;
          }

          .avatar-display {
            width: 80px;
            height: 80px;
            font-size: 40px;
          }
        }

        @media (max-width: 480px) {
          .avatars-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 8px;
          }

          .avatar-emoji {
            font-size: 28px;
          }

          .current-avatar-preview {
            padding: 16px;
            margin-bottom: 16px;
          }

          .avatar-display {
            width: 70px;
            height: 70px;
            font-size: 35px;
          }

          .selected-indicator {
            width: 24px;
            height: 24px;
            font-size: 14px;
          }
        }
      `}</style>
        </div>
    );
};

export default AvatarSelector;