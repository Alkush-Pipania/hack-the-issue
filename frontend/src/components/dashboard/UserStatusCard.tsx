import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatusCardProps {
  title: string;
  count: number;
  imagePath: LucideIcon;
  className?: string;
}

const StatusCard = ({ title, count, imagePath, className = '' }: StatusCardProps) => {
  return (
    <div
      className={`rounded-2xl bg-gradient-to-r from-[#004366] to-[#003152] border border-[#FF9800]/20 px-6 py-7 ${className} relative overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-200`}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <h3 className="max-w-[120px] break-words text-sm font-medium leading-tight text-white">{title}</h3>
          <p className="text-3xl font-bold bg-gradient-to-r from-[#FF9800] to-[#FF5722] bg-clip-text text-transparent">{count.toLocaleString()}</p>
        </div>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-[#FF9800]/20 to-[#FF5722]/20 p-3">
          {React.createElement(imagePath, { size: 48, className: "text-[#FF9800]" })}
        </div>
      </div>
    </div>
  );
};

export default StatusCard;
