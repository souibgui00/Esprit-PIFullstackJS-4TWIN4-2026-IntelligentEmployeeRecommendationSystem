import { useNavigate, useLocation } from "react-router-dom"
import { useState, useEffect } from "react"
import { useAuth } from "../lib/auth-context"
import { cn } from "../lib/utils"
import {
    Users,
    LayoutDashboard,
    Brain,
    Calendar,
    Target,
    BarChart3,
    Settings,
    LogOut,
    Menu,
    Command,
    Briefcase,
    TrendingUp as TrendingUpIcon,
    User,
    Building,
    Shield
} from "lucide-react"
import { MandatoryCvDialog } from "./auth/mandatory-cv-dialog"
import { EmployeeNavigation } from "./dashboard/employee-navigation"
import { LayoutProvider, useLayout } from "../lib/layout-context"

function PortalLayoutInner({ children, role = "admin" }) {
    const { sidebarOpen, setSidebarOpen, toggleSidebar } = useLayout()
    const [scrolled, setScrolled] = useState(false)
    const navigate = useNavigate()
    const location = useLocation()
    const { user, logout } = useAuth()
    const currentPath = location.pathname

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20)
        }
        window.addEventListener("scroll", handleScroll)
        return () => window.removeEventListener("scroll", handleScroll)
    }, [])

    const config = {
        admin: {
            color: "orange",
            label: "Administration",
            icon: Command,
            nav: [
                { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
                { name: "Departments", href: "/admin/departments", icon: Building },
                { name: "Users", href: "/admin/employees", icon: Users },
                { name: "Activities", href: "/admin/activities", icon: Calendar },
                { name: "Skills", href: "/admin/skills", icon: Brain },
                { name: "Analytics", href: "/admin/analytics", icon: BarChart3 },
                { name: "Activity Logs", href: "/admin/audit", icon: Shield },
            ]
        },
        hr: {
            color: "orange",
            label: "Human Resources",
            icon: Users,
            nav: [
                { name: "Dashboard", href: "/hr", icon: LayoutDashboard },
                { name: "Departments", href: "/hr/departments", icon: Building },
                { name: "Users", href: "/hr/employees", icon: Users },
                { name: "Activities", href: "/hr/activities", icon: Calendar },
                { name: "Skills", href: "/hr/skills", icon: Brain },
                { name: "Recommendations", href: "/hr/recommendations", icon: Target },
                { name: "Analytics", href: "/hr/analytics", icon: BarChart3 },
            ]
        },
        manager: {
            color: "orange",
            label: "Management",
            icon: Briefcase,
            nav: [
                { name: "Overview", href: "/manager", icon: LayoutDashboard },
                { name: "Team", href: "/manager/employees", icon: Users },
                { name: "Activities", href: "/manager/activities", icon: Calendar },
                { name: "Skills", href: "/manager/skills", icon: Brain },
                { name: "Assignments", href: "/manager/assignments", icon: Target },
                { name: "Evaluations", href: "/manager/evaluations", icon: BarChart3 },
            ]
        },
        employee: {
            color: "orange",
            label: "Employee portal",
            icon: Brain,
            nav: [
                { name: "Home", href: "/employee", icon: LayoutDashboard },
                { name: "Hub", href: "/employee/hub", icon: Users },
                { name: "Recommendations", href: "/employee/recommendations", icon: Target },
                { name: "Learning activities", href: "/employee/activities", icon: Calendar },
                { name: "My progress", href: "/employee/progress", icon: TrendingUpIcon },
            ]
        }
    }

    const activeConfig = config[role] || config.admin
    const isEmployee = role === "employee"

    return (
        <div
            data-role={role}
            className={cn(
                "flex text-[#2C2C2C] font-sans transition-colors duration-500",
                !isEmployee && "h-screen overflow-hidden",
                "bg-white"
            )}
        >
            {/* CV Mandatory Dialog - Persistent */}
            <MandatoryCvDialog />
            
            {/* Sidebar Overlay for Mobile */}
            {sidebarOpen && !isEmployee && (
                <div
                    className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
                    onClick={() => setSidebarOpen(false)}
                ></div>
            )}

            {/* Top Navigation for Employees */}
            {isEmployee && <EmployeeNavigation />}

            {/* Sidebar */}
            {!isEmployee && (
                <aside
                    className={cn(
                        "fixed inset-y-0 left-0 z-50 w-72 border-r transform transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) lg:relative lg:translate-x-0",
                        sidebarOpen ? "translate-x-0" : "-translate-x-full lg:w-24",
                        "bg-[#2C2C2C] border-slate-600 shadow-[20px_0_40px_-15px_rgba(0,0,0,0.3)]"
                    )}
                >
                    <div className="flex flex-col h-full overflow-hidden">
                        {/* Logo Section */}
                        <div className={cn(
                            "px-6 py-10 border-b flex items-center transition-all duration-300",
                            sidebarOpen ? "justify-between" : "justify-center",
                            "border-slate-600"
                        )}>
                            <div className={cn(
                                "flex items-center gap-4 overflow-hidden transition-all duration-300",
                                !sidebarOpen && "hidden"
                            )}>
                                <div className={cn(
                                    "w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg shrink-0 transform hover:rotate-6 transition-transform duration-300",
                                    "bg-primary shadow-orange-500/10"
                                )}>
                                    <activeConfig.icon className="w-6 h-6 text-white" />
                                </div>
                                <div className="flex flex-col">
                                    <h1 className="text-white font-display text-lg tracking-tight font-black m-0 leading-tight">Maghrebia</h1>
                                    <p className="text-primary text-[10px] font-bold tracking-[0.2em] m-0 mt-0.5">{activeConfig.label}</p>
                                </div>
                            </div>
                            <button
                                onClick={toggleSidebar}
                                aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
                                className="hidden lg:flex items-center justify-center w-9 h-9 rounded-xl hover:bg-slate-800 text-slate-500 hover:text-white transition-all duration-300 border border-transparent hover:border-slate-700 focus:ring-2 focus:ring-orange-500/50 outline-none"
                            >
                                <Menu className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Nav Items */}
                        <nav className="flex-1 px-4 py-8 overflow-y-auto space-y-2 custom-scrollbar">
                            <div className={cn("px-4 mb-4 transition-all duration-300 flex items-center gap-2", !sidebarOpen && "lg:opacity-0 lg:h-0 overflow-hidden")}>
                                <div className="w-1 h-3 bg-accent-blue rounded-full"></div>
                                <span className="text-[10px] font-bold text-accent-blue tracking-[0.2em]">Main menu</span>
                            </div>
                            {activeConfig.nav.map((item) => {
                                const isActive = currentPath === item.href || (item.href !== `/${role}` && currentPath.startsWith(item.href))
                                return (
                                    <button
                                        key={item.name}
                                        onClick={() => navigate(item.href)}
                                        aria-current={isActive ? "page" : undefined}
                                        aria-label={item.name}
                                        className={cn(
                                            "w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all duration-300 group relative mb-1 outline-none text-left",
                                            isActive
                                                ? "bg-primary text-white shadow-lg shadow-orange-500/20"
                                                : "text-slate-400 hover:bg-slate-600 hover:text-white"
                                        )}
                                        title={!sidebarOpen ? item.name : ""}
                                    >
                                        <div className="flex items-center gap-4">
                                            <item.icon className={cn(
                                                "w-5 h-5 transition-all duration-300",
                                                isActive ? "text-white scale-110" : "text-slate-500 group-hover:text-accent-blue group-hover:scale-110"
                                            )} aria-hidden="true" />
                                            <span className={cn(
                                                "font-semibold text-sm tracking-wide transition-all duration-300",
                                                !sidebarOpen && "lg:opacity-0 lg:hidden"
                                            )}>
                                                {item.name}
                                            </span>
                                        </div>
                                        {item.badge && sidebarOpen && (
                                            <span className={cn(
                                                "px-2.5 py-0.5 text-[10px] font-bold rounded-lg min-w-6 text-center transition-all",
                                                isActive ? "bg-white/20 text-white" : "bg-slate-600 text-slate-400 group-hover:bg-primary/20 group-hover:text-primary"
                                            )}>
                                                {item.badge}
                                            </span>
                                        )}
                                        {isActive && !sidebarOpen && (
                                            <div className={cn("absolute right-2 top-1/2 -translate-y-1/2 w-1.5 h-6 rounded-full shadow-lg bg-orange-400")}></div>
                                        )}
                                    </button>
                                )
                            })}
                        </nav>

                        <div className={cn("p-6 border-t transition-all bg-[#2C2C2C] border-slate-600")}>
                            <button
                                onClick={logout}
                                aria-label="Sign out of the platform"
                                className={cn(
                                    "w-full flex items-center justify-center gap-2 p-3.5 text-[11px] font-bold tracking-[0.2em] rounded-2xl hover:bg-rose-500/10 hover:text-rose-400 transition-all duration-300 border border-transparent hover:border-rose-500/20 group outline-none",
                                    !sidebarOpen && "lg:p-3 lg:border-none lg:bg-transparent",
                                    "text-slate-500"
                                )}
                                title={!sidebarOpen ? "Sign Out" : ""}
                            >
                                <LogOut className="w-4 h-4 transition-transform group-hover:-translate-x-1" aria-hidden="true" />
                                {sidebarOpen && <span>Sign out</span>}
                            </button>
                        </div>
                    </div>
                </aside>
            )}

            {/* Main Content Area */}
            <div className={cn("flex-1 flex flex-col min-w-0 overflow-hidden relative", "bg-(--theme-content-bg)")}>
                {/* Decorative background blobs */}
                <div className={cn("absolute top-0 right-0 w-200 h-200 rounded-full blur-[140px] -translate-y-1/2 translate-x-1/2 pointer-events-none bg-primary/3 animate-pulse")}></div>
                <div className={cn("absolute bottom-0 left-0 w-150 h-150 rounded-full blur-[140px] translate-y-1/2 -translate-x-1/2 pointer-events-none bg-accent-blue/3")}></div>

                {/* No separate mobile header anymore, as we'll integrate the toggle into DashboardHeader */}

                <main className={cn(
                    "flex-1 relative z-10 scroll-smooth page-transition",
                    !isEmployee && "overflow-y-auto custom-scrollbar"
                )}>
                    <article className={cn("min-h-full", isEmployee && "pb-20")}>
                        {children}
                    </article>
                </main>
            </div>
        </div>
    )
}

export function PortalLayout(props) {
    return (
        <LayoutProvider>
            <PortalLayoutInner {...props} />
        </LayoutProvider>
    )
}

