import type { User } from 'firebase/auth';

export interface UserProfile {
  uid: string;
  displayName: string;
  photoURL?: string;
  email?: string;
  pushupRecord?: number;
  pullupRecord?: number;
  lastWorkoutDate?: Date;
}

export type AuthUser = User;



export interface Avatar {
  id: string;
  emoji: string;
  gradient: string;
}

export const AVATARS: Avatar[] = [
  { id: 'avatar1', emoji: '😊', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { id: 'avatar2', emoji: '🚀', gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
  { id: 'avatar3', emoji: '🎮', gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
  { id: 'avatar4', emoji: '🎨', gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' },
  { id: 'avatar5', emoji: '⚡', gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' },
  { id: 'avatar6', emoji: '🎯', gradient: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)' },
  { id: 'avatar7', emoji: '🔥', gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)' },
  { id: 'avatar8', emoji: '⭐', gradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)' },
  { id: 'avatar9', emoji: '💪', gradient: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)' },
  { id: 'avatar10', emoji: '🏆', gradient: 'linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)' },
];

export const getAvatarById = (avatarId: string): Avatar | undefined => {
  return AVATARS.find(a => a.id === avatarId);
};