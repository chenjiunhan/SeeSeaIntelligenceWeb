'use client'

import { useState } from 'react'
import ShippingMap from './ShippingMap'
import StatsPanel from './StatsPanel'
import TimelineControl from './TimelineControl'
import AIChatBox from './AIChatBox'

export default function ShippingDashboard() {
  const [selectedShip, setSelectedShip] = useState<string | null>(null)

  return (
    <div className="relative h-full w-full">
      {/* 頂部導航 */}
      <nav className="absolute top-0 left-0 right-0 z-10 bg-slate-900/90 backdrop-blur-sm border-b border-slate-700">
        <div className="px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-cyan-400 flex items-center gap-2">
            <span>🌊</span>
            <span>SeeSea</span>
          </h1>
          <div className="flex gap-4">
            <button className="px-4 py-2 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30 transition-colors">
              航運
            </button>
            <button className="px-4 py-2 rounded-lg text-slate-400 hover:text-slate-200 transition-colors">
              能源
            </button>
            <button className="px-4 py-2 rounded-lg text-slate-400 hover:text-slate-200 transition-colors">
              金融
            </button>
          </div>
          <button className="px-4 py-2 rounded-full bg-slate-800 hover:bg-slate-700 transition-colors">
            🌙
          </button>
        </div>
      </nav>

      {/* 主視覺化區域 */}
      <div className="h-full w-full pt-20">
        <ShippingMap onShipClick={setSelectedShip} selectedShip={selectedShip} />
      </div>

      {/* 關鍵指標面板 */}
      <StatsPanel />

      {/* 時間軸控制 */}
      <TimelineControl />

      {/* AI 對話框（可拖曳） */}
      <AIChatBox />
    </div>
  )
}
