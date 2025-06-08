// src/pages/NotFoundPage.tsx
import React from "react";

const NotFoundPage: React.FC = () => {
  return (
    <div className="p-10 text-center">
      <h1 className="text-3xl font-bold">404 - Page not found</h1>
      <p className="mt-4">Sorry, the page you are looking for does not exist.</p>
    </div>
  );
};

export default NotFoundPage;
