import { useAuth } from '../context/AuthContext';

const AuthorizedView = ({ children, roles = [] }) => {
    const { user } = useAuth();

    if (!user) {
        return <div style={{ padding: '20px', border: '1px dashed orange' }}>Please log in to view this content.</div>;
    }

    if (roles.length > 0 && !roles.includes(user.role)) {
        return <div style={{ color: 'red' }}>Access Denied: Requires role {roles.join(', ')}</div>;
    }

    return <>{children}</>;
};

export default AuthorizedView;