import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#0E1B32',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '40px',
          position: 'relative',
        }}
      >
        {/* Decorative gold line top */}
        <div
          style={{
            position: 'absolute',
            top: '28px',
            width: '40px',
            height: '2px',
            background: '#C9A96E',
            opacity: 0.6,
          }}
        />
        {/* CL monogram */}
        <span
          style={{
            color: '#C9A96E',
            fontSize: '72px',
            fontWeight: 700,
            fontFamily: 'Georgia, serif',
            letterSpacing: '-2px',
            lineHeight: 1,
          }}
        >
          CL
        </span>
        {/* Decorative gold line bottom */}
        <div
          style={{
            position: 'absolute',
            bottom: '28px',
            width: '40px',
            height: '2px',
            background: '#C9A96E',
            opacity: 0.6,
          }}
        />
      </div>
    ),
    { ...size }
  )
}
