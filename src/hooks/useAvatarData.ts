import { AVATARS } from './../entities/user/user.types';
import { useCallback, useMemo } from 'react';

interface UserData {
    photoURL?: string;
    avatarid: string | number;
}


export function useAvatarData(userData: UserData | null, user: any) {
    return useMemo(() => {
        const avatarId = userData?.photoURL || user?.photoURL || 'avatar1';
        return AVATARS.find(a => a.id === avatarId) || AVATARS[0];
    }, [userData?.photoURL, user?.photoURL]);
}

function useAvatarById() {
    return useCallback((avatarId?: string) => {
        const id = avatarId || 'avatar1';
        return AVATARS.find(a => a.id === id);
    }, []);
}