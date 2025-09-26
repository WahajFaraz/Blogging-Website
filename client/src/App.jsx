import "./global.css";

import { Toaster as Sonner } from "./components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute, PublicRoute } from "./components/ProtectedRoute";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import Index from "./pages/Index";
import Login from "./pages/Login"; 
import Signup from "./pages/Signup";
import Profile from "./pages/Profile";
import EditProfile from "./pages/EditProfile";
import CreatePost from "./pages/CreatePost";
import BlogDetail from "./pages/BlogDetail";
import MyPosts from "./pages/MyPosts";
import EditPost from "./pages/EditPost";
import NotFound from "./pages/NotFound";
import AuthorProfile from "./pages/AuthorProfile";
import FollowList from "./pages/FollowList";
import Explore from "./pages/Explore";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <AuthProvider>
        <ThemeProvider>
          <Sonner />
          <div className="min-h-screen bg-background text-foreground">
              <Navbar />
              <main>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/explore" element={<Explore />} />
                  <Route path="/blog/:id" element={<BlogDetail />} />
                  <Route path="/author/:authorId" element={<AuthorProfile />} />
                  <Route path="/author/:userId/followers" element={<FollowList />} />
                  <Route path="/author/:userId/following" element={<FollowList />} />
                  
                  <Route 
                    path="/login" 
                    element={
                      <PublicRoute>
                        <Login />
                      </PublicRoute>
                    } 
                  />
                  <Route 
                    path="/signup" 
                    element={
                      <PublicRoute>
                        <Signup />
                      </PublicRoute>
                    } 
                  />
                  
                  <Route 
                    path="/profile" 
                    element={
                      <ProtectedRoute>
                        <Profile />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/profile/edit" 
                    element={
                      <ProtectedRoute>
                        <EditProfile />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/create" 
                    element={
                      <ProtectedRoute>
                        <CreatePost />
                      </ProtectedRoute>
                    } 
                  />
                  
                  <Route 
                    path="/my-posts" 
                    element={
                      <ProtectedRoute>
                        <MyPosts />
                      </ProtectedRoute>
                    } 
                  />
                  
                  <Route 
                    path="/edit/:id" 
                    element={
                      <ProtectedRoute>
                        <EditPost />
                      </ProtectedRoute>
                    } 
                  />
                  
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
              <Footer />
            </div>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;