"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { useData } from "@/lib/data-store"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ImagePlus, Smile, MapPin } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export function CreatePost() {
    const { user } = useAuth()
    const { addPost } = useData()
    const [content, setContent] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!content.trim()) return

        setIsSubmitting(true)
        try {
            addPost({
                content: content.trim(),
                authorId: user.id || user._id,
                authorName: user.name,
                authorAvatar: user.avatar,
                type: "update",
            })
            setContent("")
            toast.success("Post shared successfully", {
                description: "Your update is now visible to the team."
            })
        } catch (error) {
            toast.error("Failed to post")
        } finally {
            setIsSubmitting(false)
        }
    }

    const getInitials = (name) => {
        if (!name) return "UN"
        return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    }

    return (
        <div className="bg-white rounded-xl space-y-3">
            <div className="flex gap-3">
                <Avatar className="h-10 w-10 border-none shadow-sm shrink-0">
                    <AvatarImage src={user?.avatar} />
                    <AvatarFallback className="bg-slate-200 text-slate-600 font-bold">
                        {user?.name?.charAt(0)}
                    </AvatarFallback>
                </Avatar>
                <button
                    type="button"
                    onClick={() => setContent(content || " ")}
                    className="flex-1 bg-[#f0f2f5] hover:bg-slate-200/80 rounded-full px-4 flex items-center text-slate-500 text-sm transition-colors text-left"
                    aria-label="Open post composer"
                >
                    What's on your mind, {user?.name?.split(' ')[0]}?
                </button>
            </div>

            {content !== "" && (
                <div className="pt-2 animate-in fade-in zoom-in-95">
                    <Textarea
                        placeholder={`What's on your mind, ${user?.name?.split(' ')[0]}?`}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="min-h-[120px] bg-white border border-slate-200 rounded-xl p-4 text-slate-900 placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-blue-500 transition-all resize-none text-base"
                    />
                    
                    <div className="flex items-center justify-between mt-3">
                         <div className="flex items-center gap-1">
                            {[
                                { icon: ImagePlus, label: "Photo / video", color: "text-green-500" },
                                { icon: Smile, label: "Feeling / activity", color: "text-yellow-500" },
                                { icon: MapPin, label: "Check in", color: "text-rose-500" }
                            ].map((tool, i) => (
                                <button type="button" key={i} title={tool.label} aria-label={tool.label} className="h-10 px-3 rounded-lg hover:bg-slate-100 flex items-center gap-2 text-slate-500 transition-all">
                                    <tool.icon className={cn("w-5 h-5", tool.color)} />
                                    <span className="text-xs font-semibold hidden md:block">{tool.label}</span>
                                </button>
                            ))}
                        </div>

                        <Button
                            aria-label="Publish post"
                            onClick={handleSubmit}
                            disabled={isSubmitting || !content.trim()}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-9 px-8 rounded-lg disabled:opacity-50 transition-all shadow-sm"
                        >
                            {isSubmitting ? "Posting..." : "Post"}
                        </Button>
                    </div>
                </div>
            )}
            
            {content === "" && (
                 <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    {[
                        { icon: ImagePlus, label: "Photo/video", color: "text-green-500" },
                        { icon: Smile, label: "Feeling/activity", color: "text-yellow-500" },
                        { icon: MapPin, label: "Check in", color: "text-rose-500" }
                    ].map((tool, i) => (
                        <button type="button" key={i} aria-label={tool.label} className="flex-1 flex items-center justify-center gap-2 h-10 rounded-lg hover:bg-slate-100 transition-colors text-slate-600">
                            <tool.icon className={cn("w-5 h-5", tool.color)} />
                            <span className="text-xs font-semibold">{tool.label}</span>
                        </button>
                    ))}
                 </div>
            )}
        </div>
    )
}

