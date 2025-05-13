'use client';

import React from 'react';


import { statsData } from './mockdata';
import StatusCard from './UserStatusCard';


const DashboardStats = () => {
  
  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-semibold text-orange-500">Welcome Alkush!</h1>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-5">
        {statsData.map((stat : any, index : any) => (
          <StatusCard key={index} title={stat.title} count={stat.count} imagePath={stat.icon} />
        ))}
      </div>
    </div>
  );
};

export default DashboardStats;
