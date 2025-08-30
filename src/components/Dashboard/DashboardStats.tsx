import React, { useState, useEffect } from 'react';
import { Users, Building, AlertTriangle, UserCheck, CreditCard, Home } from 'lucide-react';
import { DashboardStats as StatsType } from '../../types';
import apiClient from '../../api/client';

const DashboardStats: React.FC = () => {
  const [stats, setStats] = useState<StatsType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const data = await apiClient.getDashboardStats();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-8">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white p-6 rounded-xl shadow-sm animate-pulse">
            <div className="h-12 w-12 bg-gray-200 rounded-lg mb-4"></div>
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-6 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Students',
      value: stats?.total_students || 0,
      icon: Users,
      color: 'bg-blue-500',
      textColor: 'text-blue-600'
    },
    {
      title: 'Total Rooms',
      value: stats?.total_rooms || 0,
      icon: Home,
      color: 'bg-purple-500',
      textColor: 'text-purple-600'
    },
    {
      title: 'Available Rooms',
      value: stats?.available_rooms || 0,
      icon: Building,
      color: 'bg-green-500',
      textColor: 'text-green-600'
    },
    {
      title: 'Open Complaints',
      value: stats?.open_complaints || 0,
      icon: AlertTriangle,
      color: 'bg-orange-500',
      textColor: 'text-orange-600'
    },
    {
      title: 'Current Visitors',
      value: stats?.current_visitors || 0,
      icon: UserCheck,
      color: 'bg-teal-500',
      textColor: 'text-teal-600'
    },
    {
      title: 'Pending Fees',
      value: `₹${(stats?.pending_fees || 0).toLocaleString()}`,
      icon: CreditCard,
      color: 'bg-red-500',
      textColor: 'text-red-600'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-8">
      {statCards.map((card, index) => {
        const Icon = card.icon;
        return (
          <div key={index} className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <div className={`w-12 h-12 ${card.color} rounded-lg flex items-center justify-center mb-4`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-sm font-medium text-gray-600 mb-1">{card.title}</h3>
            <p className={`text-2xl font-bold ${card.textColor}`}>{card.value}</p>
          </div>
        );
      })}
    </div>
  );
};

export default DashboardStats;