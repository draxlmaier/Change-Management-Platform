// src/components/auth/AuthenticatedRedirect.tsx
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const AuthenticatedRedirect: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Start a timer that redirects to '/landing' after 5 seconds
    const timer = setTimeout(() => {
      navigate("/landing");
    }, 5000);

    // Clear timer on unmount
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="text-center mt-10">
      <h2 className="text-2xl font-bold">Login Successful!</h2>
      <p className="mt-4 text-lg">
        You will be redirected to the landing page in 5 seconds...
      </p>
    </div>
  );
};

export default AuthenticatedRedirect;
