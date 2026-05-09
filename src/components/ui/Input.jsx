'use client';

import React, { useState } from 'react';

const Input = ({
  label,
  error,
  type = 'text',
  placeholder,
  value,
  onChange,
  onAISuggest,
  showAIButton = false,
  className = '',
  ...props
}) => {
  const [focused, setFocused] = useState(false);

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className={`w-full px-4 py-2.5 border-2 rounded-lg transition-all duration-200 focus:outline-none ${
            focused ? 'border-blue-500' : 'border-gray-300'
          } ${error ? 'border-red-500' : ''} text-gray-900 placeholder-gray-400 ${className}`}
          {...props}
        />
        {showAIButton && (
          <button
            type="button"
            onClick={onAISuggest}
            className="absolute right-3 text-blue-600 hover:text-blue-700 transition-colors"
            title="Get AI suggestion"
          >
            <svg
              className="w-5 h-5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M10 2a8 8 0 100 16 8 8 0 000-16zM9 6a1 1 0 11-2 0 1 1 0 012 0zm0 8a1 1 0 11-2 0 1 1 0 012 0zm4-4a1 1 0 11-2 0 1 1 0 012 0zm4 0a1 1 0 11-2 0 1 1 0 012 0z" />
            </svg>
          </button>
        )}
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

Input.propTypes = {
  label: require('prop-types').string,
  error: require('prop-types').string,
  type: require('prop-types').string,
  placeholder: require('prop-types').string,
  value: require('prop-types').string,
  onChange: require('prop-types').func.isRequired,
  onAISuggest: require('prop-types').func,
  showAIButton: require('prop-types').bool,
  className: require('prop-types').string,
};

export default Input;
