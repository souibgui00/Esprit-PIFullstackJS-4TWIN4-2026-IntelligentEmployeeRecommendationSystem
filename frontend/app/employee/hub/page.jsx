"use client"

import { useEffect, useState } from "react"
import { useData } from "@/lib/data-store"
import { useAuth } from "@/lib/auth-context"
import { CreatePost } from "@/components/social/create-post"
import { PostCard } from "@/components/social/post-card"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
    Users,
    Rss,
    Filter,
    Search,
    TrendingUp,
    Award,
    Zap,
    MessageSquareShare,
    Wifi,
    Globe,
    Activity,
    Brain,
    Rocket,
    BarChart3
} from "lucide-react"
import { cn } from "@/lib/utils"

export default function EmployeeHubPage() {
    const { posts, addPost, employees, loading } = useData()
    const { user } = useAuth()
    const [filter, setFilter] = useState("all") // all, achievements, announcements
    const [searchQuery, setSearchQuery] = useState("")

    const filteredPosts = posts.filter(post => {
        const matchesFilter = filter === "all" || post.type === filter
        const matchesSearch = post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
            post.authorName.toLowerCase().includes(searchQuery.toLowerCase())
        return matchesFilter && matchesSearch
    })

  return (
    <div className="min-h-screen bg-[#f0f2f5] pt-20 pb-8 font-sans text-[#1c1e21]">
      <div className="max-w-300 mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Sidebar (Navigation) */}
          <div className="hidden lg:block lg:col-span-3 sticky top-20 space-y-1.5">
            <div className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-slate-200/60 transition-colors cursor-pointer group">
              <Avatar className="h-9 w-9 border-none shadow-sm">
                <AvatarImage src={user?.avatar} />
                <AvatarFallback className="bg-slate-200 text-slate-600 font-bold">{user?.name?.charAt(0)}</AvatarFallback>
              </Avatar>
              <span className="font-semibold text-xs">{user?.name}</span>
            </div>
            
            {[
              { label: "Community Feed", icon: Rss, color: "text-blue-500" },
              { label: "Team Space", icon: Users, color: "text-teal-500" },
              { label: "Achievements", icon: Award, color: "text-orange-500" },
              { label: "Learning Center", icon: Brain, color: "text-purple-500" },
              { label: "Recent activities", icon: Activity, color: "text-rose-500" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-slate-200/60 transition-colors cursor-pointer group">
                <item.icon className={cn("w-5 h-5", item.color)} />
                <span className="font-semibold text-xs">{item.label}</span>
              </div>
            ))}
          </div>

          {/* Center Column (Feed) */}
          <div className="col-span-1 lg:col-span-6 space-y-3">
            {/* Search and Filters merged into a clean bar */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 space-y-3">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search in feed..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 h-9 bg-[#f0f2f5] border-none rounded-full text-xs focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1">
                {[
                  { id: "all", label: "All", icon: Rss },
                  { id: "achievement", label: "Achievements", icon: Award },
                  { id: "announcement", label: "Announcements", icon: Zap },
                  { id: "update", label: "Updates", icon: MessageSquareShare },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setFilter(item.id)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all whitespace-nowrap",
                      filter === item.id
                        ? "bg-blue-50 text-blue-600"
                        : "bg-[#f0f2f5] text-slate-600 hover:bg-slate-200"
                    )}
                  >
                    <item.icon className="w-3.5 h-3.5" />
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3">
              <CreatePost />
            </div>

            {/* Signal Feed */}
            <div className="space-y-3">
              {filteredPosts.length > 0 ? (
                filteredPosts.map((post) => (
                  <div key={post.id}>
                    <PostCard post={post} />
                  </div>
                ))
              ) : (
                <div className="bg-white rounded-xl border border-slate-200 p-10 text-center space-y-3">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
                    <Globe className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">No posts found</h3>
                    <p className="text-sm text-slate-500">Try adjusting your filters or search.</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column (Trends & Suggested) */}
          <div className="hidden lg:block lg:col-span-3 sticky top-20 space-y-3">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 overflow-hidden group">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-600 text-sm">Trending Now</h3>
                <TrendingUp className="w-4 h-4 text-blue-500" />
              </div>

              <div className="space-y-4">
                {[
                  { tag: "Skill Sharing", count: "1.2K Posts", icon: Brain },
                  { tag: "New Projects", count: "842 Posts", icon: Rocket },
                  { tag: "Data Insights", count: "510 Posts", icon: BarChart3 },
                ].map((trend, i) => (
                  <div key={i} className="flex items-center gap-3 cursor-pointer group/trend">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-blue-500 group-hover/trend:bg-blue-500 group-hover/trend:text-white transition-all">
                      <trend.icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">#{trend.tag}</p>
                      <p className="text-[11px] text-slate-500">{trend.count}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 mb-2">Community growth</p>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full w-[72%]"></div>
                </div>
                <p className="text-[10px] text-slate-500 mt-2 text-right">72% of goal reached</p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3">
                <h3 className="font-bold text-slate-600 text-sm mb-4">Suggested Activities</h3>
                <h4 className="text-xs text-slate-400 italic">No recommendations available at the moment.</h4>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
