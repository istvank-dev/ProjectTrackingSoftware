import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RedirectIfAuthenticatedRoute = ({ children }) => {
    const { user, loading } = useAuth();

    // Show loading state while AuthContext checks localStorage
    if (loading) {
        return <div>Loading application...</div>;
    }

    // If the user IS logged in, redirect them to the Dashboard
    if (user) {
        return <Navigate to="/dashboard" replace />;
    }

    // If the user is NOT logged in, render the public page (Login/Register)
    return children;
};

export default RedirectIfAuthenticatedRoute;