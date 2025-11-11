import type { User } from 'firebase/auth';

// Профиль пользователя для Firestore
export interface UserProfile {
  uid: string;
  displayName: string;
  photoURL?: string; // Тут хранится avatarId (например "avatar1")
  email?: string;
  pushupRecord?: number;
  pullupRecord?: number;
  lastWorkoutDate?: Date;
  nickname?: string;
  description?: string;
}

export type AuthUser = User;

// Данные аватарки
export interface Avatar {
  id: string;
  emoji?: string;
  imageUrl?: string;
  gradient: string;
  name: string;
}

// Список доступных аватарок
export const AVATARS: Avatar[] = [
  {
    id: 'avatar1',
    imageUrl: 'https://api.iconify.design/mdi/arm-flex.svg?color=%23ffffff&width=60',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    name: 'Сила'
  },
  {
    id: 'avatar2',
    imageUrl: 'https://api.iconify.design/game-icons/muscular-torso.svg?color=%23ffffff&width=60',
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    name: 'Торс'
  },
  {
    id: 'avatar3',
    imageUrl: 'https://api.iconify.design/mdi/dumbbell.svg?color=%23ffffff&width=60',
    gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    name: 'Гантели'
  },
  {
    id: 'avatar4',
    imageUrl: 'https://api.iconify.design/fa6-solid/person-running.svg?color=%23ffffff&width=60',
    gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    name: 'Бег'
  },
  {
    id: 'avatar5',
    imageUrl: 'https://api.iconify.design/mdi/medal.svg?color=%23ffffff&width=60',
    gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    name: 'Медаль'
  },
  {
    id: 'avatar6',
    imageUrl: 'https://api.iconify.design/game-icons/weight.svg?color=%23ffffff&width=60',
    gradient: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
    name: 'Зал'
  },
  {
    id: 'avatar7',
    imageUrl: 'https://api.iconify.design/mdi/weight-lifter.svg?color=%23ffffff&width=60',
    gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    name: 'Штанга'
  },
  {
    id: 'avatar8',
    imageUrl: 'https://api.iconify.design/mdi/lightning-bolt.svg?color=%23ffffff&width=60',
    gradient: 'linear-gradient(135deg, #ff9a56 0%, #ff6a88 100%)',
    name: 'Молния'
  },
  {
    id: 'avatar9',
    imageUrl: 'https://api.iconify.design/mdi/fire.svg?color=%23ffffff&width=60',
    gradient: 'linear-gradient(135deg, #ffa751 0%, #ffe259 100%)',
    name: 'Огонь'
  },
  {
    id: 'avatar10',
    imageUrl: 'https://api.iconify.design/mdi/trophy.svg?color=%23ffffff&width=60',
    gradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
    name: 'Кубок'
  }
];

// Утилита для получения данных аватарки по ID
export const getAvatarById = (avatarId?: string): Avatar => {
  return AVATARS.find(a => a.id === avatarId) || AVATARS[0];
};