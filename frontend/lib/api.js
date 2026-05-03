export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001"

class ApiService {
    async request(endpoint, options = {}, retries = 0) {
        const token = sessionStorage.getItem("skillmatch_token")

        const headers = {
            "Content-Type": "application/json",
            ...(token ? { "Authorization": `Bearer ${token}` } : {}),
            ...options.headers,
        }

        const config = {
            ...options,
            headers,
        }

        try {
            const response = await fetch(`${API_URL}${endpoint}`, config)

            if (response.status === 401 && retries === 0) {
                const refreshToken = sessionStorage.getItem("skillmatch_refresh_token")
                if (refreshToken) {
                    try {
                        console.log("[API] Token expired, attempting refresh...")
                        const refreshResponse = await fetch(`${API_URL}/auth/refresh`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ refreshToken })
                        })
                        
                        if (refreshResponse.ok) {
                            const { access_token, refresh_token } = await refreshResponse.json()
                            sessionStorage.setItem("skillmatch_token", access_token)
                            if (refresh_token) sessionStorage.setItem("skillmatch_refresh_token", refresh_token)
                            
                            // Retry the original request
                            return this.request(endpoint, options, 1)
                        }
                    } catch (refreshError) {
                         console.error("[API] Refresh failed:", refreshError)
                    }
                }

                // If no refresh token or refresh failed, logout
                sessionStorage.removeItem("skillmatch_token")
                sessionStorage.removeItem("skillmatch_refresh_token")
                sessionStorage.removeItem("skillmatch_user")
                if (!window.location.pathname.endsWith("/login")) {
                    window.location.href = "/login"
                }
            }

            const text = await response.text()
            const data = text ? JSON.parse(text) : {}

            if (!response.ok) {
                console.error(`[API] Error response:`, data)
                throw new Error(data.message || "Something went wrong")
            }

            return data
        } catch (error) {
            console.error("[API] Request Error:", error)
            throw error
        }
    }

    get(endpoint, options = {}) {
        return this.request(endpoint, { ...options, method: "GET" })
    }

    post(endpoint, body, options = {}) {
        return this.request(endpoint, {
            ...options,
            method: "POST",
            body: JSON.stringify(body)
        })
    }

    put(endpoint, body, options = {}) {
        return this.request(endpoint, {
            ...options,
            method: "PUT",
            body: JSON.stringify(body)
        })
    }

    patch(endpoint, body, options = {}) {
        return this.request(endpoint, {
            ...options,
            method: "PATCH",
            body: JSON.stringify(body)
        })
    }

    delete(endpoint, body = null, options = {}) {
        return this.request(endpoint, { 
            ...options, 
            method: "DELETE",
            ...(body ? { body: JSON.stringify(body) } : {}) 
        })
    }

    async upload(endpoint, fileOrFormData) {
        const token = sessionStorage.getItem("skillmatch_token")
        let body;

        if (fileOrFormData instanceof FormData) {
            body = fileOrFormData;
        } else {
            body = new FormData();
            body.append("file", fileOrFormData);
        }

        const headers = {
            ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        }

        const response = await fetch(`${API_URL}${endpoint}`, {
            method: "POST",
            headers,
            body
        })

        const data = await response.json()
        if (!response.ok) throw new Error(data.message || "Upload failed")
        return data
    }
}

export const api = new ApiService()
