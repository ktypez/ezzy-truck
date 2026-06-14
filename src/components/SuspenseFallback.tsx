export default function SuspenseFallback() {
  return (
    <div className="card" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--muted)', fontWeight: 500 } as React.CSSProperties}>
      Loading...
    </div>
  )
}
