import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import {Login} from "./Login";
import {Panel} from "./Panel";
import { AuthProvider } from "./AuthContext";
import { ProtectedRoute } from "./ProtectedRoute";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/panel" element={<ProtectedRoute><Panel /></ProtectedRoute>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;

