import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import { Button } from "../components/ui/button";
import Logo from "../components/Logo";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20 text-foreground p-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-md w-full"
      >
        <div className="flex justify-center mb-8">
          <Logo size="large" />
        </div>
        <AlertTriangle className="mx-auto h-16 w-16 text-destructive mb-6" />
        <h1 className="text-6xl font-bold text-destructive mb-2">404</h1>
        <h2 className="text-2xl font-semibold text-foreground mb-4">Page Not Found</h2>
        <p className="text-muted-foreground mb-8">
          Sorry, the page you are looking for does not exist or has been moved.
        </p>
        <Link to="/">
          <Button size="lg" className="bg-gradient-primary text-white">
            Return to Homepage
          </Button>
        </Link>
      </motion.div>
    </div>
  );
};

export default NotFound;