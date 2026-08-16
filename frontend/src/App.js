import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import Layout from "@/components/Layout";
import Landing from "@/pages/Landing";
import Auth from "@/pages/Auth";
import Dashboard from "@/pages/Dashboard";
import Speaking from "@/pages/Speaking";
import Writing from "@/pages/Writing";
import History from "@/pages/History";
import SessionDetail from "@/pages/SessionDetail";

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading || user === null)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-zinc-900 border-t-transparent animate-spin" />
      </div>
    );
  if (!user) return <Navigate to="/auth" replace />;
  return <Layout>{children}</Layout>;
}

function App() {
  return (
    <div className="App font-sans">
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
            <Route path="/speaking" element={<Protected><Speaking /></Protected>} />
            <Route path="/writing" element={<Protected><Writing /></Protected>} />
            <Route path="/history" element={<Protected><History /></Protected>} />
            <Route path="/session/:id" element={<Protected><SessionDetail /></Protected>} />
          </Routes>
        </BrowserRouter>
        <Toaster position="top-center" />
      </AuthProvider>
    </div>
  );
}

export default App;
