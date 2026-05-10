import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import axiosClient from '../utils/axiosClient';

const ProblemInteraction = ({ problemId }) => {
  const { user } = useSelector((state) => state.auth);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [commentsCount, setCommentsCount] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [likeAnimation, setLikeAnimation] = useState(false);
  const [loading, setLoading] = useState(true);
  const commentInputRef = useRef(null);

  // Fetch REAL data from backend - NO FAKE DATA
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch like status and count
        const likeResponse = await axiosClient.get(`/interaction/problem/${problemId}/like`);
        setLikesCount(likeResponse.data.likesCount || 0);
        setIsLiked(likeResponse.data.isLiked || false);

        // Fetch comments
        const commentsResponse = await axiosClient.get(`/interaction/problem/${problemId}/comments`);
        setComments(commentsResponse.data.comments || []);
        setCommentsCount(commentsResponse.data.totalCount || 0);

      } catch (error) {
        console.error('Failed to fetch interaction data:', error);
        // Set to zero on error - NO FAKE DATA
        setLikesCount(0);
        setIsLiked(false);
        setComments([]);
        setCommentsCount(0);
      } finally {
        setLoading(false);
      }
    };

    if (problemId) {
      fetchData();
    }
  }, [problemId]);

  const handleLike = async () => {
    if (!user) {
      alert('Please login to like problems');
      return;
    }

    // Trigger like animation
    setLikeAnimation(true);
    setTimeout(() => setLikeAnimation(false), 600);

    // Optimistic update
    const previousIsLiked = isLiked;
    const previousLikesCount = likesCount;
    setIsLiked(!isLiked);
    setLikesCount(prev => isLiked ? prev - 1 : prev + 1);

    try {
      // Make API call
      const response = await axiosClient.post(`/interaction/problem/${problemId}/like`);

      // Update with server response
      setIsLiked(response.data.isLiked);
      setLikesCount(response.data.likesCount);

    } catch (error) {
      console.error('Failed to toggle like:', error);
      // Revert on error
      setIsLiked(previousIsLiked);
      setLikesCount(previousLikesCount);
      alert('Failed to update like. Please try again.');
    }
  };

  const handleCommentToggle = () => {
    setShowComments(!showComments);

    // Auto-focus input when opening comments
    if (!showComments) {
      setTimeout(() => {
        commentInputRef.current?.focus();
      }, 300);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      alert('Please login to comment');
      return;
    }

    if (!newComment.trim()) {
      return;
    }

    setIsSubmittingComment(true);

    try {
      // Make API call to add comment
      const response = await axiosClient.post(`/interaction/problem/${problemId}/comments`, {
        text: newComment.trim()
      });

      // Add new comment to the list
      setComments(prev => [response.data.comment, ...prev]);
      setCommentsCount(response.data.commentsCount);
      setNewComment('');

    } catch (error) {
      console.error('Failed to post comment:', error);
      alert(error.response?.data?.message || 'Failed to post comment. Please try again.');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleCommentSubmit(e);
    }
  };

  const handleCommentLike = async (commentId, currentLikes) => {
    if (!user) {
      alert('Please login to like comments');
      return;
    }

    // Optimistic update
    setComments(prev => prev.map(comment => {
      if (comment.id === commentId) {
        const isLiked = comment.isLikedByUser || false;
        return {
          ...comment,
          likes: isLiked ? (comment.likes - 1) : (comment.likes + 1),
          isLikedByUser: !isLiked
        };
      }
      return comment;
    }));

    try {
      // Make API call
      await axiosClient.post(`/interaction/comment/${commentId}/like`);
    } catch (error) {
      console.error('Failed to like comment:', error);
      // Revert on error
      setComments(prev => prev.map(comment => {
        if (comment.id === commentId) {
          return {
            ...comment,
            likes: currentLikes,
            isLikedByUser: !comment.isLikedByUser
          };
        }
        return comment;
      }));
      alert('Failed to like comment. Please try again.');
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    try {
      const response = await axiosClient.delete(`/interaction/comment/${commentId}`);

      // Remove comment from list
      setComments(prev => prev.filter(c => c.id !== commentId));
      setCommentsCount(response.data.commentsCount);

    } catch (error) {
      console.error('Failed to delete comment:', error);
      alert('Failed to delete comment. Please try again.');
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const date = new Date(timestamp);
    const diff = now - date;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const getUserInitials = (username) => {
    return username?.charAt(0)?.toUpperCase() || 'U';
  };

  const formatCommentText = (text) => {
    return text.split('\n').map((line, index) => (
      <span key={index}>
        {line}
        {index < text.split('\n').length - 1 && <br />}
      </span>
    ));
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 mt-6 shadow-xl">
        <div className="flex items-center justify-center py-8">
          <div className="loading loading-spinner loading-md text-cyan-400"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 mt-6 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-slate-100">Community</h3>
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <span>{likesCount + commentsCount} interactions</span>
        </div>
      </div>

      {/* Like and Comment Buttons */}
      <div className="flex items-center gap-4 mb-6">
        {/* Like Button */}
        <button
          onClick={handleLike}
          className={`group flex items-center gap-3 px-5 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 active:scale-95 ${isLiked
            ? 'bg-gradient-to-r from-red-500/20 to-pink-500/20 text-red-400 border border-red-500/30 shadow-lg shadow-red-500/10'
            : 'bg-slate-700/50 text-slate-300 border border-slate-600 hover:bg-slate-700 hover:text-red-400 hover:border-red-500/30'
            }`}
        >
          <div className="relative">
            <svg
              className={`w-5 h-5 transition-all duration-300 ${isLiked ? 'fill-current scale-110' : 'group-hover:scale-110'
                } ${likeAnimation ? 'animate-bounce' : ''}`}
              fill={isLiked ? 'currentColor' : 'none'}
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
            {likeAnimation && (
              <div className="absolute inset-0 animate-ping">
                <svg className="w-5 h-5 text-red-400 opacity-75" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
            )}
          </div>
          <div className="flex flex-col items-start">
            <span className="font-semibold">{likesCount}</span>
            <span className="text-xs opacity-75">Like{likesCount !== 1 ? 's' : ''}</span>
          </div>
        </button>

        {/* Comment Button */}
        <button
          onClick={handleCommentToggle}
          className={`group flex items-center gap-3 px-5 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 active:scale-95 ${showComments
            ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400 border border-cyan-500/30 shadow-lg shadow-cyan-500/10'
            : 'bg-slate-700/50 text-slate-300 border border-slate-600 hover:bg-slate-700 hover:text-cyan-400 hover:border-cyan-500/30'
            }`}
        >
          <svg
            className={`w-5 h-5 transition-all duration-300 ${showComments ? 'scale-110' : 'group-hover:scale-110'}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          <div className="flex flex-col items-start">
            <span className="font-semibold">{commentsCount}</span>
            <span className="text-xs opacity-75">Comment{commentsCount !== 1 ? 's' : ''}</span>
          </div>
        </button>

        {/* Share Button */}
        <button
          onClick={() => {
            navigator.clipboard.writeText(window.location.href);
            alert('Link copied to clipboard!');
          }}
          className="group flex items-center gap-3 px-5 py-3 rounded-xl bg-slate-700/50 text-slate-300 border border-slate-600 hover:bg-slate-700 hover:text-purple-400 hover:border-purple-500/30 transition-all duration-300 transform hover:scale-105 active:scale-95"
        >
          <svg className="w-5 h-5 transition-all duration-300 group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
          </svg>
          <span className="text-xs opacity-75">Share</span>
        </button>
      </div>

      {/* Comments Section */}
      <div
        className={`transition-all duration-500 ease-in-out overflow-hidden ${showComments ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'
          }`}
      >
        <div className="border-t border-slate-700/50 pt-6">
          {/* Add Comment Form */}
          {user ? (
            <form onSubmit={handleCommentSubmit} className="mb-6">
              <div className="flex gap-4">
                {/* User Avatar */}
                <div className="flex-shrink-0">
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.firstName}
                      className="w-10 h-10 rounded-full object-cover border-2 border-slate-600 shadow-lg"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white font-bold text-sm shadow-lg">
                      {getUserInitials(user?.firstName)}
                    </div>
                  )}
                </div>

                {/* Comment Input */}
                <div className="flex-1">
                  <textarea
                    ref={commentInputRef}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Share your thoughts, approach, or ask questions about this problem..."
                    className="w-full px-4 py-3 bg-slate-800/80 border border-slate-600 rounded-xl text-slate-100 placeholder-slate-400 resize-none focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all duration-200 backdrop-blur-sm"
                    rows={3}
                    maxLength={1000}
                  />
                  <div className="flex justify-between items-center mt-3">
                    <span className="text-xs text-slate-500">
                      💡 Press Enter to submit, Shift+Enter for new line
                    </span>
                    <button
                      type="submit"
                      disabled={!newComment.trim() || isSubmittingComment}
                      className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:from-cyan-600 hover:to-blue-600 transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-cyan-500/25"
                    >
                      {isSubmittingComment ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          Posting...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                          </svg>
                          Post Comment
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          ) : (
            <div className="mb-6 p-4 bg-slate-800/50 border border-slate-700 rounded-xl text-center">
              <p className="text-slate-400 mb-3">Join the discussion!</p>
              <button
                onClick={() => window.location.href = '/login'}
                className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg font-medium hover:from-cyan-600 hover:to-blue-600 transition-all duration-200"
              >
                Login to Comment
              </button>
            </div>
          )}

          {/* Comments List - ONLY REAL COMMENTS */}
          <div className="space-y-4 max-h-96 overflow-y-auto custom-scrollbar">
            {comments.length > 0 ? (
              comments.map((comment) => (
                <div
                  key={comment.id}
                  className="flex gap-4 p-5 bg-gradient-to-r from-slate-800/60 to-slate-700/60 backdrop-blur-sm rounded-xl border border-slate-700/50 hover:border-slate-600/50 transition-all duration-300 hover:shadow-lg"
                >
                  {/* Comment Avatar */}
                  <div className="flex-shrink-0">
                    {comment.avatar ? (
                      <img
                        src={comment.avatar}
                        alt={comment.username}
                        className="w-9 h-9 rounded-full object-cover border border-slate-600 shadow-md"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white font-bold text-xs shadow-md">
                        {getUserInitials(comment.username)}
                      </div>
                    )}
                  </div>

                  {/* Comment Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-slate-200">{comment.username}</span>
                        <span className="text-xs text-slate-500 bg-slate-700/50 px-2 py-1 rounded-full">
                          {formatTimeAgo(comment.timestamp)}
                        </span>
                      </div>

                      {/* Delete button for own comments or admin */}
                      {user && (user._id === comment.userId || user.role === 'admin') && (
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="text-xs text-red-400 hover:text-red-300 transition-colors duration-200"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                    <div className="text-slate-300 text-sm leading-relaxed break-words mb-3">
                      {formatCommentText(comment.text)}
                    </div>

                    {/* Comment Actions */}
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => handleCommentLike(comment.id, comment.likes)}
                        className={`flex items-center gap-1 text-xs transition-colors duration-200 ${comment.isLikedByUser
                          ? 'text-red-400 hover:text-red-300'
                          : 'text-slate-500 hover:text-red-400'
                          }`}
                      >
                        <svg
                          className="w-3 h-3"
                          fill={comment.isLikedByUser ? 'currentColor' : 'none'}
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        {comment.likes || 0}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 bg-slate-700/50 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <div className="text-slate-400 mb-2 font-medium">No comments yet</div>
                <p className="text-slate-500 text-sm">Be the first to share your approach or ask a question!</p>
              </div>
            )}
          </div>
        </div>
      </div>
{/* 
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(51, 65, 85, 0.3);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(100, 116, 139, 0.5);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(100, 116, 139, 0.7);
        }
      `}</style> */}
    </div>
  );
};

export default ProblemInteraction;
