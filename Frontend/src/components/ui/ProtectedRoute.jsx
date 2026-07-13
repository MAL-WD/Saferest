import { Navigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

export default function ProtectedRoute({ children }) {
  // DEV BYPASS: always allow access for development
  return children;
}
