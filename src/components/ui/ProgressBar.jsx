'use client';

import React from 'react';

const ProgressBar = ({
  progress = 0,
  label,
  showLabel = true,
  color = 'blue',
  height = 'md',
  animated = true,
}) => {
  const normalizedProgress = Math.min(Math.max(progress, 0), 100);

  const colorClasses = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    yellow: 'bg-yellow-600',
    red: 'bg-red-600',
    purple: 'bg-purple-600',
  };

  const heightClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  };

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">
            {label || 'Progress'}
          </span>
          <span className="text-sm font-semibold text-gray-700">
            {normalizedProgress}%
          </span>
        </div>
      )}

      <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${heightClasses[height]}`}>
        <div
          className={`${colorClasses[color]} ${heightClasses[height]} rounded-full transition-all duration-500 ease-out ${
            animated ? 'transition-all' : ''
          }`}
          style={{ width: `${normalizedProgress}%` }}
        />
      </div>
    </div>
  );
};

ProgressBar.propTypes = {
  progress: require('prop-types').number,
  label: require('prop-types').string,
  showLabel: require('prop-types').bool,
  color: require('prop-types').oneOf(['blue', 'green', 'yellow', 'red', 'purple']),
  height: require('prop-types').oneOf(['sm', 'md', 'lg']),
  animated: require('prop-types').bool,
};

export default ProgressBar;
