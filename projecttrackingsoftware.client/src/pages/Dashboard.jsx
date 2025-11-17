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

    return (
        <div>
            <h1>Dashboard</h1>
            <p>Welcome, {user?.username}!</p>
            <button onClick={logout} style={{ marginBottom: '20px', backgroundColor: '#d9534f' }}>Logout</button>

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