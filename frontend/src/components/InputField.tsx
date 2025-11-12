import React from "react";

interface InputFieldProps {
  label: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
}

export const InputField: React.FC<InputFieldProps> = ({ 
  label, 
  type = "text", 
  placeholder, 
  value, 
  onChange, 
  error,
  required = false,
  disabled = false
}) => {
  return (
    <div className="flex flex-col w-full">
      <label className="mb-2 text-gray-700 font-medium text-sm">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        disabled={disabled}
        className={`border rounded-lg p-3 w-full focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition-all duration-200 ${
          error 
            ? "border-red-400 bg-red-50" 
            : "border-gray-300"
        } ${
          disabled 
            ? "bg-gray-100 cursor-not-allowed" 
            : ""
        }`}
      />
      {error && (
        <span className="text-red-500 text-sm mt-1 flex items-center">
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </span>
      )}
    </div>
  );
};

