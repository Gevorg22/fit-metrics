import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#171310',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '40px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline' }}>
          <span style={{ color: '#ffa751', fontSize: 90, fontWeight: 800, lineHeight: 1, fontFamily: 'sans-serif' }}>
            f
          </span>
          <span style={{ color: '#fbf1e4', fontSize: 90, fontWeight: 800, lineHeight: 1, fontFamily: 'sans-serif' }}>
            M
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}
