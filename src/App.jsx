import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ExplorePage from "./pages/Explore.jsx";
import EditorConsole from "./pages/EditorConsole.jsx";
import AdminPanel from "./pages/AdminPanel.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { FiltersProvider } from "./context/FiltersContext.jsx";
import { FacilitiesProvider } from "./context/FacilitiesContext.jsx";
import AppHeader from "./Components/Layout/AppHeader.jsx";
import ProtectedRoute from "./Components/Layout/ProtectedRoute.jsx";
import "./App.css";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <FiltersProvider>
          <FacilitiesProvider>
            <BrowserRouter>
              <div className="min-h-screen bg-slate-50">
                <AppHeader />
                <Routes>
                  <Route path="/" element={<ExplorePage />} />
                  <Route
                    path="/editor"
                    element={
                      <ProtectedRoute minRole="editor">
                        <EditorConsole />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin"
                    element={
                      <ProtectedRoute minRole="admin">
                        <AdminPanel />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </div>
            </BrowserRouter>
          </FacilitiesProvider>
        </FiltersProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
