'use client';
import { useState } from 'react';
import React from 'react';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  content: React.ReactNode;
}

interface TabsProps {
  items: TabItem[];
  defaultTab?: string;
  className?: string;
}

export default function Tabs({ items, defaultTab, className = '' }: TabsProps) {
  const [active, setActive] = useState(defaultTab ?? items[0]?.id);
  const current = items.find((t) => t.id === active);

  return (
    <div className={className}>
      <div className="flex gap-1 border-b border-gray-100 mb-5 overflow-x-auto">
        {items.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px
              ${active === tab.id
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>
      <div>{current?.content}</div>
    </div>
  );
}
