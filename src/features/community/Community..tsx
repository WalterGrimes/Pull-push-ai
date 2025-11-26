import { useState, useEffect } from 'react';
import {
  collection, query, orderBy, onSnapshot,
  addDoc, serverTimestamp, doc, deleteDoc,
  updateDoc, arrayUnion, arrayRemove
} from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { db, storage, auth } from '../../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import PostForm from '../profile/Postform';
import { useAvatarData } from '../../hooks/useAvatarData';
import { AVATARS } from '../../entities/user/user.types';
import type { UserData } from '../profile/ProfileEditor'
import type { User as FirebaseUser } from "firebase/auth";
import Comments from '../community/Comments/Comments';
import type { Post } from '../../entities/user/user.types';

type CommunityProps = {
  userData: UserData | null;
  user: FirebaseUser | null;
}

const Community = ({ userData, user }: CommunityProps) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isOpen, isCLose] = useState(false)
  const [authUser] = useAuthState(auth);
  const currentAvatarData = useAvatarData(
    userData
      ? { ...userData, avatarid: userData.avatarid ?? 'avatar1' }
      : { avatarid: 'avatar1' }
    , user
  );

  useEffect(() => {
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPosts(snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }) as Post));
    });
    return () => unsubscribe();
  }, []);

  const handleCreatePost = async (text: string, imageUrl?: string) => {
    if (!authUser) {
      console.error('No authUser logged in');
      return;
    }

    try {
      const postData = {
        text,
        authorId: authUser.uid,
        authorName: authUser.displayName || 'Anonymous',
        // ✅ Сохраняем ID аватарки (например, "avatar2")
        authorPhotoURL: currentAvatarData.id,
        createdAt: serverTimestamp(),
        likes: [],
        ...(imageUrl ? { imageUrl } : {})
      };

      await addDoc(collection(db, 'posts'), postData);
      console.log('✅ Post created successfully!');
    } catch (err) {
      console.error('❌ Error creating post:', err);
      throw err;
    }
  };

  const handleLike = async (postId: string) => {
    if (!authUser) return;
    const postRef = doc(db, 'posts', postId);

    await updateDoc(postRef, {
      likes: posts.find(p => p.id === postId)?.likes.includes(authUser.uid)
        ? arrayRemove(authUser.uid)
        : arrayUnion(authUser.uid)
    });
  }; 

  const handleDeletePost = async (postId: string, imageUrl?: string) => {
    if (!authUser) return;

    if (imageUrl) {
      await deleteObject(ref(storage, imageUrl));
    }
    await deleteDoc(doc(db, 'posts', postId));
  };

  // ✅ Функция для получения данных аватарки по ID
  const getAvatarData = (avatarId?: string) => {
    return AVATARS.find(a => a.id === avatarId) || AVATARS[0];
  };


  return (
    <div className="community">
      <h1>Community Feed</h1>

      {authUser && <PostForm onSubmit={handleCreatePost} />}

      <div className="posts">
        {posts.map(post => {
          // ✅ Получаем данные аватарки для каждого поста
          const postAvatarData = getAvatarData(post.authorPhotoURL);

          return (
            <div key={post.id} className="post">
              <div className="post-header">
                {/* ✅ Рендерим аватарку с emoji/градиентом */}
                <div
                  className="post-avatar"
                  style={{ background: postAvatarData.gradient }}
                >
                  {postAvatarData.imageUrl ? (
                    <img
                      src={postAvatarData.imageUrl}
                      alt={post.authorName}
                      className="avatar-image"
                    />
                  ) : postAvatarData.emoji ? (
                    <span className="avatar-emoji">{postAvatarData.emoji}</span>
                  ) : (
                    <span className="avatar-fallback">
                      {post.authorName.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>

                <div>
                  <h3>{post.authorName}</h3>
                  <small>{post.createdAt?.toDate().toLocaleString()}</small>
                </div>

                {post.authorId === authUser?.uid && (
                  <button
                    onClick={() => handleDeletePost(post.id, post.imageUrl)}
                    className="delete-btn"
                  >
                    Delete
                  </button>
                )}
              </div>

              <p>{post.text}</p>

              {post.imageUrl && (
                <img src={post.imageUrl} alt="Post content" className="post-image" />
              )}

              <div className="post-actions">
                <button
                  onClick={() => handleLike(post.id)}
                  className={post.likes.includes(authUser?.uid || '') ? 'liked' : ''}
                >
                  ❤️ {post.likes.length}
                </button>
              </div>

              <Comments
                authorName={post.authorName}
                authorAvatarId={post.authorPhotoURL}
                post={post}
                postId={post.id}
              />


            </div>
          );
        })}
      </div>

      {/* ✅ Добавляем стили для аватарок в постах */}
      <style>{`
        .post-avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 12px;
          overflow: hidden;
          flex-shrink: 0;
        }

        .post-avatar .avatar-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .post-avatar .avatar-emoji {
          font-size: 24px;
        }

        .post-avatar .avatar-fallback {
          color: white;
          font-size: 20px;
          font-weight: 600;
        }

        .post-header {
          display: flex;
          align-items: center;
          margin-bottom: 12px;
        }
      `}</style>
    </div>
  );
};

export default Community;