import { createContext, useContext, useState, useEffect } from "react"
import { useLocation } from "react-router-dom"

const LayoutContext = createContext()

export function LayoutProvider({ children }) {
    const [sidebarOpen, setSidebarOpen] = useState(() => {
        // Default to true on desktop, false on mobile
        if (typeof window !== "undefined") {
            return window.innerWidth >= 1024
        }
        return true
    })

    const location = useLocation()

    // CLOSE sidebar on mobile when navigating
    useEffect(() => {
        if (window.innerWidth < 1024) {
            setSidebarOpen(false)
        }
    }, [location.pathname])

    // Handle initial state and resize if needed
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 1024) {
                // Don't auto-open it if they manually closed it, or maybe just leave it?
                // For better UX on large screens, usually you want it open or in the state user left it
            } else {
                // For mobile, maybe just leave it as is until they interact
            }
        }
        window.addEventListener("resize", handleResize)
        return () => window.removeEventListener("resize", handleResize)
    }, [])

    const toggleSidebar = () => setSidebarOpen(prev => !prev)
    const openSidebar = () => setSidebarOpen(true)
    const closeSidebar = () => setSidebarOpen(false)

    return (
        <LayoutContext.Provider value={{ sidebarOpen, setSidebarOpen, toggleSidebar, openSidebar, closeSidebar }}>
            {children}
        </LayoutContext.Provider>
    )
}

export const useLayout = () => {
    const context = useContext(LayoutContext)
    if (!context) {
        // Fallback for when not in provider (e.g. employee pages)
        return {
            sidebarOpen: true,
            setSidebarOpen: () => { },
            toggleSidebar: () => { },
            openSidebar: () => { },
            closeSidebar: () => { }
        }
    }
    return context
}
