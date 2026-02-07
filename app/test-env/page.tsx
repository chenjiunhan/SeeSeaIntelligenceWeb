export default function TestEnv() {
  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>環境變數測試</h1>
      <pre>
        NEXT_PUBLIC_API_URL: {process.env.NEXT_PUBLIC_API_URL || '❌ undefined'}
        {'\n'}
        NEXT_PUBLIC_GO_API_URL: {process.env.NEXT_PUBLIC_GO_API_URL || '❌ undefined'}
        {'\n'}
        NEXT_PUBLIC_PYTHON_API_URL: {process.env.NEXT_PUBLIC_PYTHON_API_URL || '❌ undefined'}
        {'\n'}
        NEXT_PUBLIC_MAPBOX_TOKEN: {process.env.NEXT_PUBLIC_MAPBOX_TOKEN ? '✅ 已設定' : '❌ undefined'}
      </pre>
    </div>
  )
}
