import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#0E1B32',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '7px',
        }}
      >
        {/* Gold diamond accent */}
        <div
          style={{
            position: 'absolute',
            width: '6px',
            height: '6px',
            background: '#C9A96E',
            transform: 'rotate(45deg)',
            top: '5px',
            right: '5px',
          }}
        />
        {/* CL monogram */}
        <span
          style={{
            color: '#C9A96E',
            fontSize: '14px',
            fontWeight: 700,
            fontFamily: 'Georgia, serif',
            letterSpacing: '-0.5px',
            lineHeight: 1,
          }}
        >
          CL
        </span>
      </div>
    ),
    { ...size }
  )
}
