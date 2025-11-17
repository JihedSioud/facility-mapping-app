import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ExplorePage from "./pages/Explore.jsx";
import EditorConsole from "./pages/EditorConsole.jsx";
import AdminPanel from "./pages/AdminPanel.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { FiltersProvider } from "./context/FiltersContext.jsx";
import { FacilitiesProvider } from "./context/FacilitiesContext.jsx";
import { LanguageProvider, useLanguage } from "./context/LanguageContext.jsx";
import AppHeader from "./Components/Layout/AppHeader.jsx";
import ProtectedRoute from "./Components/Layout/ProtectedRoute.jsx";
import "./App.css";

const queryClient = new QueryClient();

function AppShell() {
  const { direction } = useLanguage();
  return (
    <div
      className="relative min-h-screen bg-slate-950 text-slate-100"
      dir={direction}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 z-0 h-64 bg-gradient-to-b from-cyan-500/20 via-transparent to-transparent blur-3xl" />
      <AppHeader />
      <main className="relative z-10">
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
      </main>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <FiltersProvider>
          <FacilitiesProvider>
            <LanguageProvider>
              <BrowserRouter>
                <AppShell />
              </BrowserRouter>
            </LanguageProvider>
          </FacilitiesProvider>
        </FiltersProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
