// src/components/Logo.tsx
import React from "react";
import defaultLogo from "../assets/images/githubpageslogo.png";

function pickLogoByHost(host: string) {
  return defaultLogo;
}

const Logo: React.FC<{ alt?: string; className?: string }> = ({ alt, className }) => {
  const logo = pickLogoByHost(window.location.hostname);
  return <img src={logo} alt={alt || "Logo"} className={className} />;
};

export default Logo;
