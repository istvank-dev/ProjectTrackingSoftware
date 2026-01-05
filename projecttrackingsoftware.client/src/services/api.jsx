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
            throw new Error(e || `Error ${response.status}`);
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
    async createTaskRaw(projectId, projectName) {
        const token = getAccessToken();

        console.log(" createTaskRaw CALLED");
        console.log(" URL:", "/api/Task");

        const response = await fetch("/api/Task", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                projectId,
                projectName,
            }),
        });

        console.log(" STATUS:", response.status);

        const text = await response.text();
        console.log(" RESPONSE BODY:", text);

        if (!response.ok) {
            throw new Error(text);
        }

        return JSON.parse(text);
    },
    async createTask(taskData) {
        const token = getAccessToken();
        const response = await fetch('/api/Task', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                projectId: taskData.projectId,
                projectName: taskData.projectName,
            })
        });
        console.log("Creating task for project:", taskData.projectId);
        if (!response.ok) {
            const text = await response.text();
            console.error("CreateTask failed:", response.status, text);
            throw new Error(text || 'Failed to create task');
        }
        return response.json();
    },

    async getAllTasks() {
        const token = getAccessToken();
        const response = await fetch('/api/Task', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch tasks');
        return response.json();
    },

    async updateTask(id, taskData) {
        const token = getAccessToken();
        const response = await fetch(`/api/Task/${id}`, {
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
        const response = await fetch(`/api/Task/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to delete task');
        return response.ok;
    },
    ping: async () => {
        const token = getAccessToken();
        const response = await fetch("/api/Task/ping", {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) throw new Error("Ping failed");
        return response.text();
    },
    postTest: async () => {
        const token = getAccessToken();

        const response = await fetch("/api/Task", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                message: "hello from frontend"
            }),
        });

        console.log("RAW RESPONSE OBJECT:", response);

        let bodyText;
        try {
            bodyText = await response.text();
        } catch (e) {
            console.warn(e);
            bodyText = "<could not read response body>";
        }

        console.log("STATUS:", response.status);
        console.log("BODY TEXT:", bodyText);

        if (!response.ok) {
            // THIS guarantees we throw the actual text
            throw new Error(bodyText || "Unknown server error");
        }

        return bodyText;
    },
    async  pingTaskController() {
            const response = await fetch("/api/Task/ping", {
                method: "GET",
            });

    if (!response.ok) {
        throw new Error("Ping failed");
    }

    return response.text();
    }

};

export const projectService = {

    // Gets all the projects that the user is part of
    getAll: async () => {
        const token = getAccessToken();
        const response = await fetch('/api/project', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch Projects');
        return response.json();
    },

    // Creates a new project
    // returns the project the same way getOneProject does
    // New project data (name + columnCount) ProjectDto on the backend
    createProject: async (projectData) => {
        const token = getAccessToken();
        const response = await fetch('/api/project', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(projectData)
        });
        if (!response.ok) {
            const text = await response.text();
            console.error("CreateProject failed:", response.status, text);
            throw new Error(text || 'Failed to create project');
        }
        return response.json();
    },

    // TODO dashboard component should get the tasks from this request not the getAllTasks one
    // gets one project
    // tasks array contains the tasks that need to be shown on the dashboard
    // needs project Id
    getOneProject: async (id) => {
        const token = getAccessToken();
        const response = await fetch(`/api/project/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Failed to fetch Projects');
        return response.json();
    },

    leaveProject: async (projectId) => {
        const token = getAccessToken();
        const response = await fetch(`/api/project/${projectId}/leave`, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(text || "Failed to leave project");
        }
    },
    addColumn: async (projectId, name) => {
        const token = getAccessToken();
        const response = await fetch(`/api/project/${projectId}/columns`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ name }),
        });
        console.log("Sent message to the backend");
        if (!response.ok) {
            const text = await response.text();

            throw new Error(text || "Failed to add column");
        }

        return response.json(); // returns columnNames
    },
    inviteUser: async (projectId, username) => {
        const token = getAccessToken();
        const response = await fetch(`/api/project/${projectId}/invite`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ name: username }),
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(text || "Failed to invite user");
        }

        return response.json(); // usernames
    },


}

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
