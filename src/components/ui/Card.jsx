'use client';

import React from 'react';

const Card = ({
  children,
  header,
  footer,
  className = '',
  onClick,
  hoverable = false,
}) => {
  return (
    <div
      className={`bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden ${
        hoverable ? 'hover:shadow-md transition-shadow cursor-pointer' : ''
      } ${className}`}
      onClick={onClick}
    >
      {header && (
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          {typeof header === 'string' ? (
            <h3 className="text-lg font-semibold text-gray-900">{header}</h3>
          ) : (
            header
          )}
        </div>
      )}

      <div className="px-6 py-4">
        {children}
      </div>

      {footer && (
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          {typeof footer === 'string' ? (
            <p className="text-sm text-gray-600">{footer}</p>
          ) : (
            footer
          )}
        </div>
      )}
    </div>
  );
};

Card.propTypes = {
  children: require('prop-types').node,
  header: require('prop-types').oneOfType([require('prop-types').string, require('prop-types').node]),
  footer: require('prop-types').oneOfType([require('prop-types').string, require('prop-types').node]),
  className: require('prop-types').string,
  onClick: require('prop-types').func,
  hoverable: require('prop-types').bool,
};

export default Card;
