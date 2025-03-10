import { useAutenticado } from "./AuthContext";
import { Navigate } from "react-router-dom";

export function ProtectedRoute({ children }) {
  const { user, loading } = useAutenticado();

  if (loading) {
    return <div>Cargando...</div>; // Puedes mejorar con un spinner
  }

  if (!user) {
    return <Navigate to="/login" replace />; // Redirige al login si no hay sesión
  }

  return children;
}
