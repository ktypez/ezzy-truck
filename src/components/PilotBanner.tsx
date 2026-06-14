export default function PilotBanner() {
  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '12px',
        textAlign: 'center' as const,
        color: 'white',
        fontWeight: 700,
        fontSize: '14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
      }}
    >
      <i className="ph-duotone ph-flask" style={{ fontSize: '18px' }}></i>
      Demo Mode - ข้อมูลเก็บในเครื่องเท่านั้น
    </div>
  )
}
