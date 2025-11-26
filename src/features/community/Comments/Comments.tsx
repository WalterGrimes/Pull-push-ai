import React, { useState, useEffect } from "react"
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { db, auth } from '../../../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import type { Comment, Post } from "../../../entities/user/user.types"
import { AVATARS } from "../../../entities/user/user.types";
import { doc, deleteDoc } from "firebase/firestore";

interface CommentProps {
    post: Post;
    postId: string;
    authorName: string;
    authorAvatarId?: string;
}

const Comments = ({ postId, post, authorName, authorAvatarId }: CommentProps) => {
    const [comments, setComments] = useState<Comment[]>([])
    const [commentsCount, setCommentsCount] = useState(0);
    const [value, setValue] = useState("");
    const [isExpanded, setIsExpanded] = useState(false);
    const [loading, setLoading] = useState(false);
    const inputRef = React.useRef<HTMLInputElement>(null);
    const [authUser] = useAuthState(auth);

    // ✅ useEffect 1: Загружаем ТОЛЬКО счетчик комментариев
    useEffect(() => {
      if (!postId) {
        console.warn('⚠️ postId is undefined, skipping comments count');
        return;
      }

      console.log('📍 Loading comments count for postId:', postId);

      const commentsRef = collection(db, 'posts', postId, 'comments');

      const unsubscribe = onSnapshot(commentsRef, (snapshot) => {
        setCommentsCount(snapshot.size);
        console.log('📊 Comments count updated:', snapshot.size);
      }, (error) => {
        console.error('❌ Error loading comments count:', error);
      });

      return () => unsubscribe();
    }, [postId]);

    // ✅ useEffect 2: Загружаем полные данные комментариев при раскрытии
    useEffect(() => {
      if (!isExpanded || !postId) return;

      console.log('📖 Loading full comments for postId:', postId);

      const commentsRef = collection(db, 'posts', postId, 'comments');
      const q = query(commentsRef, orderBy('createdAt', 'asc'));

      const unsubscribe = onSnapshot(q,
        (snapshot) => {
          const commentsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Comment[];
          setComments(commentsData);
          console.log('✅ Comments loaded:', commentsData.length);
        },
        (error) => {
          console.error('❌ Error loading comments:', error);
        }
      );

      return () => unsubscribe();
    }, [postId, isExpanded]);

    const addComment = async (text: string) => {
        if (!authUser) {
            console.error('❌ No user logged in');
            alert('Пожалуйста, войдите в систему, чтобы комментировать');
            return;
        }

        if (!postId) {
            console.error('❌ postId is undefined');
            return;
        }

        setLoading(true);
        try {
            const commentsRef = collection(db, 'posts', postId, 'comments');
            const commentData = {
                text,
                postId,
                authorId: authUser.uid,
                authorName: authUser.displayName || 'Anonymous',
                authorPhotoURL: authorAvatarId || 'avatar1',
                createdAt: serverTimestamp()
            };

            await addDoc(commentsRef, commentData);
            console.log('✅ Comment added successfully!');
        } catch (error) {
            console.error('❌ Error adding comment:', error);
            alert('Ошибка при добавлении комментария.');
        } finally {
            setLoading(false);
        }
    }

    const handleSubmit = async () => {
        if (!value.trim() || loading) return;
        await addComment(value.trim());
        setValue("");
    }

    const handleDeleteComment = async (commentId: string) => {
        if (!authUser || !postId || !commentId) {
            console.error('❌ Missing data for delete');
            return;
        }

        try {
            const commentRef = doc(db, 'posts', postId, 'comments', commentId);
            await deleteDoc(commentRef);
            console.log('✅ Comment deleted successfully!');
        } catch (error) {
            console.error('❌ Error deleting comment:', error);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    }

    const handleToggleComments = () => {
        const newExpandedState = !isExpanded;
        setIsExpanded(newExpandedState);

        if (newExpandedState) {
            setTimeout(() => {
                inputRef.current?.focus();
            }, 100);
        }
    };

    const getAvatarData = (avatarId?: string) => {
        return AVATARS.find(a => a.id === avatarId) || AVATARS[0];
    };

    const formatCommentDate = (createdAt: any) => {
        if (createdAt instanceof Timestamp) {
            return createdAt.toDate().toLocaleString('ru-RU', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
            });
        } else if (typeof createdAt === 'number') {
            return new Date(createdAt).toLocaleString('ru-RU', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
        return 'Только что';
    };

    // Не используем эту переменную, так что можно закомментировать
    // const postAvatarData = getAvatarData(post?.authorPhotoURL)

    return (
        <div className="comments-container">
            <button
                className="toggle-comments-btn"
                onClick={handleToggleComments}
            >
                💬 {isExpanded ? 'Скрыть' : 'Показать'} комментарии
                {commentsCount > 0 && ` (${commentsCount})`}
            </button>

            {isExpanded && (
                <div className="comments-content">
                    {comments.length > 0 ? (
                        <div className="comments-list">
                            {comments.map(comment => {
                                const commentAvatarData = getAvatarData(comment.authorPhotoURL);

                                return (
                                    <div key={comment.id} className="comment-item">
                                        <div className="comment-header">
                                            <div
                                                className="comment-avatar-wrapper"
                                                style={{ background: commentAvatarData.gradient }}
                                            >
                                                {commentAvatarData.imageUrl ? (
                                                    <img
                                                        src={commentAvatarData.imageUrl}
                                                        alt={comment.authorName}
                                                        className="comment-avatar-img"
                                                    />
                                                ) : commentAvatarData.emoji ? (
                                                    <span className="avatar-emoji">{commentAvatarData.emoji}</span>
                                                ) : (
                                                    <span className="avatar-fallback">
                                                        {comment.authorName?.charAt(0).toUpperCase()}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="comment-meta">
                                                <span className="comment-author">{comment.authorName}</span>
                                                <small className="comment-date">
                                                    {formatCommentDate(comment.createdAt)}
                                                </small>
                                            </div>

                                            {comment.authorId === authUser?.uid && (
                                                <button
                                                    onClick={() => handleDeleteComment(comment.id)}
                                                    className="delete-comment-btn"
                                                >
                                                    🗑️
                                                </button>
                                            )}
                                        </div>
                                        <div className="comment-text">{comment.text}</div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="no-comments">
                            <span className="no-comments-icon">💭</span>
                            <p>Пока нет комментариев. Будьте первым!</p>
                        </div>
                    )}

                    <div className="comment-form">
                        <input
                            ref={inputRef}
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Прокомментировать пост..."
                            className="comment-input"
                            maxLength={500}
                            disabled={loading || !authUser}
                        />
                        <button
                            onClick={handleSubmit}
                            className="submit-btn"
                            disabled={!value.trim() || loading || !authUser}
                        >
                            {loading ? '⏳' : '✉️'} {loading ? 'Отправка...' : 'Отправить'}
                        </button>
                    </div>
                </div>
            )}

            <style>{`
                .comments-container {
                    margin-top: 16px;
                    border-top: 1px solid #e0e0e0;
                    padding-top: 12px;
                }

                .toggle-comments-btn {
                    background: transparent;
                    border: none;
                    color: #667eea;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    padding: 8px 12px;
                    border-radius: 8px;
                    transition: all 0.2s ease;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }

                .toggle-comments-btn:hover {
                    background: #f0f0ff;
                    transform: translateY(-1px);
                }

                .comments-content {
                    margin-top: 12px;
                    background: #fafafa;
                    border-radius: 12px;
                    padding: 16px;
                    animation: slideDown 0.3s ease;
                }

                @keyframes slideDown {
                    from {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .comments-list {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    margin-bottom: 16px;
                    max-height: 400px;
                    overflow-y: auto;
                }

                .comment-item {
                    background: white;
                    padding: 12px 16px;
                    border-radius: 10px;
                    border-left: 3px solid #667eea;
                    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
                    transition: all 0.2s ease;
                }

                .comment-item:hover {
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                }

                .comment-header {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin-bottom: 8px;
                }

                .comment-avatar-wrapper {
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    overflow: hidden;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }

                .comment-avatar-img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .avatar-emoji {
                    font-size: 18px;
                }

                .avatar-fallback {
                    font-size: 14px;
                    font-weight: 600;
                    color: white;
                }

                .comment-meta {
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                    flex: 1;
                }

                .comment-author {
                    font-weight: 600;
                    font-size: 13px;
                    color: #333;
                }

                .comment-date {
                    color: #999;
                    font-size: 11px;
                    font-weight: 500;
                }

                .comment-text {
                    color: #333;
                    font-size: 14px;
                    line-height: 1.5;
                    word-wrap: break-word;
                    padding-left: 42px;
                }

                .delete-comment-btn {
                    margin-left: auto;
                    background: transparent;
                    border: 1px solid #ff6b6b;
                    color: #ff6b6b;
                    cursor: pointer;
                    font-size: 12px;
                    padding: 4px 8px;
                    border-radius: 6px;
                    transition: all 0.2s ease;
                    font-weight: 600;
                }

                .delete-comment-btn:hover {
                    background: #ff6b6b;
                    color: white;
                    transform: scale(1.05);
                }

                .no-comments {
                    text-align: center;
                    padding: 32px 16px;
                    color: #999;
                }

                .no-comments-icon {
                    font-size: 48px;
                    display: block;
                    margin-bottom: 12px;
                    opacity: 0.5;
                }

                .no-comments p {
                    margin: 0;
                    font-size: 14px;
                }

                .comment-form {
                    display: flex;
                    gap: 8px;
                    align-items: stretch;
                }

                .comment-input {
                    flex: 1;
                    padding: 12px 16px;
                    border: 2px solid #e0e0e0;
                    border-radius: 10px;
                    font-size: 14px;
                    transition: all 0.2s ease;
                    background: white;
                }

                .comment-input:focus {
                    outline: none;
                    border-color: #667eea;
                    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
                }

                .comment-input:disabled {
                    background: #f5f5f5;
                    cursor: not-allowed;
                }

                .comment-input::placeholder {
                    color: #aaa;
                }

                .submit-btn {
                    padding: 12px 20px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border: none;
                    border-radius: 10px;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    white-space: nowrap;
                    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
                }

                .submit-btn:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
                }

                .submit-btn:active:not(:disabled) {
                    transform: translateY(0);
                }

                .submit-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                    background: #ccc;
                }

                .comments-list::-webkit-scrollbar {
                    width: 6px;
                }

                .comments-list::-webkit-scrollbar-track {
                    background: #f1f1f1;
                    border-radius: 10px;
                }

                .comments-list::-webkit-scrollbar-thumb {
                    background: #667eea;
                    border-radius: 10px;
                }

                .comments-list::-webkit-scrollbar-thumb:hover {
                    background: #5568d3;
                }

                @media (max-width: 640px) {
                    .comment-form {
                        flex-direction: column;
                    }

                    .submit-btn {
                        width: 100%;
                    }

                    .comments-content {
                        padding: 12px;
                    }

                    .comment-item {
                        padding: 10px 12px;
                    }

                    .comment-text {
                        padding-left: 0;
                        margin-top: 8px;
                    }
                }
            `}</style>
        </div>
    );
}

export default Comments;