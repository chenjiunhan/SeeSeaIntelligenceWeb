'use client'

export default function StatsPanel() {
  const stats = [
    { label: '在航船舶', value: '24,573', icon: '🚢', trend: '+2.3%' },
    { label: '主要航線', value: '1,247', icon: '🗺️', trend: '+0.8%' },
    { label: '準點率', value: '89%', icon: '⏱️', trend: '-1.2%' },
    { label: '平均運費/TEU', value: '$2,145', icon: '💰', trend: '+5.4%' }
  ]

  return (
    <div className="absolute top-24 left-6 z-20 flex gap-4">
      {stats.map((stat, index) => (
        <div
          key={index}
          className="bg-slate-800/90 backdrop-blur-md px-5 py-4 rounded-xl border border-slate-700 hover:border-cyan-500/50 transition-all duration-300 hover:scale-105 cursor-pointer group min-w-[140px]"
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl group-hover:scale-110 transition-transform">{stat.icon}</span>
            <span className={`text-xs font-semibold ${
              stat.trend.startsWith('+') ? 'text-green-400' : 'text-red-400'
            }`}>
              {stat.trend}
            </span>
          </div>
          <div className="text-3xl font-bold text-cyan-300 mb-1">
            {stat.value}
          </div>
          <div className="text-xs text-slate-400">
            {stat.label}
          </div>
        </div>
      ))}
    </div>
  )
}
