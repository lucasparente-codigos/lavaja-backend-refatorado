import React from "react";

export const FormContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-50 to-white px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {children}
      </div>
    </div>
  );
};