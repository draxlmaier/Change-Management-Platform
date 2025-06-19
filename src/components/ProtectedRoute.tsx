// File: src/components/ProtectedRoute.tsx
import React, { JSX } from "react";
import { Navigate, useParams } from "react-router-dom";
import { useCurrentUserRole } from "../hooks/useCurrentUserRole";

interface ProtectedRouteProps {
  allowedRoles?: string[];         // e.g., ["Admin", "ChangeCoordinator"]
  requiredProjects?: string[];     // e.g., ["bmw"] (optional override)
  requireProjectAccess?: boolean;  // automatically extract projectKey from URL
  children: JSX.Element;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  allowedRoles,
  requiredProjects,
  requireProjectAccess,
  children,
}) => {
  const { role, permissions, loading } = useCurrentUserRole();
  const { projectKey } = useParams();

  if (loading) return <p>Loading...</p>;

  // Role check
  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/unauthorized" />;
  }

  // Project permission check (either via prop or URL param)
  if (requireProjectAccess) {
    if (!projectKey || !permissions.includes(projectKey)) {
      return <Navigate to="/unauthorized" />;
    }
  } else if (requiredProjects) {
    if (!requiredProjects.every((project) => permissions.includes(project))) {
      return <Navigate to="/unauthorized" />;
    }
  }

  return children;
};

export default ProtectedRoute;
