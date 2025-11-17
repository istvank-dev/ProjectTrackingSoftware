import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import RedirectIfAuthenticatedRoute from './components/RedirectIfAuthenticatedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import './App.css';

function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    <Route path="/" element={<Navigate to="/login" />} />

                    <Route
                        path="/login"
                        element={
                            <RedirectIfAuthenticatedRoute>
                                <Login />
                            </RedirectIfAuthenticatedRoute>
                        }
                    />
                    <Route
                        path="/register"
                        element={
                            <RedirectIfAuthenticatedRoute>
                                <Register />
                            </RedirectIfAuthenticatedRoute>
                        }
                    />

                    <Route
                        path="/dashboard"
                        element={
                            <ProtectedRoute>
                                <Dashboard />
                            </ProtectedRoute>
                        }
                    />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;