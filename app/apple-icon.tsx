import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#0d0d0d',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '40px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline' }}>
          <span style={{ color: '#22c55e', fontSize: 90, fontWeight: 800, lineHeight: 1, fontFamily: 'sans-serif' }}>
            f
          </span>
          <span style={{ color: '#f5f5f5', fontSize: 90, fontWeight: 800, lineHeight: 1, fontFamily: 'sans-serif' }}>
            M
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}
