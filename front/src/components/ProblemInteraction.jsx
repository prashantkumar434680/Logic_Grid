import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';

const ProblemInteraction = ({ problemId }) => {
    const { user } = useSelector((state) => state.auth);
    const [isLiked, setIsLiked] = useState(false);
    const [likesCount, setLikesCount] = useState(0);
    const [commentsCount, setCommentsCount] = useState(0);
    const [showComments, setShowComments] = useState(false);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);
    const commentInputRef = useRef(null);

    // Dummy data - replace with actual API calls
    useEffect(() => {
        // Simulate fetching likes and comments data
        const fetchData = () => {
            // Mock data
            setLikesCount(Math.floor(Math.random() * 100) + 10);
            setCommentsCount(Math.floor(Math.random() * 20) + 3);
            setIsLiked(Math.random() > 0.5);

            // Mock comments
            const mockComments = [
                {
                    id: 1,
                    username: 'CodeMaster',
                    avatar: null,
                    text: 'Great problem! The dynamic programming approach works well here.',
                    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
                },
                {
                    id: 2,
                    username: 'AlgoExpert',
                    avatar: null,
                    text: 'I solved this using a greedy approach. Time complexity is O(n log n).',
                    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
                },
                {
                    id: 3,
                    username: 'DevNinja',
                    avatar: null,
                    text: 'The edge cases in this problem are tricky. Make sure to handle empty arrays!',
                    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
                },
            ];
            setComments(mockComments);
        };

        fetchData();
    }, [problemId]);

    const handleLike = () => {
        if (!user) {
            alert('Please login to like problems');
            return;
        }

        // Optimistic update
        setIsLiked(!isLiked);
        setLikesCount(prev => isLiked ? prev - 1 : prev + 1);

        // TODO: Make API call to backend
        // axiosClient.post(`/problem/${problemId}/like`)
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
            // Create new comment object
            const comment = {
                id: Date.now(),
                username: user.firstName || 'Anonymous',
                avatar: user.avatar || null,
                text: newComment.trim(),
                timestamp: new Date(),
            };

            // Optimistic update
            setComments(prev => [comment, ...prev]);
            setCommentsCount(prev => prev + 1);
            setNewComment('');

            // TODO: Make API call to backend
            // await axiosClient.post(`/problem/${problemId}/comment`, { text: newComment });

        } catch (error) {
            console.error('Failed to post comment:', error);
            // Revert optimistic update on error
            setComments(prev => prev.slice(1));
            setCommentsCount(prev => prev - 1);
        } finally {
            setIsSubmittingComment(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleCommentSubmit(e);
        }
    };

    const formatTimeAgo = (timestamp) => {
        const now = new Date();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / (1000 * 60));
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        return `${days} day${days > 1 ? 's' : ''} ago`;
    };

    const getUserInitials = (username) => {
        return username?.charAt(0)?.toUpperCase() || 'U';
    };

    return (
        <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-6 mt-6">
            {/* Like and Comment Buttons */}
            <div className="flex items-center gap-6 mb-6">
                {/* Like Button */}
                <button
                    onClick={handleLike}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 transform hover:scale-105 ${isLiked
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : 'bg-slate-700/50 text-slate-300 border border-slate-600 hover:bg-slate-700 hover:text-red-400'
                        }`}
                >
                    <svg
                        className={`w-5 h-5 transition-all duration-200 ${isLiked ? 'fill-current scale-110' : ''}`}
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
                    <span className="font-medium">{likesCount}</span>
                    <span className="text-sm">Like{likesCount !== 1 ? 's' : ''}</span>
                </button>

                {/* Comment Button */}
                <button
                    onClick={handleCommentToggle}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 transform hover:scale-105 ${showComments
                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                        : 'bg-slate-700/50 text-slate-300 border border-slate-600 hover:bg-slate-700 hover:text-cyan-400'
                        }`}
                >
                    <svg
                        className="w-5 h-5"
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
                    <span className="font-medium">{commentsCount}</span>
                    <span className="text-sm">Comment{commentsCount !== 1 ? 's' : ''}</span>
                </button>
            </div>

            {/* Comments Section */}
            <div
                className={`transition-all duration-300 ease-in-out overflow-hidden ${showComments ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
                    }`}
            >
                <div className="border-t border-slate-700 pt-6">
                    {/* Add Comment Form */}
                    <form onSubmit={handleCommentSubmit} className="mb-6">
                        <div className="flex gap-3">
                            {/* User Avatar */}
                            <div className="flex-shrink-0">
                                {user?.avatar ? (
                                    <img
                                        src={user.avatar}
                                        alt={user.firstName}
                                        className="w-10 h-10 rounded-full object-cover border-2 border-slate-600"
                                    />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white font-bold text-sm">
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
                                    onKeyPress={handleKeyPress}
                                    placeholder="Share your thoughts about this problem..."
                                    className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-400 resize-none focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all duration-200"
                                    rows={3}
                                />
                                <div className="flex justify-between items-center mt-3">
                                    <span className="text-xs text-slate-500">
                                        Press Enter to submit, Shift+Enter for new line
                                    </span>
                                    <button
                                        type="submit"
                                        disabled={!newComment.trim() || isSubmittingComment}
                                        className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:from-cyan-600 hover:to-blue-600 transition-all duration-200 flex items-center gap-2"
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

                    {/* Comments List */}
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                        {comments.length > 0 ? (
                            comments.map((comment) => (
                                <div key={comment.id} className="flex gap-3 p-4 bg-slate-800/50 rounded-lg border border-slate-700/50 hover:border-slate-600/50 transition-colors duration-200">
                                    {/* Comment Avatar */}
                                    <div className="flex-shrink-0">
                                        {comment.avatar ? (
                                            <img
                                                src={comment.avatar}
                                                alt={comment.username}
                                                className="w-8 h-8 rounded-full object-cover border border-slate-600"
                                            />
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white font-bold text-xs">
                                                {getUserInitials(comment.username)}
                                            </div>
                                        )}
                                    </div>

                                    {/* Comment Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-medium text-slate-200">{comment.username}</span>
                                            <span className="text-xs text-slate-500">
                                                {formatTimeAgo(comment.timestamp)}
                                            </span>
                                        </div>
                                        <p className="text-slate-300 text-sm leading-relaxed break-words">
                                            {comment.text}
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8">
                                <div className="text-slate-400 mb-2">No comments yet</div>
                                <p className="text-slate-500 text-sm">Be the first to share your thoughts!</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProblemInteraction;