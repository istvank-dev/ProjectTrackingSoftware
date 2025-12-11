import { jwtDecode } from "jwt-decode";

const API_URL = "/api/auth";

// --- Token Management ---

export const getAccessToken = () => localStorage.getItem("accessToken");
export const getRefreshToken = () => localStorage.getItem("refreshToken");

export const setTokens = (accessToken, refreshToken) => {
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
};

export const clearTokens = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
};

export const getUserFromToken = () => {
    const token = getAccessToken();
    if (!token) return null;
    try {
        const decoded = jwtDecode(token);
        return {
            username: decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"] || decoded.sub,
            id: decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"] || decoded.nameid,
            role: decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || decoded.role
        };
    } catch (error) {
        console.error("Invalid token:", error);
        return null;
    }
};

// --- API Calls ---

async function request(endpoint, options = {}) {
    const token = getAccessToken();

    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
        ...options,
        headers,
    };

    const response = await fetch(endpoint, config);

    // Handle Unauthorized (401) - Simple version (redirect to logout)
    // In a production app, you would implement silent refresh here
    if (response.status === 401) {
        // Optional: clearTokens(); window.location.href = '/login';
        throw new Error("Unauthorized");
    }

    if (!response.ok) {
        const errorText = await response.text();
        try {
            const errorJson = JSON.parse(errorText);
            throw new Error(errorJson.title || "Request failed");
        } catch (e) {
            throw new Error(errorText || `Error ${response.status}`);
        }
    }

    // Return JSON if content-type is json, otherwise text
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") !== -1) {
        return response.json();
    } else {
        return response.text();
    }
}

export const taskService = {
  async createTask(taskData) {
    const token = getAccessToken();
    const response = await fetch('/api/task', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(taskData)
    });
    if (!response.ok) throw new Error('Failed to create task');
    return response.json();
  },

  async getAllTasks() {
    const token = getAccessToken();
    const response = await fetch('/api/task', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Failed to fetch tasks');
    return response.json();
  },

  async updateTask(id, taskData) {
    const token = getAccessToken();
    const response = await fetch(`/api/task/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(taskData)
    });
    if (!response.ok) throw new Error('Failed to update task');
    return response.json();
  },

  async deleteTask(id) {
    const token = getAccessToken();
    const response = await fetch(`/api/task/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Failed to delete task');
    return response.ok;
  }
};


export const authService = {
    login: async (username, password) => {
        const data = await request(`${API_URL}/login`, {
            method: 'POST',
            body: JSON.stringify({ userName: username, password }),
        });
        setTokens(data.accessToken, data.refreshToken);
        return getUserFromToken();
    },

    register: async (username, password) => {
        return request(`${API_URL}/register`, {
            method: 'POST',
            body: JSON.stringify({ userName: username, password }),
        });
    },

    logout: async () => {
        try {
            await request(`${API_URL}/logout`, {
                method: 'POST',
            });
        } catch (error) {
            console.warn('Logout API call failed, but clearing tokens locally:', error);
        } finally {
            clearTokens();
        }
    },

    refreshToken: async (userId, refreshToken) => {
        const data = await request(`${API_URL}/refresh-token`, {
            method: 'POST',
            body: JSON.stringify({ userId, refreshToken }),
        });
        setTokens(data.accessToken, data.refreshToken);
        return data;
    },

    getAuthorizedData: () => request(`${API_URL}/authorized-only`),
    getAdminData: () => request(`${API_URL}/admin-only`),
    getWeather: () => request(`/weatherforecast`),
};