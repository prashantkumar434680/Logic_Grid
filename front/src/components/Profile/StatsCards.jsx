import { TrendingUp } from 'lucide-react';

export default function StatsCards() {
  const stats = [
    {
      label: 'Total Problems Solved',
      value: 148,
      icon: '✓',
      bgGradient: 'from-cyan-500/10 to-blue-500/10',
      borderColor: 'border-cyan-500/30',
      textColor: 'text-cyan-400',
      hoverBg: 'hover:from-cyan-500/20 hover:to-blue-500/20',
    },
    {
      label: 'Easy',
      value: 82,
      icon: '●',
      bgGradient: 'from-green-500/10 to-emerald-500/10',
      borderColor: 'border-green-500/30',
      textColor: 'text-green-400',
      hoverBg: 'hover:from-green-500/20 hover:to-emerald-500/20',
    },
    {
      label: 'Medium',
      value: 45,
      icon: '●',
      bgGradient: 'from-yellow-500/10 to-amber-500/10',
      borderColor: 'border-yellow-500/30',
      textColor: 'text-yellow-400',
      hoverBg: 'hover:from-yellow-500/20 hover:to-amber-500/20',
    },
    {
      label: 'Hard',
      value: 21,
      icon: '●',
      bgGradient: 'from-red-500/10 to-pink-500/10',
      borderColor: 'border-red-500/30',
      textColor: 'text-red-400',
      hoverBg: 'hover:from-red-500/20 hover:to-pink-500/20',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, idx) => (
        <div
          key={idx}
          className={`bg-gradient-to-br ${stat.bgGradient} backdrop-blur-sm rounded-xl p-6 border ${stat.borderColor} shadow-lg transition-all duration-300 ${stat.hoverBg} hover:shadow-xl hover:shadow-cyan-500/10 transform hover:scale-105`}
        >
          <div className="flex items-start justify-between mb-3">
            <span className={`text-3xl font-bold ${stat.textColor}`}>
              {stat.icon}
            </span>
            <TrendingUp className={`w-5 h-5 ${stat.textColor} opacity-50`} />
          </div>

          <div className="text-slate-300 text-sm font-medium mb-1">
            {stat.label}
          </div>
          <div className={`text-4xl font-bold ${stat.textColor}`}>
            {stat.value}
          </div>
          {idx === 0 && (
            <div className="text-xs text-slate-400 mt-2 flex items-center gap-1">
              📈 +5 this month
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
