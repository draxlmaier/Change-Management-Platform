// src/pages/LoginPage.tsx
import React, { useEffect, useState } from "react";
import loginBg from "../assets/images/login-bg.png";
import {
  useMsal,
  AuthenticatedTemplate,
  UnauthenticatedTemplate,
} from "@azure/msal-react";
import { useNavigate } from "react-router-dom";

const LoginPage: React.FC = () => {
  const { instance } = useMsal();
  const navigate = useNavigate();
  const [loggedIn, setLoggedIn] = useState(false);
  const [countdown, setCountdown] = useState(5);

  // Detect login
  useEffect(() => {
    if (instance.getActiveAccount()) {
      setLoggedIn(true);
    }
  }, [instance]);

  // Start countdown when loggedIn
  useEffect(() => {
    if (!loggedIn) return;
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [loggedIn]);

  // Redirect when countdown hits zero
  useEffect(() => {
    if (loggedIn && countdown <= 0) {
      navigate("/tool-selection");
    }
  }, [loggedIn, countdown, navigate]);

  const handleLogin = () => {
    instance.loginRedirect({
      scopes: [
        "openid",
        "profile",
        "https://graph.microsoft.com/User.Read",
        "https://graph.microsoft.com/Sites.Read.All",
      ],
      prompt: "select_account",
    });
  };

  return (
    <div
    className="min-h-screen flex items-center justify-center bg-cover bg-center"
    style={{ backgroundImage: `url(${loginBg})` }}
    >
      {/* translucent card to hold login state / button */}
      <div className="bg-white bg-opacity-80 p-8 rounded-2xl shadow-lg backdrop-blur-sm max-w-sm w-full text-center space-y-4">
        <AuthenticatedTemplate>
          <p className="text-green-700 font-semibold">
            You are successfully logged in!
          </p>
          <p>Redirecting to landing page in {countdown}…</p>
        </AuthenticatedTemplate>

        <UnauthenticatedTemplate>
          <p className="text-gray-800 font-medium mb-2">
            Please sign in to continue
          </p>
          {/* your custom button image */}
          <img
            src="/sign in with microsoft.jpg"
            alt="Sign in with Microsoft"
            onClick={handleLogin}
            className="mx-auto cursor-pointer select-none"
          />
        </UnauthenticatedTemplate>
      </div>
    </div>
  );
};

export default LoginPage;
