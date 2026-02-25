import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  color?: 'green' | 'blue' | 'yellow' | 'red' | 'purple' | 'gray' | 'indigo';
  size?: 'sm' | 'md';
  className?: string;
}

const colorClasses = {
  green: 'bg-green-100 text-green-700 border-green-200',
  blue: 'bg-blue-100 text-blue-700 border-blue-200',
  yellow: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  red: 'bg-red-100 text-red-700 border-red-200',
  purple: 'bg-purple-100 text-purple-700 border-purple-200',
  gray: 'bg-gray-100 text-gray-600 border-gray-200',
  indigo: 'bg-indigo-100 text-indigo-700 border-indigo-200',
};

const sizeClasses = { sm: 'px-2 py-0.5 text-xs', md: 'px-3 py-1 text-xs' };

export default function Badge({ children, color = 'gray', size = 'sm', className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-full border font-medium ${colorClasses[color]} ${sizeClasses[size]} ${className}`}>
      {children}
    </span>
  );
}
