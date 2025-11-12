import React from "react";

interface CardProps {
  title: string;
  value: number;
}

export const Card: React.FC<CardProps> = ({ title, value }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 flex flex-col items-center justify-center">
      <h3 className="text-lg font-semibold text-gray-600">{title}</h3>
      <p className="text-4xl font-bold text-gray-800">{value}</p>
    </div>
  );
};
