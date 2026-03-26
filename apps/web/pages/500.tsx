export default function InternalServerError() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        fontFamily: 'system-ui, sans-serif',
        gap: '16px',
      }}
    >
      <h1 style={{ fontSize: '72px', fontWeight: 700, margin: 0, color: '#0a1628' }}>500</h1>
      <p style={{ fontSize: '18px', color: '#6b7280', margin: 0 }}>Something went wrong</p>
      <a
        href="/"
        style={{
          marginTop: '8px',
          padding: '10px 24px',
          background: '#0a1628',
          color: '#fff',
          borderRadius: '8px',
          textDecoration: 'none',
          fontSize: '14px',
        }}
      >
        Go home
      </a>
    </div>
  )
}
