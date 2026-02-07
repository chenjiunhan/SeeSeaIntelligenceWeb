'use client'

import { useState, useRef, useEffect } from 'react'

interface Message {
  id: string
  type: 'user' | 'ai'
  content: string
  timestamp: Date
}

export default function AIChatBox() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content: '👋 歡迎來到 SeeSea！我是你的航運智能助手。\n\n你可以問我：\n• 「為什麼這條航線這麼繁忙？」\n• 「顯示過去一週的延誤熱點」\n• 「比較洛杉磯港和長灘港的效率」',
      timestamp: new Date()
    },
    {
      id: '2',
      type: 'user',
      content: 'iPhone 怎麼從中國運到美國？',
      timestamp: new Date()
    },
    {
      id: '3',
      type: 'ai',
      content: '讓我帶你看一趟跨太平洋的旅程！📱🚢\n\n主要路線：\n1. **深圳/上海港** → 裝櫃（1-2天）\n2. **跨太平洋航線** → 海運（12-16天）\n3. **洛杉磯/長灘港** → 清關卸貨（2-3天）\n4. **內陸運輸** → 配送（1-3天）\n\n💡 已在地圖上高亮顯示相關航線',
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [isMinimized, setIsMinimized] = useState(false)
  const [position, setPosition] = useState({ x: 20, y: 100 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

  const chatBoxRef = useRef<HTMLDivElement>(null)
  const chatContentRef = useRef<HTMLDivElement>(null)

  // 拖曳功能
  const handleMouseDown = (e: React.MouseEvent) => {
    if (chatBoxRef.current) {
      const rect = chatBoxRef.current.getBoundingClientRect()
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      })
      setIsDragging(true)
    }
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y
        })
      }
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, dragOffset])

  // 自動滾動到底部
  useEffect(() => {
    if (chatContentRef.current) {
      chatContentRef.current.scrollTop = chatContentRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = async () => {
    if (!input.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMessage])
    setInput('')

    // Create placeholder for AI response
    const aiMessageId = (Date.now() + 1).toString()
    const aiMessage: Message = {
      id: aiMessageId,
      type: 'ai',
      content: '',
      timestamp: new Date()
    }
    setMessages(prev => [...prev, aiMessage])

    try {
      // Connect to SSE stream
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'
      const response = await fetch(`${API_URL}/api/v1/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input,
          session_id: 'user-session-' + Date.now()
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('Response body is null')
      }

      let buffer = ''
      let aiContent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('event:')) {
            // Event type parsing (for future use)
            continue
          }

          if (line.startsWith('data:')) {
            const data = line.substring(5).trim()

            try {
              const parsed = JSON.parse(data)

              if (parsed.content) {
                // Stream AI content
                aiContent += parsed.content
                setMessages(prev =>
                  prev.map(msg =>
                    msg.id === aiMessageId
                      ? { ...msg, content: aiContent }
                      : msg
                  )
                )
              } else if (parsed.tool) {
                // Show tool being used
                console.log('Tool called:', parsed.tool, parsed.args)
              } else if (parsed.error) {
                // Handle error
                console.error('Stream error:', parsed.error)
                setMessages(prev =>
                  prev.map(msg =>
                    msg.id === aiMessageId
                      ? { ...msg, content: `錯誤：${parsed.error}` }
                      : msg
                  )
                )
              }
            } catch (e) {
              // Ignore parse errors for non-JSON data
            }
          }
        }
      }

      // If no content was received, show error
      if (!aiContent) {
        setMessages(prev =>
          prev.map(msg =>
            msg.id === aiMessageId
              ? { ...msg, content: '抱歉，沒有收到回應' }
              : msg
          )
        )
      }

    } catch (error) {
      console.error('Chat error:', error)
      setMessages(prev =>
        prev.map(msg =>
          msg.id === aiMessageId
            ? { ...msg, content: '連接失敗，請稍後再試' }
            : msg
        )
      )
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div
      ref={chatBoxRef}
      className="fixed z-50 flex flex-col bg-slate-800/95 backdrop-blur-md rounded-xl shadow-2xl border border-slate-700"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: '420px',
        height: isMinimized ? 'auto' : '600px',
        cursor: isDragging ? 'grabbing' : 'default'
      }}
    >
      {/* 頭部（可拖曳區域） */}
      <div
        className="flex items-center justify-between px-4 py-3 bg-slate-700/50 rounded-t-xl cursor-grab active:cursor-grabbing border-b border-slate-600"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-2 text-cyan-300 font-semibold">
          <span className="text-xl">🤖</span>
          <span>AI 航運助手</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="w-7 h-7 rounded hover:bg-slate-600 transition-colors text-slate-300 flex items-center justify-center"
          >
            {isMinimized ? '□' : '─'}
          </button>
          <button
            className="w-7 h-7 rounded hover:bg-red-500/20 hover:text-red-400 transition-colors text-slate-300 flex items-center justify-center"
          >
            ✕
          </button>
        </div>
      </div>

      {/* 對話內容區 */}
      {!isMinimized && (
        <>
          <div
            ref={chatContentRef}
            className="flex-1 overflow-y-auto p-4 space-y-4"
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex gap-2 max-w-[85%] ${msg.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  {/* 頭像 */}
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-lg">
                    {msg.type === 'ai' ? '🤖' : '👤'}
                  </div>

                  {/* 訊息氣泡 */}
                  <div
                    className={`px-4 py-3 rounded-2xl ${
                      msg.type === 'ai'
                        ? 'bg-slate-700/80 text-slate-100'
                        : 'bg-cyan-600/90 text-white'
                    }`}
                  >
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">
                      {msg.content}
                    </div>

                    {/* AI 訊息的建議按鈕 */}
                    {msg.type === 'ai' && msg.id === '3' && (
                      <div className="flex gap-2 mt-3 flex-wrap">
                        <button className="px-3 py-1.5 text-xs rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30 transition-colors">
                          查看詳細成本
                        </button>
                        <button className="px-3 py-1.5 text-xs rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30 transition-colors">
                          碳排放量
                        </button>
                        <button className="px-3 py-1.5 text-xs rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30 transition-colors">
                          替代路線
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 輸入區 */}
          <div className="p-4 border-t border-slate-700">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="問我任何關於航運的問題..."
                className="flex-1 px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500"
              />
              <button
                onClick={handleSend}
                className="px-5 py-3 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-white font-semibold transition-colors"
              >
                ➤
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
