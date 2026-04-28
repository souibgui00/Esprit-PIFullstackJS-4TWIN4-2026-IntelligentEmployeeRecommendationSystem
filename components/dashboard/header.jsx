"use client"

import { useEffect } from "react"
import { Bell, Search, CheckCheck, User, LogOut, Settings, Menu, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { useData } from "@/lib/data-store"
import { useAuth } from "@/lib/auth-context"
import { useNavigate } from "react-router-dom"
import { cn, getInitials } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useLayout } from "@/lib/layout-context"
import { toast } from "sonner"

export function DashboardHeader({ title = "Dashboard", description, children }) {
  const {
    getNotificationsForUser,
    getUnreadCount,
    markNotificationRead,
    markAllNotificationsRead,
    subscribeToNotifications,
    fetchNotifications,
    fetchAssignments,
    fetchActivities,
    deleteNotification,
  } = useData()
  const { user, logout } = useAuth()
  const { toggleSidebar } = useLayout()
  const navigate = useNavigate()
  const currentUserId = user?.id || user?._id
  const notifications = currentUserId ? getNotificationsForUser(currentUserId) : []
  const unreadCount = currentUserId ? getUnreadCount(currentUserId) : 0

  useEffect(() => {
    if (!currentUserId) return

    const unsubscribe = subscribeToNotifications((notif) => {
      const recipient = notif?.recipientId || notif?.userId
      if (recipient && String(recipient) !== String(currentUserId)) {
        return
      }

      toast.success(notif?.title || "New notification", {
        description: notif?.message || "A new update is available.",
      })

      // CRITICAL: Force background refresh of all relevant stores to avoid manual reload
      setTimeout(() => {
        fetchNotifications()
        fetchActivities()
        fetchAssignments()
      }, 500)

      if (String(notif?.type || "").toLowerCase() === "recommendations_received") {
        fetchAssignments()
      }
    })

    return unsubscribe
  }, [currentUserId, subscribeToNotifications, fetchNotifications, fetchActivities, fetchAssignments])

  const handleNotificationClick = (notif) => {
    markNotificationRead(notif.id)

    if (notif.metadata && notif.metadata.activityId) {
      const role = (user?.role || "").toLowerCase()
      const type = String(notif.type || "").toLowerCase()
      
      // EXPLICIT ROUTING MATRIX
      if (type === 'activity_rejected') {
        // REJECTION -> Take them to Edit to fix based on feedback
        navigate(`/${role}/activities/edit/${notif.metadata.activityId}`)
      } else if (type === 'activity_approved' || type === 'activity_created') {
        // APPROVAL or NEW -> Take them to the finalized details
        navigate(`/${role}/activities/details/${notif.metadata.activityId}`)
      } else {
        // FALLBACK
        navigate(`/${role}/activities/details/${notif.metadata.activityId}`)
      }
      return;
    }

    if (notif.link) navigate(notif.link)
  }

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  const handleProfileClick = () => {
    const role = (user?.role || "").toLowerCase()
    navigate(`/${role}/profile`)
  }

  return (
    <header className="sticky top-0 z-30 flex h-24 items-center justify-between border-t-4 border-t-[#F28C1B] border-b border-slate-100 bg-white/90 backdrop-blur-xl px-4 md:px-10 shadow-sm shrink-0" role="banner">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          aria-label="Toggle sidebar"
          className="lg:hidden text-slate-600 hover:text-orange-500 hover:bg-orange-50 rounded-xl"
        >
          <Menu className="h-6 w-6" />
        </Button>
        <div className="flex flex-col gap-0.5">
          <h2 className="text-[#2C2C2C] font-display text-lg md:text-2xl tracking-tighter font-black leading-tight m-0 truncate max-w-[150px] md:max-w-none uppercase">
            {title}
          </h2>
          {description && (
            <p className="text-slate-400 text-[10px] md:text-[11px] font-bold tracking-[0.2em] m-0 truncate max-w-[150px] md:max-w-none uppercase opacity-80">
              {description}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-6">



        <div className="flex items-center gap-3">
          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open notifications" className="relative h-12 w-12 text-slate-500 hover:bg-slate-50 hover:text-[#1E5FA8] rounded-2xl transition-all group">
                <Bell className="h-6 w-6 group-hover:scale-110 transition-transform" />
                {unreadCount > 0 && (
                  <span className="absolute top-3 right-3 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#F28C1B] text-[8px] font-black text-white border-2 border-white shadow-lg">
                    {unreadCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-96 bg-white border border-slate-200 rounded-2xl mt-4 shadow-2xl p-0 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between p-5 bg-slate-50/50 border-b border-slate-100">
                <DropdownMenuLabel className="text-xs font-bold text-slate-900 tracking-widest">Notifications</DropdownMenuLabel>
                {unreadCount > 0 && currentUserId && (
                  <Button
                    variant="ghost"
                    size="sm"
                      aria-label="Archive all notifications"
                    className="h-8 text-[11px] font-bold text-orange-600 hover:bg-orange-50 hover:text-orange-700 rounded-lg px-3"
                    onClick={() => markAllNotificationsRead(currentUserId)}
                  >
                    <CheckCheck className="mr-2 h-3.5 w-3.5" />
                    Archive All
                  </Button>
                )}
              </div>
              <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                {notifications.length === 0 ? (
                  <div className="py-16 text-center">
                    <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCheck className="w-6 h-6 text-slate-300" />
                    </div>
                    <p className="text-sm text-slate-400 font-medium px-8 ">No new notifications</p>
                  </div>
                ) : (
                  notifications.slice(0, 10).map((notif) => (
                    <DropdownMenuItem
                      key={notif.id}
                      className={cn(
                        "flex items-start gap-3 p-5 cursor-pointer border-b border-slate-100 last:border-0 hover:bg-orange-50/50 focus:bg-orange-50/50 transition-all outline-none group relative",
                        !notif.read && "bg-orange-500/[0.03]"
                      )}
                      onClick={() => handleNotificationClick(notif)}
                    >
                      <div className="flex items-start gap-4 w-full">
                        {!notif.read && (
                          <div className="mt-1.5 h-2.5 w-2.5 rounded-full bg-orange-500 shrink-0 shadow-lg" />
                        )}
                        <div className={cn("flex-1", notif.read && "pl-6")}>
                          <span className="font-bold text-sm text-slate-900 block mb-1">{notif.title}</span>
                          <span className="text-xs text-slate-500 block leading-relaxed line-clamp-2 font-medium">
                            {notif.message}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Delete notification: ${notif.title}`}
                          className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all ml-auto hover:scale-110"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notif.id);
                            toast.info("Notification deleted");
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </DropdownMenuItem>
                  ))
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Profile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" aria-label={`Open user menu for ${user?.name || "current user"}`} className="flex items-center p-0 h-12 w-12 rounded-2xl hover:bg-slate-50 border border-slate-100 hover:border-[#1E5FA8]/30 transition-all group overflow-hidden shadow-sm">
                <Avatar className="h-full w-full rounded-2xl">
                  <AvatarImage src={user?.avatar} />
                  <AvatarFallback className="bg-slate-100 text-[#1E5FA8] text-[10px] font-black rounded-2xl">
                    {getInitials(user?.name)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 bg-white border border-slate-200 rounded-2xl mt-4 shadow-2xl p-2 animate-in fade-in zoom-in-95 duration-200">
              <div className="px-4 py-5 border-b border-slate-50 bg-slate-50/30 rounded-t-xl mb-1">
                <p className="text-xs font-bold text-orange-500 tracking-widest uppercase mb-1">ID: {user?.matricule || user?.id || 'N/A'}</p>
                <p className="text-[11px] text-slate-500 font-medium truncate m-0">{user?.email}</p>
              </div>
              <div className="py-1">
                <DropdownMenuItem onClick={handleProfileClick} className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 rounded-xl hover:bg-orange-50 hover:text-orange-600 cursor-pointer focus:bg-orange-50 focus:text-orange-600 outline-none transition-all font-medium">
                  <User className="w-4.5 h-4.5 opacity-60" />
                  Personal Profile
                </DropdownMenuItem>

                {(user?.role?.toLowerCase() === "admin" || user?.role?.toLowerCase() === "hr") && (
                  <DropdownMenuItem
                    onClick={() => {
                      const role = (user?.role || "").toLowerCase()
                      navigate(`/${role}/settings`)
                    }}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 rounded-xl hover:bg-orange-50 hover:text-orange-600 cursor-pointer focus:bg-orange-50 focus:text-orange-600 outline-none transition-all font-medium"
                  >
                    <Settings className="w-4.5 h-4.5 opacity-60" />
                    System Settings
                  </DropdownMenuItem>
                )}
              </div>
              <DropdownMenuSeparator className="bg-slate-100 mx-1 my-1" />
              <div className="py-1">
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-rose-600 rounded-xl hover:bg-rose-50 cursor-pointer focus:bg-rose-50 outline-none transition-all font-bold"
                >
                  <LogOut className="w-4.5 h-4.5 transition-transform group-hover:-translate-x-1" />
                  Sign Out
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}

export const Header = DashboardHeader

