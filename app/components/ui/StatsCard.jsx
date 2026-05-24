// app/components/ui/StatsCard.jsx
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/solid';

export default function StatsCard({ title, value, icon, trend, trendValue, color = 'primary' }) {
  const colorClasses = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-green-100 text-green-700',
    danger: 'bg-red-100 text-red-700',
    warning: 'bg-yellow-100 text-yellow-700',
  };
  return (
    <div className="stat-card group">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-3xl font-bold mt-1">{value}</p>
          {trend && (
            <div className="flex items-center gap-1 mt-2 text-xs">
              {trend === 'up' ? <ArrowTrendingUpIcon className="w-4 h-4 text-green-600" /> : <ArrowTrendingDownIcon className="w-4 h-4 text-red-600" />}
              <span className={trend === 'up' ? 'text-green-600' : 'text-red-600'}>{trendValue}</span>
              <span className="text-gray-400">vs last month</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-xl ${colorClasses[color]}`}>{icon}</div>
      </div>
    </div>
  );
}