'use client';

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Chokepoint 位置和資訊
const chokepoints = {
  'suez-canal': {
    lng: 32.35,
    lat: 30.0,
    name: '🌊 蘇伊士運河',
    zoom: 8
  },
  'panama-canal': {
    lng: -79.91,
    lat: 9.08,
    name: '🌊 巴拿馬運河',
    zoom: 9
  },
  'strait-of-malacca': {
    lng: 100.35,
    lat: 2.5,
    name: '🌊 麻六甲海峽',
    zoom: 7
  },
  'strait-of-hormuz': {
    lng: 56.25,
    lat: 26.5,
    name: '🌊 荷莫茲海峽',
    zoom: 8
  },
  'bab-el-mandeb': {
    lng: 43.3,
    lat: 12.6,
    name: '🌊 曼德海峽',
    zoom: 8
  },
  'bosporus-strait': {
    lng: 29.05,
    lat: 41.12,
    name: '🌊 博斯普魯斯海峽',
    zoom: 10
  }
};

type ChokepointId = keyof typeof chokepoints;

interface Message {
  content: string;
  type: 'ai' | 'user';
}

interface VesselData {
  date: string;
  vessel_count: number;
  container: number;
  dry_bulk: number;
  general_cargo: number;
  roro: number;
  tanker: number;
}

export default function MapTestPage() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const currentMarker = useRef<mapboxgl.Marker | null>(null);

  const [currentChokepoint, setCurrentChokepoint] = useState<ChokepointId>('suez-canal');
  const [startDate, setStartDate] = useState('2026-01-01');
  const [endDate, setEndDate] = useState('2026-02-07');
  const [dateInfo, setDateInfo] = useState('請選擇航道與日期範圍...');
  const [statusMessage, setStatusMessage] = useState('資料來源: Go API');
  const [vesselCount, setVesselCount] = useState('--');
  const [avgDaily, setAvgDaily] = useState('--');
  const [vesselTypes, setVesselTypes] = useState<{ label: string; value: string }[]>([]);

  // AI Chat states
  const [messages, setMessages] = useState<Message[]>([
    {
      content: '👋 歡迎來到 SeeSea！我是你的航運智能助手。<br><br>你可以問我：<br>• 「蘇伊士運河最近的船舶流量如何？」<br>• 「為什麼這條航線這麼繁忙？」<br>• 「分析最近一個月的趨勢」',
      type: 'ai'
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isChatMinimized, setIsChatMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Dragging states for stats panel
  const [isDragging, setIsDragging] = useState(false);
  const [panelPosition, setPanelPosition] = useState({ left: 30, top: 80 });
  const dragRef = useRef({ initialX: 0, initialY: 0 });

  // Dragging states for chat box
  const [isChatDragging, setIsChatDragging] = useState(false);
  const [chatPosition, setChatPosition] = useState<{ right?: number; bottom?: number; left?: number; top?: number }>({ right: 30, bottom: 30 });
  const chatDragRef = useRef({ initialX: 0, initialY: 0 });

  const GO_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081';
  const PYTHON_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';
  const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: [32.35, 30.0],
      zoom: 8,
      projection: 'globe' as any
    });

    map.current.on('load', async () => {
      if (!map.current) return;

      // 地球效果
      map.current.setFog({
        color: 'rgb(6, 182, 212)',
        'high-color': 'rgb(2, 132, 199)',
        'horizon-blend': 0.02,
        'space-color': 'rgb(15, 23, 42)',
        'star-intensity': 0.6
      });

      // 載入初始資料並顯示標記
      await loadVesselData(currentChokepoint, startDate, endDate);
      updateChokePointMarker(currentChokepoint);
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Auto-scroll chat messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Update chokepoint marker
  const updateChokePointMarker = (id: ChokepointId) => {
    if (!map.current) return;

    // Remove old marker
    if (currentMarker.current) {
      currentMarker.current.remove();
    }

    const point = chokepoints[id];

    // Create marker element
    const el = document.createElement('div');
    el.className = 'chokepoint-label';
    el.textContent = point.name;
    el.style.cssText = `
      background: rgba(15, 23, 42, 0.95);
      border: 2px solid #06b6d4;
      border-radius: 8px;
      padding: 8px 16px;
      color: #06b6d4;
      font-weight: 600;
      font-size: 14px;
      box-shadow: 0 4px 12px rgba(6, 182, 212, 0.4);
      white-space: nowrap;
    `;

    // Add new marker
    currentMarker.current = new mapboxgl.Marker(el)
      .setLngLat([point.lng, point.lat])
      .addTo(map.current);
  };

  // Switch chokepoint
  const switchChokepoint = async (id: ChokepointId) => {
    if (currentChokepoint === id || !map.current) return;

    setCurrentChokepoint(id);
    const point = chokepoints[id];

    // Update map marker
    updateChokePointMarker(id);

    // Fly to new location
    map.current.flyTo({
      center: [point.lng, point.lat],
      zoom: point.zoom,
      duration: 2000,
      essential: true
    });

    // Load data
    await loadVesselData(id, startDate, endDate);
  };

  // Load vessel data
  const loadVesselData = async (chokepoint: ChokepointId, start: string, end: string) => {
    try {
      setDateInfo('<span class="loading">🔄 載入資料...</span>');

      const url = `${GO_API_URL}/api/v1/vessels/${chokepoint}?start_date=${start}&end_date=${end}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.data && data.data.length > 0) {
        const vesselData: VesselData[] = data.data;

        // Calculate totals and averages
        const totalVessels = vesselData.reduce((sum, d) => sum + d.vessel_count, 0);
        const totalContainer = vesselData.reduce((sum, d) => sum + d.container, 0);
        const totalDryBulk = vesselData.reduce((sum, d) => sum + d.dry_bulk, 0);
        const totalGeneralCargo = vesselData.reduce((sum, d) => sum + d.general_cargo, 0);
        const totalRoro = vesselData.reduce((sum, d) => sum + d.roro, 0);
        const totalTanker = vesselData.reduce((sum, d) => sum + d.tanker, 0);
        const avgDailyValue = (totalVessels / vesselData.length).toFixed(1);

        // Update date range info
        setDateInfo(`📅 ${start} ~ ${end}<br><small style="color:#64748b">${vesselData.length} 天資料</small>`);

        // Update totals and average
        setVesselCount(totalVessels.toLocaleString());
        setAvgDaily(avgDailyValue);

        // Update vessel types
        setVesselTypes([
          { label: '🚢 貨櫃船', value: totalContainer.toLocaleString() },
          { label: '⛴️ 散裝船', value: totalDryBulk.toLocaleString() },
          { label: '🛳️ 雜貨船', value: totalGeneralCargo.toLocaleString() },
          { label: '🚗 滾裝船', value: totalRoro.toLocaleString() },
          { label: '🛢️ 油輪', value: totalTanker.toLocaleString() }
        ]);

        setStatusMessage('<span class="success">✅ 資料載入成功</span>');
      } else {
        setDateInfo('<span class="error">❌ 此日期範圍無資料</span>');
        setVesselCount('0');
        setAvgDaily('0');
        setVesselTypes([]);
      }
    } catch (e: any) {
      setDateInfo('<span class="error">❌ 載入失敗</span>');
      setStatusMessage(`<span class="error">錯誤: ${e.message}</span>`);
      console.error('API Error:', e);
    }
  };

  // Apply date range
  const applyDateRange = async () => {
    if (!startDate || !endDate) {
      alert('請選擇開始和結束日期');
      return;
    }

    if (startDate > endDate) {
      alert('開始日期不能晚於結束日期');
      return;
    }

    await loadVesselData(currentChokepoint, startDate, endDate);
  };

  // Stats panel dragging
  const handlePanelMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'BUTTON' || target.tagName === 'INPUT') {
      return;
    }

    dragRef.current.initialX = e.clientX - panelPosition.left;
    dragRef.current.initialY = e.clientY - panelPosition.top;
    setIsDragging(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        e.preventDefault();
        const newX = e.clientX - dragRef.current.initialX;
        const newY = e.clientY - dragRef.current.initialY;
        setPanelPosition({ left: newX, top: newY });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // Chat box dragging
  const handleChatHeaderMouseDown = (e: React.MouseEvent) => {
    const chatBox = e.currentTarget.parentElement as HTMLElement;
    const rect = chatBox.getBoundingClientRect();
    chatDragRef.current.initialX = e.clientX - rect.left;
    chatDragRef.current.initialY = e.clientY - rect.top;
    setIsChatDragging(true);
  };

  useEffect(() => {
    const handleChatMouseMove = (e: MouseEvent) => {
      if (isChatDragging) {
        e.preventDefault();
        const x = e.clientX - chatDragRef.current.initialX;
        const y = e.clientY - chatDragRef.current.initialY;
        setChatPosition({ left: x, top: y });
      }
    };

    const handleChatMouseUp = () => {
      setIsChatDragging(false);
    };

    if (isChatDragging) {
      document.addEventListener('mousemove', handleChatMouseMove);
      document.addEventListener('mouseup', handleChatMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleChatMouseMove);
      document.removeEventListener('mouseup', handleChatMouseUp);
    };
  }, [isChatDragging]);

  // Send message to AI
  const sendMessage = async () => {
    const message = inputMessage.trim();
    if (!message) return;

    // Add user message
    setMessages(prev => [...prev, { content: message, type: 'user' }]);
    setInputMessage('');

    // Add loading AI message
    const loadingMessageIndex = messages.length + 1;
    setMessages(prev => [...prev, { content: '思考中...', type: 'ai' }]);

    try {
      const response = await fetch(`${PYTHON_API_URL}/api/v1/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: message,
          session_id: 'user-session-' + Date.now()
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader available');

      const decoder = new TextDecoder();
      let buffer = '';
      let aiContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data:')) {
            const data = line.substring(5).trim();
            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                aiContent += parsed.content;
                // Update the last message
                setMessages(prev => {
                  const newMessages = [...prev];
                  newMessages[loadingMessageIndex] = { content: aiContent, type: 'ai' };
                  return newMessages;
                });
              }
            } catch (e) {
              // Ignore parse errors
            }
          }
        }
      }

      if (!aiContent) {
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[loadingMessageIndex] = { content: '抱歉，沒有收到回應', type: 'ai' };
          return newMessages;
        });
      }
    } catch (error: any) {
      console.error('Chat error:', error);
      setMessages(prev => {
        const newMessages = [...prev];
        newMessages[loadingMessageIndex] = { content: '❌ 連接失敗，請確認 Python API 正在運行', type: 'ai' };
        return newMessages;
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  return (
    <>
      <style jsx global>{`
        html, body {
          margin: 0;
          padding: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        .loading { color: #06b6d4; }
        .error { color: #ef4444; }
        .success { color: #10b981; }
      `}</style>

      {/* Map Container */}
      <div ref={mapContainer} style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100%'
      }} />

      {/* Stats Panel */}
      <div
        onMouseDown={handlePanelMouseDown}
        style={{
          position: 'absolute',
          left: `${panelPosition.left}px`,
          top: `${panelPosition.top}px`,
          width: '360px',
          background: 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(10px)',
          color: 'white',
          padding: '24px',
          borderRadius: '16px',
          zIndex: 1000,
          border: '1px solid rgba(6, 182, 212, 0.5)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
          cursor: 'move',
          userSelect: 'none'
        }}
      >
        <h3 style={{
          color: '#06b6d4',
          margin: '0 0 20px 0',
          fontSize: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          {chokepoints[currentChokepoint].name}
        </h3>

        {/* Chokepoint Selector */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '8px',
          marginBottom: '16px'
        }}>
          {(Object.keys(chokepoints) as ChokepointId[]).map((id) => (
            <button
              key={id}
              onClick={() => switchChokepoint(id)}
              style={{
                padding: '10px 12px',
                background: currentChokepoint === id ? 'rgba(6, 182, 212, 0.3)' : 'rgba(6, 182, 212, 0.1)',
                border: currentChokepoint === id ? '1px solid #06b6d4' : '1px solid rgba(6, 182, 212, 0.3)',
                borderRadius: '8px',
                color: currentChokepoint === id ? '#06b6d4' : '#94a3b8',
                cursor: 'pointer',
                transition: 'all 0.3s',
                fontSize: '12px',
                textAlign: 'center',
                whiteSpace: 'nowrap',
                fontWeight: currentChokepoint === id ? 600 : 'normal',
                boxShadow: currentChokepoint === id ? '0 0 20px rgba(6, 182, 212, 0.3)' : 'none'
              }}
            >
              {id === 'suez-canal' && '🇪🇬 蘇伊士運河'}
              {id === 'panama-canal' && '🇵🇦 巴拿馬運河'}
              {id === 'strait-of-malacca' && '🇲🇾 麻六甲海峽'}
              {id === 'strait-of-hormuz' && '🇮🇷 荷莫茲海峽'}
              {id === 'bab-el-mandeb' && '🇾🇪 曼德海峽'}
              {id === 'bosporus-strait' && '🇹🇷 博斯普魯斯'}
            </button>
          ))}
        </div>

        {/* Date Range Selector */}
        <div style={{
          marginBottom: '16px',
          padding: '16px',
          background: 'rgba(6, 182, 212, 0.05)',
          borderRadius: '8px',
          border: '1px solid rgba(6, 182, 212, 0.2)'
        }}>
          <span style={{
            fontSize: '12px',
            color: '#94a3b8',
            marginBottom: '8px',
            display: 'block'
          }}>📅 選擇日期範圍</span>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px',
            marginBottom: '10px'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '11px', color: '#64748b' }}>開始日期</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{
                  padding: '8px',
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(6, 182, 212, 0.3)',
                  borderRadius: '6px',
                  color: '#06b6d4',
                  fontSize: '12px',
                  fontFamily: 'monospace'
                }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '11px', color: '#64748b' }}>結束日期</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={{
                  padding: '8px',
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(6, 182, 212, 0.3)',
                  borderRadius: '6px',
                  color: '#06b6d4',
                  fontSize: '12px',
                  fontFamily: 'monospace'
                }}
              />
            </div>
          </div>

          <button
            onClick={applyDateRange}
            style={{
              width: '100%',
              padding: '8px',
              background: 'rgba(6, 182, 212, 0.2)',
              border: '1px solid rgba(6, 182, 212, 0.5)',
              borderRadius: '6px',
              color: '#06b6d4',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 600,
              transition: 'all 0.3s'
            }}
          >
            🔍 查詢
          </button>
        </div>

        {/* Date Info */}
        <div
          style={{
            fontSize: '13px',
            color: '#94a3b8',
            marginBottom: '20px',
            padding: '10px',
            background: 'rgba(6, 182, 212, 0.1)',
            borderRadius: '8px',
            borderLeft: '3px solid #06b6d4'
          }}
          dangerouslySetInnerHTML={{ __html: dateInfo }}
        />

        {/* Stats */}
        <div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 0',
            borderBottom: '1px solid rgba(148, 163, 184, 0.1)'
          }}>
            <span style={{ fontSize: '14px', color: '#94a3b8' }}>📊 總船舶數</span>
            <span style={{ fontSize: '18px', fontWeight: 600, color: '#06b6d4' }}>{vesselCount}</span>
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 0',
            borderBottom: '1px solid rgba(148, 163, 184, 0.1)'
          }}>
            <span style={{ fontSize: '14px', color: '#94a3b8' }}>📈 平均每日</span>
            <span style={{ fontSize: '18px', fontWeight: 600, color: '#06b6d4' }}>{avgDaily}</span>
          </div>

          {/* Vessel Types */}
          {vesselTypes.length > 0 && (
            <div style={{
              marginTop: '16px',
              paddingTop: '16px',
              borderTop: '1px solid rgba(148, 163, 184, 0.2)'
            }}>
              {vesselTypes.map((type, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 0',
                    fontSize: '13px'
                  }}
                >
                  <span style={{ color: '#cbd5e1' }}>{type.label}</span>
                  <span style={{ color: '#10b981', fontWeight: 600 }}>{type.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Status */}
        <div
          style={{
            marginTop: '16px',
            fontSize: '11px',
            color: '#64748b',
            textAlign: 'center'
          }}
          dangerouslySetInnerHTML={{ __html: statusMessage }}
        />
      </div>

      {/* AI Chat Box */}
      <div style={{
        position: 'fixed',
        ...(chatPosition.right !== undefined ? { right: `${chatPosition.right}px` } : { left: `${chatPosition.left}px` }),
        ...(chatPosition.bottom !== undefined ? { bottom: `${chatPosition.bottom}px` } : { top: `${chatPosition.top}px` }),
        width: '400px',
        background: 'rgba(15, 23, 42, 0.95)',
        backdropFilter: 'blur(10px)',
        borderRadius: '16px',
        border: '1px solid rgba(6, 182, 212, 0.5)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
        zIndex: 1001,
        display: 'flex',
        flexDirection: 'column',
        height: isChatMinimized ? 'auto' : undefined
      }}>
        {/* Chat Header */}
        <div
          onMouseDown={handleChatHeaderMouseDown}
          style={{
            padding: '16px',
            background: 'rgba(30, 41, 59, 0.8)',
            borderRadius: '16px 16px 0 0',
            borderBottom: '1px solid rgba(148, 163, 184, 0.2)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'move',
            userSelect: 'none'
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            color: '#06b6d4',
            fontWeight: 600,
            fontSize: '16px'
          }}>
            <span>🤖</span>
            <span>AI 航運助手</span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setIsChatMinimized(!isChatMinimized)}
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                border: 'none',
                background: 'transparent',
                color: '#94a3b8',
                cursor: 'pointer',
                transition: 'all 0.3s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              ─
            </button>
          </div>
        </div>

        {/* Chat Messages */}
        {!isChatMinimized && (
          <>
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '16px',
              maxHeight: '400px',
              minHeight: '300px'
            }}>
              {messages.map((msg, index) => (
                <div
                  key={index}
                  style={{
                    marginBottom: '16px',
                    display: 'flex',
                    gap: '10px',
                    flexDirection: msg.type === 'user' ? 'row-reverse' : 'row'
                  }}
                >
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'rgba(6, 182, 212, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    flexShrink: 0
                  }}>
                    {msg.type === 'ai' ? '🤖' : '👤'}
                  </div>
                  <div
                    style={{
                      maxWidth: '75%',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      fontSize: '14px',
                      lineHeight: 1.6,
                      background: msg.type === 'ai' ? 'rgba(30, 41, 59, 0.8)' : 'rgba(6, 182, 212, 0.3)',
                      color: msg.type === 'ai' ? '#e2e8f0' : '#ffffff'
                    }}
                    dangerouslySetInnerHTML={{ __html: msg.content }}
                  />
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input */}
            <div style={{
              padding: '16px',
              borderTop: '1px solid rgba(148, 163, 184, 0.2)',
              display: 'flex',
              gap: '8px'
            }}>
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="問我任何關於航運的問題..."
                style={{
                  flex: 1,
                  padding: '12px',
                  background: 'rgba(30, 41, 59, 0.6)',
                  border: '1px solid rgba(6, 182, 212, 0.3)',
                  borderRadius: '8px',
                  color: '#e2e8f0',
                  fontSize: '14px'
                }}
              />
              <button
                onClick={sendMessage}
                style={{
                  padding: '12px 20px',
                  background: '#06b6d4',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.3s'
                }}
              >
                發送
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
