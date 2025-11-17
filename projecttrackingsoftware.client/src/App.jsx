import { useState } from 'react';
import './App.css';

// Helper function to parse JWT and get payload
// This is for testing only and doesn't validate the signature
function parseJwt(token) {
    if (!token) {
        return null;
    }
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );
        return JSON.parse(jsonPayload);
    } catch (e) {
        console.error("Failed to parse JWT:", e);
        return null;
    }
}


function App() {
    // State for auth testing
    const [username, setUsername] = useState("testuser");
    const [password, setPassword] = useState("Test@123");
    const [apiResponse, setApiResponse] = useState(null);
    const [loading, setLoading] = useState(false);

    // State for tokens
    const [accessToken, setAccessToken] = useState(null);
    const [refreshToken, setRefreshToken] = useState(null);
    const [userId, setUserId] = useState(null);

    // --- Minimal Styles ---
    const styles = {
        container: {
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
        },
        section: {
            border: '1px solid #555',
            borderRadius: '8px',
            padding: '16px',
        },
        grid: {
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '10px',
        },
        button: {
            width: '100%',
        },
        input: {
            width: '100%',
            boxSizing: 'border-box', // Makes padding behave
        },
        responseBox: {
            backgroundColor: '#1e1e1e',
            border: '1px solid #444',
            padding: '10px',
            marginTop: '10px',
            borderRadius: '4px',
            fontFamily: 'monospace',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
            minHeight: '100px',
        },
        tokenBox: {
            backgroundColor: '#2a2a2a',
            padding: '10px',
            borderRadius: '4px',
            fontSize: '0.9em',
            wordBreak: 'break-all',
        }
    };

    // --- API Handlers ---

    const handleResponse = (name, data) => {
        setApiResponse({ status: 'Success', name, data });
        setLoading(false);
    };

    const handleError = (name, error) => {
        setApiResponse({ status: 'Error', name, error: error.message || 'Unknown error' });
        setLoading(false);
    };

    // --- Robust Error Handling Helper (FIXED with response.clone()) ---
    const getErrorFromResponse = async (response) => {
        // Clone the response to safely read the body twice if needed
        const responseClone = response.clone();

        try {
            // 1. Try to read the original response as JSON 
            const json = await response.json();
            return json;
        } catch (e) {
            // 2. If JSON parsing failed, use the clone to read as plain text
            try {
                const text = await responseClone.text();
                return text;
            } catch (textError) {
                // If both fail, return generic error information
                return `Could not parse server response. Status: ${response.status}. Error: ${textError.message}`;
            }
        }
    }

    // 1. Register
    const handleRegister = async () => {
        const name = "Register";
        console.log(`[${name}] Attempting...`);
        setLoading(true);
        setApiResponse(null);
        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userName: username, password: password })
            });
            console.log(`[${name}] Response status:`, response.status);

            if (!response.ok) {
                const errorData = await getErrorFromResponse(response);
                console.log(`[${name}] Server error:`, errorData);
                // The error data might be an object (JSON) or a string (plain text)
                const errorMessage = typeof errorData === 'object' ? (errorData.title || JSON.stringify(errorData)) : errorData;
                throw new Error(errorMessage);
            }

            const data = await response.json();
            console.log(`[${name}] Response data:`, data);
            handleResponse(name, data);

        } catch (error) {
            console.error(`[${name}] Error:`, error);
            handleError(name, error);
        }
    };

    // 2. Login
    const handleLogin = async () => {
        const name = "Login";
        console.log(`[${name}] Attempting...`);
        setLoading(true);
        setApiResponse(null);
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userName: username, password: password })
            });
            console.log(`[${name}] Response status:`, response.status);

            if (!response.ok) {
                const errorData = await getErrorFromResponse(response);
                console.log(`[${name}] Server error:`, errorData);
                const errorMessage = typeof errorData === 'object' ? (errorData.title || "Invalid username or password.") : errorData;
                throw new Error(errorMessage);
            }

            const data = await response.json();
            console.log(`[${name}] Response data:`, data);

            // Set tokens
            setAccessToken(data.accessToken);
            setRefreshToken(data.refreshToken);

            // Parse user ID from token for refresh endpoint
            const payload = parseJwt(data.accessToken);
            console.log(`[${name}] Full JWT payload:`, payload);

            // Check for both short 'nameid' and long URL-style claim
            const nameIdClaim = "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier";
            const userIdClaim = payload.nameid || payload[nameIdClaim];

            if (userIdClaim) {
                console.log(`[${name}] Parsed UserID:`, userIdClaim);
                setUserId(userIdClaim);
            } else {
                console.warn(`[${name}] Could not parse UserID (nameid) from JWT payload.`);
            }

            handleResponse(name, data);

        } catch (error) {
            console.error(`[${name}] Error:`, error);
            handleError(name, error);
        }
    };

    // 3. Authorized Only
    const handleAuthorizedOnly = async () => {
        const name = "Authorized Only";
        console.log(`[${name}] Attempting with token:`, accessToken);
        setLoading(true);
        setApiResponse(null);
        if (!accessToken) {
            handleError(name, new Error("No Access Token. Please log in first."));
            return;
        }

        try {
            const response = await fetch('/api/auth/authorized-only', {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            console.log(`[${name}] Response status:`, response.status);

            if (!response.ok) {
                if (response.status === 401) throw new Error("Unauthorized (401). Token might be invalid or expired.");
                throw new Error(`Server responded with ${response.status}`);
            }

            const data = await response.text(); // Endpoint returns plain text
            console.log(`[${name}] Response data:`, data);
            handleResponse(name, data);

        } catch (error) {
            console.error(`[${name}] Error:`, error);
            handleError(name, error);
        }
    };

    // 4. Admin Only
    const handleAdminOnly = async () => {
        const name = "Admin Only";
        console.log(`[${name}] Attempting with token:`, accessToken);
        setLoading(true);
        setApiResponse(null);
        if (!accessToken) {
            handleError(name, new Error("No Access Token. Please log in first."));
            return;
        }

        try {
            const response = await fetch('/api/auth/admin-only', {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            console.log(`[${name}] Response status:`, response.status);

            if (!response.ok) {
                if (response.status === 401) throw new Error("Unauthorized (401).");
                if (response.status === 403) throw new Error("Forbidden (403). You are not an Admin.");
                throw new Error(`Server responded with ${response.status}`);
            }

            const data = await response.text(); // Endpoint returns plain text
            console.log(`[${name}] Response data:`, data);
            handleResponse(name, data);

        } catch (error) {
            console.error(`[${name}] Error:`, error);
            handleError(name, error);
        }
    };

    // 5. Refresh Token
    const handleRefreshToken = async () => {
        const name = "Refresh Token";
        console.log(`[${name}] Attempting with UserID: ${userId} and RefreshToken: ${refreshToken}`);
        setLoading(true);
        setApiResponse(null);
        if (!refreshToken || !userId) {
            handleError(name, new Error("No Refresh Token or User ID. Please log in first."));
            return;
        }

        try {
            const response = await fetch('/api/auth/refresh-token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: userId, refreshToken: refreshToken })
            });
            console.log(`[${name}] Response status:`, response.status);

            if (!response.ok) {
                const errorData = await getErrorFromResponse(response);
                console.log(`[${name}] Server error:`, errorData);
                const errorMessage = typeof errorData === 'object' ? (errorData.title || "Invalid or expired refresh token.") : errorData;
                throw new Error(errorMessage);
            }

            const data = await response.json();
            console.log(`[${name}] Response data:`, data);

            // Update tokens
            setAccessToken(data.accessToken);
            setRefreshToken(data.refreshToken);

            console.log(`[${name}] Tokens have been refreshed.`);
            handleResponse(name, data);

        } catch (error) {
            console.error(`[${name}] Error:`, error);
            handleError(name, error);
        }
    };

    // 6. Weather Forecast
    async function populateWeatherData() {
        const name = "Weather Forecast";
        console.log(`[${name}] Fetching...`);
        setLoading(true);
        try {
            const response = await fetch('weatherforecast', {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            console.log(`[${name}] Response status:`, response.status);

            if (!response.ok) {
                const errorData = await getErrorFromResponse(response);
                console.log(`[${name}] Server error:`, errorData);
                const errorMessage = typeof errorData === 'object' ? (errorData.title || JSON.stringify(errorData)) : errorData;
                throw new Error(errorMessage);
            }

            const data = await response.json();
            console.log(`[${name}] Response data:`, data);
            handleResponse(name, data);

        } catch (error) {
            console.error(`[${name}] Error fetching weather data:`, error);
            handleError(name, error);
        }
    }

    // --- Render ---

    return (
        <div style={styles.container}>

            {/* Auth Testing Section */}
            <div style={styles.section}>
                <h2>API Endpoint Testing</h2>

                {/* Inputs */}
                <div style={styles.grid}>
                    <label>
                        Username:
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            style={styles.input}
                        />
                    </label>
                    <label>
                        Password:
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={styles.input}
                        />
                    </label>
                </div>

                {/* Test Buttons */}
                <div style={{ ...styles.grid, marginTop: '10px' }}>
                    <button onClick={handleRegister} disabled={loading} style={styles.button}>Test Register</button>
                    <button onClick={handleLogin} disabled={loading} style={styles.button}>Test Login</button>
                    <button onClick={handleAuthorizedOnly} disabled={loading} style={styles.button}>Test /authorized-only</button>
                    <button onClick={handleAdminOnly} disabled={loading} style={styles.button}>Test /admin-only</button>
                    <button onClick={handleRefreshToken} disabled={loading} style={styles.button}>Test /refresh-token</button>
                    <button onClick={populateWeatherData} disabled={loading} style={styles.button}>Test /weatherforecast</button>
                </div>

                {/* Response Area */}
                <h3>API Response</h3>
                <div style={styles.responseBox}>
                    {loading ? "Loading..." :
                        apiResponse ? (
                            <>
                                <strong>Test: {apiResponse.name}</strong><br />
                                <strong>Status: {apiResponse.status}</strong><br />
                                <hr style={{ borderColor: '#444' }} />
                                <pre>{JSON.stringify(apiResponse.data || apiResponse.error, null, 2)}</pre>
                            </>
                        ) : "Click a button to test an endpoint."
                    }
                </div>

                {/* Token Display */}
                <h3>Current Tokens</h3>
                <div style={styles.tokenBox}>
                    <p><strong>User ID:</strong> {userId || "N/A"}</p>
                    <p><strong>Access Token:</strong> {accessToken || "N/A"}</p>
                    <p><strong>Refresh Token:</strong> {refreshToken || "N/A"}</p>
                </div>
            </div>
        </div>
    );
}

export default App;