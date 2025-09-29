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
          : "bg-background/80 backdrop-blur-sm md:bg-transparent"
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex items-center justify-between h-16 md:h-20">
          <div className="flex items-center justify-between w-full md:w-auto">
            <motion.div
              className="flex-shrink-0"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Logo size="default" showText={true} />
            </motion.div>
            
            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <ThemeToggle className="mr-4" />
              <motion.button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-lg text-foreground hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary"
                aria-expanded="false"
              >
                <span className="sr-only">Open main menu</span>
                {isMobileMenuOpen ? (
                  <X className="block h-6 w-6" aria-hidden="true" />
                ) : (
                  <Menu className="block h-6 w-6" aria-hidden="true" />
                )}
              </motion.button>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-center space-x-1">
              {navItems.map((item) => (
                <motion.div 
                  key={item.name} 
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  className="relative group"
                >
                  <Link
                    to={item.path}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${
                      location.pathname === item.path
                        ? "bg-gradient-primary text-white shadow-lg"
                        : "text-foreground hover:bg-accent/10 hover:text-accent-foreground"
                    }`}
                  >
                    {item.icon}
                    <span className="whitespace-nowrap">{item.name}</span>
                  </Link>
                  <span className={`absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full ${
                    location.pathname === item.path ? 'w-full' : ''
                  }`}></span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <ThemeToggle className="hidden md:block" />

            {isAuthenticated ? (
              <div className="relative">
                <motion.button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium text-foreground hover:bg-accent/10 hover:text-accent-foreground transition-all duration-200"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.95 }}
                  aria-label="User menu"
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
                    <AvatarFallback className="bg-gradient-to-br from-blog-primary to-blog-secondary text-white font-medium">
                      {user?.fullName?.charAt(0) || user?.username?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </motion.button>

                <AnimatePresence>
                  {isUserMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-popover text-popover-foreground ring-1 ring-black ring-opacity-5 focus:outline-none z-50"
                    >
                      <div className="py-1">
                        <Link
                          to="/profile"
                          className="block px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4" />
                            <span>Profile</span>
                          </div>
                        </Link>
                        <Link
                          to="/my-posts"
                          className="block px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <div className="flex items-center space-x-2">
                            <BookOpen className="h-4 w-4" />
                            <span>My Posts</span>
                          </div>
                        </Link>
                        <Link
                          to="/profile/edit"
                          className="block px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <div className="flex items-center space-x-2">
                            <Settings className="h-4 w-4" />
                            <span>Settings</span>
                          </div>
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="w-full text-left px-4 py-2 text-sm text-destructive hover:bg-destructive/10"
                        >
                          <div className="flex items-center space-x-2">
                            <LogOut className="h-4 w-4" />
                            <span>Logout</span>
                          </div>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                {authItems.map((item) => (
                  <motion.div
                    key={item.name}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Link
                      to={item.path}
                      className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-2 ${
                        location.pathname === item.path
                          ? 'bg-gradient-primary text-white shadow-lg'
                          : 'bg-accent/10 text-foreground hover:bg-accent/20'
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
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="md:hidden overflow-hidden"
            >
              <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-background/95 backdrop-blur-lg rounded-lg my-2">
                {navItems.map((item) => (
                  <motion.div
                    key={item.name}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Link
                      to={item.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`block px-3 py-3 rounded-md text-base font-medium ${
                        location.pathname === item.path
                          ? 'bg-accent/20 text-accent-foreground'
                          : 'text-foreground hover:bg-accent/10 hover:text-accent-foreground'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        {item.icon}
                        <span>{item.name}</span>
                      </div>
                    </Link>
                  </motion.div>
                ))}

                {isAuthenticated ? (
                  <>
                    <div className="border-t border-border my-2"></div>
                    <Link
                      to="/profile"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block px-3 py-3 rounded-md text-base font-medium text-foreground hover:bg-accent/10 hover:text-accent-foreground"
                    >
                      <div className="flex items-center space-x-2">
                        <User className="h-5 w-5" />
                        <span>Profile</span>
                      </div>
                    </Link>
                    <Link
                      to="/profile/edit"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block px-3 py-3 rounded-md text-base font-medium text-foreground hover:bg-accent/10 hover:text-accent-foreground"
                    >
                      <div className="flex items-center space-x-2">
                        <Settings className="h-5 w-5" />
                        <span>Settings</span>
                      </div>
                    </Link>
                    <button
                      onClick={() => {
                        handleLogout();
                        navigate('/');
                      }}
                      className="w-full text-left px-3 py-3 rounded-md text-base font-medium text-destructive hover:bg-destructive/10"
                    >
                      <div className="flex items-center space-x-2">
                        <LogOut className="h-5 w-5" />
                        <span>Logout</span>
                      </div>
                    </button>
                  </>
                ) : (
                  <>
                    <div className="border-t border-border my-2"></div>
                    {authItems.map((item) => (
                      <Link
                        key={item.name}
                        to={item.path}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="block px-3 py-3 rounded-md text-base font-medium text-foreground hover:bg-accent/10 hover:text-accent-foreground"
                      >
                        <div className="flex items-center space-x-2">
                          {item.icon}
                          <span>{item.name}</span>
                        </div>
                      </Link>
                    ))}
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
};

export default Navbar;
