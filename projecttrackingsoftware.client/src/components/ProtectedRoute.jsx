import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();

    // 1. Show a loading state while AuthContext checks localStorage
    if (loading) {
        return <div>Loading application...</div>;
    }

    // 2. If no user is found, redirect to Login
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // 3. If user exists, render the requested page (Dashboard)
    return children;
};

export default ProtectedRoute;