"use client"

import { useState, useEffect } from "react"
import { useNavigate, useLocation, Link } from "react-router-dom"
import { useAuth } from "@/lib/auth-context"
import { useData } from "@/lib/data-store"
import { cn } from "@/lib/utils"
import {
    Bell,
    Search,
    CheckCheck,
    User,
    LogOut,
    Brain,
    LayoutDashboard,
    Users,
    Calendar,
    Target,
    TrendingUp,
    Menu,
    X,
    ChevronDown,
    Sparkles
} from "lucide-react"
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function EmployeeNavigation() {
    const { user, logout } = useAuth()
    const { getNotificationsForUser, getUnreadCount, markNotificationRead, markAllNotificationsRead } = useData()
    const navigate = useNavigate()
    const location = useLocation()
    const [isScrolled, setIsScrolled] = useState(false)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const showSolidNav = isScrolled || location.pathname !== "/employee"

    const notifications = user ? getNotificationsForUser(user.id) : []
    const unreadCount = user ? getUnreadCount(user.id) : 0

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20)
        }
        window.addEventListener("scroll", handleScroll)
        return () => window.removeEventListener("scroll", handleScroll)
    }, [])

    const navItems = [
        { name: "My feed", href: "/employee", icon: LayoutDashboard },
        { name: "Social hub", href: "/employee/hub", icon: Users },
        { name: "Learning center", href: "/employee/activities", icon: Calendar },
        { name: "Career path", href: "/employee/recommendations", icon: Target },
        { name: "Achievements", href: "/employee/progress", icon: TrendingUp },
    ]

    const handleLogout = () => {
        logout()
        navigate("/login")
    }

    const getInitials = (name) => {
        return name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "U"
    }

    return (
        <header
            className={cn(
                "fixed top-0 left-0 right-0 z-50 transition-all duration-300 py-3",
                showSolidNav
                    ? "bg-white/90 backdrop-blur-xl border-b border-slate-100 shadow-[0_4px_30px_-10px_rgba(0,0,0,0.1)]"
                    : "bg-transparent"
            )}
        >
            <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
                {/* Logo and Brand */}
                <div className="flex items-center gap-10">
                    <Link to="/employee" className="flex items-center gap-3 group">
                        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 group-hover:rotate-6 transition-transform">
                            <Brain className="w-5 h-5 text-white" />
                        </div>
                        <div className="hidden md:flex flex-col">
                            <span className={cn(
                                "text-lg font-bold tracking-tight leading-none transition-colors",
                                showSolidNav ? "text-slate-900" : "text-white"
                            )}>
                                Maghrebia
                            </span>
                            <span className={cn(
                                "text-[9px] font-semibold tracking-widest mt-1",
                                showSolidNav ? "text-primary/80" : "text-white/70"
                            )}>
                                Global talent portal
                            </span>
                        </div>
                    </Link>

                    {/* Desktop Nav */}
                    <nav className="hidden lg:flex items-center gap-1" aria-label="Employee navigation">
                        {navItems.map((item) => {
                            const isActive = location.pathname === item.href
                            return (
                                <Link
                                    key={item.name}
                                    to={item.href}
                                    className={cn(
                                        "px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 relative group tracking-medium",
                                        isActive
                                            ? "text-primary bg-primary/5"
                                            : showSolidNav ? "text-slate-600 hover:text-accent-blue hover:bg-slate-50" : "text-white/80 hover:text-white"
                                    )}
                                >
                                    {item.name}
                                    {isActive && (
                                        <div className="absolute bottom-0 left-4 right-4 h-1 bg-primary rounded-full" />
                                    )}
                                </Link>
                            )
                        })}
                    </nav>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-3">
                    {/* Search Bar - Coursera Style */}
                    <div className="hidden md:flex relative group ml-4">
                        <Search className={cn(
                            "absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors",
                            showSolidNav ? "text-slate-600" : "text-white/60"
                        )} />
                                 <Input
                                     aria-label="Search learning content"
                            placeholder="What do you want to learn?"
                            className={cn(
                                "w-64 pl-11 rounded-full border-none transition-all duration-300",
                                showSolidNav
                                    ? "bg-slate-100 focus:bg-white focus:ring-4 focus:ring-accent-blue/10 w-80 shadow-inner text-slate-900 placeholder:text-slate-400"
                                    : "bg-white/10 text-white placeholder:text-white/40 focus:bg-white/20 w-80"
                            )}
                        />
                    </div>

                    {/* Notifications */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                aria-label="Open notifications"
                                className={cn(
                                    "relative h-11 w-11 rounded-full transition-all",
                                    showSolidNav ? "text-slate-900 hover:bg-orange-50 hover:text-orange-600" : "text-white hover:bg-white/10"
                                )}
                            >
                                <Bell className="h-5 w-5 stroke-[2.5]" />
                                {unreadCount > 0 && (
                                    <span className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-accent-blue text-[10px] font-black text-white flex items-center justify-center border-2 border-white animate-pulse shadow-lg shadow-blue-500/20">
                                        {unreadCount}
                                    </span>
                                )}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-80 p-0 border-none rounded-2xl shadow-2xl overflow-hidden mt-2">
                            <div className="bg-[#2C2C2C] px-5 py-4 flex items-center justify-between">
                                <span className="text-[10px] font-black text-primary tracking-widest">Notifications / alerts</span>
                                {unreadCount > 0 && (
                                    <button
                                        type="button"
                                        aria-label="Mark all notifications as read"
                                        onClick={() => markAllNotificationsRead(user.id)}
                                        className="text-[10px] font-bold text-white/40 hover:text-primary transition-colors"
                                    >
                                        Mark all as read
                                    </button>
                                )}
                            </div>
                            <div className="max-h-96 overflow-y-auto">
                                {notifications.length === 0 ? (
                                    <div className="p-8 text-center text-slate-400 text-sm italic">
                                        All caught up! No new notifications.
                                    </div>
                                ) : notifications.slice(0, 5).map(notif => (
                                    <button
                                        key={notif.id}
                                        type="button"
                                        onClick={() => markNotificationRead(notif.id)}
                                        aria-label={`Read notification: ${notif.title}`}
                                        className={cn(
                                            "w-full text-left p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors",
                                            !notif.read && "bg-primary/3"
                                        )}
                                    >
                                        <p className="text-xs font-bold text-slate-900">{notif.title}</p>
                                        <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{notif.message}</p>
                                    </button>
                                ))}
                            </div>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* User Profile */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button type="button" aria-label={`Open profile menu for ${user?.name || "current user"}`} className="flex items-center gap-2 group outline-none">
                                <Avatar className="h-10 w-10 border-2 border-transparent group-hover:border-accent-blue transition-all">
                                    <AvatarImage src={user?.avatar} />
                                    <AvatarFallback className="bg-accent-blue text-white font-bold">{getInitials(user?.name)}</AvatarFallback>
                                </Avatar>
                                <ChevronDown className={cn(
                                    "w-4 h-4 transition-all group-hover:translate-y-0.5",
                                    showSolidNav ? "text-slate-900" : "text-white"
                                )} />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-72 p-0 border-slate-100 rounded-3xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] mt-4 overflow-hidden animate-in fade-in zoom-in-95 duration-300">
                            {/* Premium User Header */}
                            <div className="relative p-6 overflow-hidden">
                                <div className="absolute inset-0 bg-linear-to-br from-[#0F172A] via-[#1E293B] to-[#0F172A]" />
                                <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl -mr-16 -mt-16" />

                                <div className="relative flex items-center gap-4 mb-4">
                                    <Avatar className="h-12 w-12 border-2 border-primary/30 ring-4 ring-primary/5 shadow-2xl">
                                        <AvatarImage src={user?.avatar} />
                                        <AvatarFallback className="bg-primary text-white font-black">{getInitials(user?.name)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col min-w-0">
                                        <p className="text-white font-black text-sm tracking-tight truncate leading-tight">{user?.name}</p>
                                        <p className="text-primary font-bold text-[10px] tracking-[0.2em] mt-1 shrink-0">{(user?.role || "employee").charAt(0).toUpperCase() + (user?.role || "employee").slice(1).toLowerCase()}</p>
                                        {user?.email && <p className="text-white/40 text-[9px] font-medium truncate mt-0.5">{user?.email}</p>}
                                    </div>
                                </div>

                                {/* Status / Skill Progress Mini Chart */}
                                <div className="relative space-y-2 py-3 px-4 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[9px] font-black text-slate-400 tracking-widest">Skill progress</span>
                                        <span className="text-[10px] font-black text-orange-400">84%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                        <div className="h-full w-[84%] bg-linear-to-r from-primary to-orange-400 rounded-full shadow-[0_0_12px_rgba(242,140,27,0.4)]" />
                                    </div>
                                </div>
                            </div>

                            {/* Menu Actions */}
                            <div className="p-3 bg-white">
                                <div className="space-y-1">
                                    <DropdownMenuItem onClick={() => navigate("/employee/profile")} className="flex items-center gap-3 px-4 py-3.5 text-xs font-black text-slate-600 tracking-widest rounded-2xl hover:bg-slate-50 hover:text-accent-blue transition-all cursor-pointer group outline-none border border-transparent hover:border-accent-blue/20">
                                        <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center group-hover:bg-blue-50 group-hover:scale-110 transition-all shadow-sm">
                                            <User className="w-4 h-4 text-slate-400 group-hover:text-accent-blue" />
                                        </div>
                                        My profile
                                    </DropdownMenuItem>

                                    <DropdownMenuItem onClick={() => navigate("/employee/progress")} className="flex items-center gap-3 px-4 py-3.5 text-xs font-black text-slate-600 tracking-widest rounded-2xl hover:bg-slate-50 hover:text-accent-blue transition-all cursor-pointer group outline-none border border-transparent hover:border-accent-blue/20">
                                        <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center group-hover:bg-blue-50 group-hover:scale-110 transition-all shadow-sm">
                                            <Sparkles className="w-4 h-4 text-slate-400 group-hover:text-accent-blue" />
                                        </div>
                                        My achievements
                                    </DropdownMenuItem>
                                </div>

                                <DropdownMenuSeparator className="bg-slate-100 my-2 mx-2" />

                                <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-3 px-4 py-3.5 text-xs font-black text-rose-600 tracking-widest rounded-2xl hover:bg-rose-50 transition-all cursor-pointer group outline-none border border-transparent hover:border-rose-100">
                                    <div className="w-9 h-9 rounded-xl bg-rose-100 flex items-center justify-center group-hover:bg-rose-200 group-hover:scale-110 transition-all shadow-sm">
                                        <LogOut className="w-4 h-4" />
                                    </div>
                                    Sign out
                                </DropdownMenuItem>
                            </div>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Mobile Toggle */}
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
                        aria-expanded={mobileMenuOpen}
                        aria-controls="employee-mobile-menu"
                        className={cn(
                            "lg:hidden flex items-center justify-center h-11 w-11 rounded-full transition-all",
                            isScrolled ? "text-slate-600 bg-slate-100" : "text-white bg-white/10"
                        )}
                    >
                        {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>
            </div>

            {/* Mobile Nav Overlay */}
            <div
                id="employee-mobile-menu"
                role="dialog"
                aria-label="Employee navigation menu"
                aria-hidden={!mobileMenuOpen}
                className={cn(
                    "fixed inset-0 bg-white z-[-1] lg:hidden transition-all duration-500 flex flex-col p-8 pt-24",
                    mobileMenuOpen ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-full pointer-events-none"
                )}
            >
                <div className="space-y-4">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.href
                        return (
                            <Link
                                key={item.name}
                                to={item.href}
                                onClick={() => setMobileMenuOpen(false)}
                                className={cn(
                                    "flex items-center gap-4 p-4 rounded-2xl text-lg font-bold transition-all",
                                    isActive ? "bg-orange-50 text-orange-600" : "text-slate-600 active:bg-slate-50"
                                )}
                            >
                                <item.icon className={cn("w-6 h-6", isActive ? "text-orange-500" : "text-slate-400")} />
                                {item.name}
                            </Link>
                        )
                    })}
                </div>
                <div className="mt-auto border-t border-slate-100 pt-8">
                    <Button
                        variant="outline"
                        className="w-full h-14 rounded-2xl text-rose-600 border-rose-100 hover:bg-rose-50 font-bold tracking-widest text-xs"
                        onClick={handleLogout}
                    >
                        <LogOut className="w-4 h-4 mr-2" />
                        Sign out
                    </Button>
                </div>
            </div>
        </header>
    )
}
