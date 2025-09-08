import { useState, useEffect } from 'react';
import { 
  collection, query, orderBy, onSnapshot, 
  addDoc, serverTimestamp, doc, deleteDoc,
  updateDoc, arrayUnion, arrayRemove 
} from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { db, storage, auth } from '../../firebase'
import { useAuthState } from 'react-firebase-hooks/auth';
import PostForm from '../../features/profile/Postform';
import './Community.css';

interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorPhotoURL?: string;
  text: string;
  imageUrl?: string;
  createdAt: any;
  likes: string[];
}

const Community = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [user] = useAuthState(auth);

  // Загрузка постов
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

  // Создание поста
  const handleCreatePost = async (text: string, imageUrl?: string) => {
    if (!user) return;
    
    await addDoc(collection(db, 'posts'), {
      text,
      imageUrl,
      authorId: user.uid,
      authorName: user.displayName || 'Anonymous',
      authorPhotoURL: user.photoURL || null,
      createdAt: serverTimestamp(),
      likes: []
    });
  };

  // Лайк поста
  const handleLike = async (postId: string) => {
    if (!user) return;
    const postRef = doc(db, 'posts', postId);
    
    await updateDoc(postRef, {
      likes: posts.find(p => p.id === postId)?.likes.includes(user.uid)
        ? arrayRemove(user.uid)
        : arrayUnion(user.uid)
    });
  };

  // Удаление поста
  const handleDeletePost = async (postId: string, imageUrl?: string) => {
    if (!user) return;
    
    if (imageUrl) {
      await deleteObject(ref(storage, imageUrl));
    }
    await deleteDoc(doc(db, 'posts', postId));
  };

  return (
    <div className="community">
      <h1>Community Feed</h1>
      
      {user && <PostForm onSubmit={handleCreatePost} />}
      
      <div className="posts">
        {posts.map(post => (
          <div key={post.id} className="post">
            <div className="post-header">
              <img 
                src={post.authorPhotoURL || '/default-avatar.png'} 
                alt={post.authorName}
              />
              <div>
                <h3>{post.authorName}</h3>
                <small>{post.createdAt?.toDate().toLocaleString()}</small>
              </div>
              
              {post.authorId === user?.uid && (
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
                className={post.likes.includes(user?.uid || '') ? 'liked' : ''}
              >
                ❤️ {post.likes.length}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Community;