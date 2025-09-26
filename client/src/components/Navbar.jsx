  import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, Pen, User, LogIn, UserPlus, LogOut, Settings, BookOpen } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { useAuth } from "../context/AuthContext";
import Logo from "./Logo";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

export const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    setIsUserMenuOpen(false);
    setIsMobileMenuOpen(false);
  };

  const navItems = [
    { name: "Home", path: "/", icon: null },
    { name: "Explore", path: "/explore", icon: null },
    ...(isAuthenticated ? [
      { name: "Create", path: "/create", icon: <Pen className="h-4 w-4" /> },
      { name: "My Posts", path: "/my-posts", icon: <BookOpen className="h-4 w-4" /> }
    ] : [])
  ];

  const authItems = isAuthenticated ? [] : [
    { name: "Login", path: "/login", icon: <LogIn className="h-4 w-4" /> },
    {
      name: "Sign Up",
      path: "/signup",
      icon: <UserPlus className="h-4 w-4" />,
    },
  ];

  return (
    <motion.nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "glass-effect shadow-lg backdrop-blur-xl"
          : "bg-transparent"
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <motion.div
            className="flex-shrink-0"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Logo size="default" showText={true} />
          </motion.div>

          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {navItems.map((item) => (
                <motion.div key={item.name} whileHover={{ scale: 1.05 }}>
                  <Link
                    to={item.path}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-1 ${
                      location.pathname === item.path
                        ? "bg-gradient-primary text-white shadow-lg"
                        : "text-foreground hover:bg-accent hover:text-accent-foreground"
                    }`}
                  >
                    {item.icon}
                    <span>{item.name}</span>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            <ThemeToggle />

            {isAuthenticated ? (
              <div className="relative">
                <motion.button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-200"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Avatar className="h-8 w-8 rounded-full ring-2 ring-blog-primary/20 shadow-md">
                    <AvatarImage 
                      src={user?.avatar?.url || ''} 
                      alt={user?.fullName || user?.username || 'Profile'} 
                      className="object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                    <AvatarFallback className="text-xs bg-gradient-to-br from-blog-primary to-blog-secondary text-white font-bold">
                      {user?.fullName?.split(' ').map(n => n[0]).join('').toUpperCase() || user?.username?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:block">{user?.fullName || user?.username}</span>
                </motion.button>

                <AnimatePresence>
                  {isUserMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-lg shadow-lg backdrop-blur-xl z-50"
                    >
                      <div className="py-2">
                        <Link
                          to="/profile"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center space-x-2 px-4 py-2 text-sm text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                        >
                          <User className="h-4 w-4" />
                          <span>Profile</span>
                        </Link>
                        <Link
                          to="/profile/edit"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center space-x-2 px-4 py-2 text-sm text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                        >
                          <Settings className="h-4 w-4" />
                          <span>Settings</span>
                        </Link>
                        <hr className="my-2 border-border" />
                        <button
                          onClick={handleLogout}
                          className="flex items-center space-x-2 px-4 py-2 text-sm text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors w-full text-left"
                        >
                          <LogOut className="h-4 w-4" />
                          <span>Logout</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                {authItems.map((item) => (
                  <motion.div key={item.name} whileHover={{ scale: 1.05 }}>
                    <Link
                      to={item.path}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-1 ${
                        item.name === "Sign Up"
                          ? "btn-gradient shadow-lg"
                          : "text-foreground hover:bg-accent hover:text-accent-foreground border border-border"
                      }`}
                    >
                      {item.icon}
                      <span>{item.name}</span>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          <div className="md:hidden flex items-center space-x-2">
            <ThemeToggle />
            <motion.button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-lg text-foreground hover:bg-accent hover:text-accent-foreground"
              whileTap={{ scale: 0.95 }}
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </motion.button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden glass-effect"
          >
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {[...navItems, ...authItems].map((item) => (
                <motion.div
                  key={item.name}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <Link
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`block px-3 py-2 rounded-lg text-base font-medium transition-all duration-200 flex items-center space-x-2 ${
                      location.pathname === item.path
                        ? "bg-gradient-primary text-white"
                        : "text-foreground hover:bg-accent hover:text-accent-foreground"
                    }`}
                  >
                    {item.icon}
                    <span>{item.name}</span>
                  </Link>
                </motion.div>
              ))}

              {isAuthenticated && (
                <>
                  <hr className="my-2 border-border/50" />
                  <div className="px-3 py-2">
                    <div className="flex items-center space-x-3 mb-3">
                      <Avatar className="w-10 h-10 border-2 border-border">
                        <AvatarImage src={user?.avatar?.url} alt={user?.fullName || user?.username} />
                        <AvatarFallback className="text-sm bg-gradient-to-br from-blog-primary to-blog-secondary text-white">
                          {user?.fullName?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || user?.username?.slice(0, 2).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-foreground">{user?.fullName || user?.username}</p>
                        <p className="text-xs text-muted-foreground">@{user?.username}</p>
                      </div>
                    </div>
                    <Link
                      to="/profile"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block px-3 py-2 rounded-lg text-base font-medium text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                      Profile
                    </Link>
                    <Link
                      to="/profile/edit"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block px-3 py-2 rounded-lg text-base font-medium text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                      Settings
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-3 py-2 rounded-lg text-base font-medium text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                    >
                      Logout
                    </button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};
