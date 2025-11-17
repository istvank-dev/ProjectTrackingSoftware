import { useState } from 'react';
import { authService } from '../services/api';
import AuthorizedView from '../components/AuthorizedView';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
    const { user, logout } = useAuth();
    const [response, setResponse] = useState(null);

    const handleApiCall = async (apiFunc, name) => {
        try {
            const data = await apiFunc();
            setResponse({ name, data });
        } catch (error) {
            setResponse({ name, error: error.message });
        }
    };

    const handleLogout = async () => {
        await logout();
        // Note: The logout function already handles redirecting via the AuthContext
        // and the ProtectedRoute will automatically redirect to login
    };

    return (
        <div>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
                paddingBottom: '10px',
                borderBottom: '1px solid #ccc'
            }}>
                <div>
                    <h1>Dashboard</h1>
                    <p>Welcome, {user?.username}! (Role: {user?.role})</p>
                </div>
                <button
                    onClick={handleLogout}
                    style={{
                        backgroundColor: '#d9534f',
                        color: 'white',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '14px'
                    }}
                    onMouseOver={(e) => e.target.style.backgroundColor = '#c9302c'}
                    onMouseOut={(e) => e.target.style.backgroundColor = '#d9534f'}
                >
                    Logout
                </button>
            </div>

            <AuthorizedView>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button onClick={() => handleApiCall(authService.getAuthorizedData, "Authorized Only")}>
                        Test Authorized Endpoint
                    </button>
                    <button onClick={() => handleApiCall(authService.getWeather, "Weather Forecast")}>
                        Get Weather
                    </button>
                </div>
            </AuthorizedView>

            <br />

            <AuthorizedView roles={['Admin']}>
                <div style={{ border: '1px solid purple', padding: '10px', marginTop: '10px' }}>
                    <h3>Admin Zone</h3>
                    <button onClick={() => handleApiCall(authService.getAdminData, "Admin Endpoint")}>
                        Test Admin Only
                    </button>
                </div>
            </AuthorizedView>

            {response && (
                <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#333', borderRadius: '5px' }}>
                    <h4>{response.name} Response:</h4>
                    <pre style={{ textAlign: 'left' }}>{JSON.stringify(response.data || response.error, null, 2)}</pre>
                </div>
            )}
        </div>
    );
};

export default Dashboard;