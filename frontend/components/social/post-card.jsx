"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { useData } from "@/lib/data-store"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Heart, MessageCircle, Share2, MoreHorizontal, Sparkles, ShieldCheck, Zap, Globe } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"

export function PostCard({ post }) {
    const { user } = useAuth()
    const { likePost, addComment } = useData()
    const [showComments, setShowComments] = useState(false)
    const [commentText, setCommentText] = useState("")

    const isLiked = post.likes?.includes(user?.id || user?._id)
    const [isLiking, setIsLiking] = useState(false)

    const handleLike = () => {
        setIsLiking(true)
        likePost(post.id, user.id || user._id)
        setTimeout(() => setIsLiking(false), 500)
    }

    const handleAddComment = (e) => {
        if (e.key === "Enter" && commentText.trim()) {
            addComment(post.id, {
                content: commentText,
                authorId: user.id || user._id,
                authorName: user.name,
                authorAvatar: user.avatar,
            })
            setCommentText("")
        }
    }

    const getInitials = (name) => {
        if (!name) return "UN"
        return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden group transition-all duration-300">
            {/* Header */}
            <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border-none shadow-sm">
                        <AvatarImage src={post.authorAvatar} />
                        <AvatarFallback className="bg-slate-200 text-slate-600 font-bold">
                            {post.authorName?.charAt(0)}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <h4 className="text-sm font-bold text-slate-900 leading-tight hover:underline cursor-pointer">{post.authorName}</h4>
                        <div className="flex items-center gap-1 mt-0.5">
                            <span className="text-xs text-slate-500">
                                {formatDistanceToNow(new Date(post.createdAt || Date.now()), { addSuffix: true })}
                            </span>
                            <span className="text-slate-400 text-xs">•</span>
                            <Globe className="w-3 h-3 text-slate-400" />
                        </div>
                    </div>
                </div>
                <button className="h-8 w-8 flex items-center justify-center text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
                    <MoreHorizontal className="w-5 h-5" />
                </button>
            </div>

            {/* Content */}
            <div className="px-4 pb-3">
                <p className="text-slate-900 text-[15px] leading-normal whitespace-pre-wrap">
                    {post.content}
                </p>

                {post.image && (
                    <div className="mt-3 -mx-4 border-y border-slate-100">
                        <img src={post.image} alt="Post content" className="w-full h-auto object-cover max-h-[500px]" />
                    </div>
                )}
            </div>

            {/* Stats */}
            {(post.likes?.length > 0 || post.comments?.length > 0) && (
                <div className="px-4 py-2 flex items-center justify-between text-slate-500 text-sm border-b border-slate-100 mx-4">
                    <div className="flex items-center gap-1">
                        {post.likes?.length > 0 && (
                            <div className="flex items-center">
                                <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center text-white shrink-0">
                                    <Heart className="w-2.5 h-2.5 fill-current" />
                                </div>
                                <span className="ml-1.5 hover:underline cursor-pointer">{post.likes.length}</span>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        {post.comments?.length > 0 && (
                            <span className="hover:underline cursor-pointer">{post.comments.length} comments</span>
                        )}
                        <span className="hover:underline cursor-pointer">0 shares</span>
                    </div>
                </div>
            )}

            {/* Interactions */}
            <div className="px-4 py-1 flex items-center gap-1">
                <button
                    onClick={handleLike}
                    className={cn(
                        "flex-1 flex items-center justify-center gap-2 h-9 rounded-lg transition-colors font-semibold text-sm",
                        isLiked ? "text-blue-600" : "text-slate-600 hover:bg-slate-100"
                    )}
                >
                    <Heart className={cn("w-5 h-5", isLiked && "fill-current")} />
                    <span>Like</span>
                </button>

                <button
                    onClick={() => setShowComments(!showComments)}
                    className="flex-1 flex items-center justify-center gap-2 h-9 rounded-lg hover:bg-slate-100 transition-colors text-slate-600 font-semibold text-sm"
                >
                    <MessageCircle className="w-5 h-5" />
                    <span>Comment</span>
                </button>

                <button className="flex-1 flex items-center justify-center gap-2 h-9 rounded-lg hover:bg-slate-100 transition-colors text-slate-600 font-semibold text-sm">
                    <Share2 className="w-5 h-5" />
                    <span>Share</span>
                </button>
            </div>

            {/* Comment Section */}
            {showComments && (
                <div className="px-4 pb-4 pt-2 border-t border-slate-100 bg-white">
                    <div className="space-y-3 mb-4">
                        {post.comments?.map((comment) => (
                            <div key={comment.id} className="flex gap-2">
                                <Avatar className="h-8 w-8 shadow-sm shrink-0">
                                    <AvatarImage src={comment.authorAvatar} />
                                    <AvatarFallback className="bg-slate-200 text-slate-600 text-[10px] font-bold">
                                        {comment.authorName?.charAt(0)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 bg-slate-100 px-3 py-2 rounded-2xl">
                                    <p className="text-xs font-bold text-slate-900 hover:underline cursor-pointer">{comment.authorName}</p>
                                    <p className="text-sm text-slate-800 leading-snug">{comment.content}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex gap-2">
                        <Avatar className="h-8 w-8 shadow-sm shrink-0">
                            <AvatarImage src={user?.avatar} />
                            <AvatarFallback className="bg-slate-200 text-slate-600 text-[10px] font-bold">
                                {user?.name?.charAt(0)}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 relative">
                            <input
                                type="text"
                                placeholder="Write a comment..."
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                onKeyDown={handleAddComment}
                                className="w-full pl-4 pr-10 bg-slate-100 border-none h-9 rounded-full text-sm placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-100"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

