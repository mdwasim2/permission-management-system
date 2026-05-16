"use client";

import React from "react";

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}

const CheckIcon = () => (
  <svg
    viewBox="0 0 24 24"
    className="h-3 w-3 text-white"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M20 6L9 17L4 12"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const Checkbox: React.FC<CheckboxProps> = ({
  checked,
  onChange,
  label,
  disabled = false,
  className = "",
}) => {
  return (
    <label
      className={`inline-flex items-center gap-2.5 cursor-pointer ${disabled ? "opacity-50" : ""}`}
    >
      <div className="relative">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="sr-only"
        />
        <div
          className={`h-5 w-5 rounded-lg border-2 transition-all duration-200 flex items-center justify-center ${
            checked
              ? "bg-[#ff6b3d] border-[#ff6b3d]"
              : "border-[#d4d8e0] bg-white hover:border-[#c0c5ce]"
          } ${className}`}
        >
          {checked && <CheckIcon />}
        </div>
      </div>
      {label && <span className="text-sm">{label}</span>}
    </label>
  );
};
