'use client'

import { useRef, useEffect, useState } from 'react'

interface ShippingMapProps {
  onShipClick: (shipId: string) => void
  selectedShip: string | null
}

const MAPBOX_TOKEN = 'pk.eyJ1IjoiamFxcTEwMTAiLCJhIjoiY21sY2QzdHppMHZ4dTNmcjRjb3dtNmpzcCJ9.SibRmPbOquDAtwbuWD7aSw'

export default function ShippingMap({ onShipClick, selectedShip }: ShippingMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<any>(null)
  const [mapLoaded, setMapLoaded] = useState(false)

  useEffect(() => {
    if (map.current) return // 已經初始化了

    // 動態載入 Mapbox GL JS
    const script = document.createElement('script')
    script.src = 'https://api.mapbox.com/mapbox-gl-js/v3.0.1/mapbox-gl.js'
    script.async = true

    script.onload = () => {
      if (!mapContainer.current) return

      // @ts-ignore
      const mapboxgl = window.mapboxgl
      mapboxgl.accessToken = MAPBOX_TOKEN

      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/satellite-streets-v12',
        center: [120, 25],
        zoom: 2,
        projection: 'globe'
      })

      map.current.on('load', () => {
        console.log('✅ Mapbox 地圖載入成功！')
        setMapLoaded(true)

        // 設定大氣層效果
        map.current.setFog({
          color: 'rgb(6, 182, 212)',
          'high-color': 'rgb(2, 132, 199)',
          'horizon-blend': 0.02,
          'space-color': 'rgb(15, 23, 42)',
          'star-intensity': 0.6
        })

        // 添加船舶標記
        const ships = [
          { id: '1', name: 'MAERSK ALPHA', coords: [121.5, 31.2] as [number, number] },
          { id: '2', name: 'EVERGREEN BETA', coords: [4.4, 51.9] as [number, number] },
          { id: '3', name: 'COSCO GAMMA', coords: [-118.2, 33.7] as [number, number] }
        ]

        ships.forEach(ship => {
          const el = document.createElement('div')
          el.innerHTML = '🚢'
          el.style.fontSize = '48px'
          el.style.cursor = 'pointer'
          el.style.filter = 'drop-shadow(0 0 10px rgba(6, 182, 212, 0.8))'

          el.addEventListener('click', () => {
            onShipClick(ship.id)
          })

          new mapboxgl.Marker(el)
            .setLngLat(ship.coords)
            .setPopup(
              new mapboxgl.Popup({ offset: 25 })
                .setHTML(`<div style="color: #06b6d4; font-weight: bold; padding: 10px;">${ship.name}</div>`)
            )
            .addTo(map.current)
        })
      })
    }

    document.head.appendChild(script)

    return () => {
      if (map.current) {
        map.current.remove()
      }
    }
  }, [onShipClick])

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />

      {/* 狀態顯示 */}
      <div
        style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          background: 'rgba(0, 0, 0, 0.85)',
          color: 'white',
          padding: '16px',
          borderRadius: '12px',
          zIndex: 1000,
          fontFamily: 'monospace',
          fontSize: '13px',
          border: '1px solid rgba(6, 182, 212, 0.5)'
        }}
      >
        <div style={{ marginBottom: '12px', fontWeight: 'bold', color: '#06b6d4', fontSize: '16px' }}>
          🌍 全球航運地圖
        </div>
        <div style={{ color: '#94a3b8' }}>
          Token: {MAPBOX_TOKEN.substring(0, 20)}...
        </div>
        <div style={{ marginTop: '10px', color: mapLoaded ? '#10b981' : '#fbbf24', fontWeight: 'bold' }}>
          {mapLoaded ? '✅ 地圖已載入' : '⏳ 載入中...'}
        </div>
        <div style={{ marginTop: '8px', fontSize: '11px', color: '#94a3b8' }}>
          {mapLoaded ? '🚢 點擊船舶查看資訊' : '請稍候...'}
        </div>
      </div>
    </div>
  )
}
