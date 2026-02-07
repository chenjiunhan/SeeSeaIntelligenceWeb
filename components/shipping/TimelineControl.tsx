'use client'

import { useState } from 'react'

export default function TimelineControl() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [timeValue, setTimeValue] = useState(50)
  const [playbackSpeed, setPlaybackSpeed] = useState('1')

  const formatTime = (value: number) => {
    const date = new Date('2024-02-07')
    date.setHours(Math.floor(value / 4))
    return `${date.toLocaleDateString('zh-TW', { month: '2-digit', day: '2-digit' })} ${date.getHours().toString().padStart(2, '0')}:00 UTC`
  }

  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20">
      <div className="bg-slate-800/90 backdrop-blur-md px-6 py-4 rounded-xl border border-slate-700 shadow-2xl">
        <div className="flex items-center gap-4">
          {/* 播放控制按鈕 */}
          <div className="flex gap-2">
            <button className="w-10 h-10 rounded-lg bg-slate-700 hover:bg-slate-600 text-cyan-300 flex items-center justify-center transition-colors">
              ⏮
            </button>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-10 h-10 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white flex items-center justify-center transition-colors"
            >
              {isPlaying ? '⏸' : '▶️'}
            </button>
            <button className="w-10 h-10 rounded-lg bg-slate-700 hover:bg-slate-600 text-cyan-300 flex items-center justify-center transition-colors">
              ⏭
            </button>
          </div>

          {/* 時間軸滑桿 */}
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="0"
              max="100"
              value={timeValue}
              onChange={(e) => setTimeValue(Number(e.target.value))}
              className="w-96 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider"
              style={{
                background: `linear-gradient(to right, #06b6d4 0%, #06b6d4 ${timeValue}%, #334155 ${timeValue}%, #334155 100%)`
              }}
            />
            <span className="text-sm text-cyan-300 font-mono min-w-[180px]">
              {formatTime(timeValue)}
            </span>
          </div>

          {/* 速度控制 */}
          <select
            value={playbackSpeed}
            onChange={(e) => setPlaybackSpeed(e.target.value)}
            className="px-3 py-2 rounded-lg bg-slate-700 text-slate-200 text-sm border border-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
          >
            <option value="0.5">0.5x</option>
            <option value="1">1x</option>
            <option value="2">2x</option>
            <option value="5">5x</option>
          </select>
        </div>
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #06b6d4;
          cursor: pointer;
          box-shadow: 0 0 10px rgba(6, 182, 212, 0.5);
          transition: all 0.2s;
        }
        .slider::-webkit-slider-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 0 15px rgba(6, 182, 212, 0.8);
        }
        .slider::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #06b6d4;
          cursor: pointer;
          border: none;
          box-shadow: 0 0 10px rgba(6, 182, 212, 0.5);
          transition: all 0.2s;
        }
        .slider::-moz-range-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 0 15px rgba(6, 182, 212, 0.8);
        }
      `}</style>
    </div>
  )
}
