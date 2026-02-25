
import React from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  sub: string;
  icon: React.ReactNode;
  valueColor?: string;
}

export function StatsCard({ title, value, sub, icon, valueColor = "text-slate-900" }: StatsCardProps) {
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <h4 className="text-slate-500 text-sm font-medium">{title}</h4>
        <div className="opacity-80">{icon}</div>
      </div>
      <div className={`text-2xl font-bold mb-1 ${valueColor}`}>{value}</div>
      <div className="text-xs text-slate-400">{sub}</div>
    </div>
  );
}