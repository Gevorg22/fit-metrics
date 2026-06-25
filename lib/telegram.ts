import crypto from 'crypto';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;

// Verify data from Telegram Login Widget
export function verifyTelegramLogin(data: Record<string, string>): boolean {
  const { hash, ...rest } = data;
  if (!hash || !BOT_TOKEN) return false;

  const dataCheckString = Object.keys(rest)
    .sort()
    .map(key => `${key}=${rest[key]}`)
    .join('\n');

  const secretKey = crypto.createHash('sha256').update(BOT_TOKEN).digest();
  const expectedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

  try {
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(expectedHash, 'hex'));
  } catch {
    return false;
  }
}

// Verify initData from Telegram Mini App (WebApp)
export function verifyTelegramInitData(initData: string): URLSearchParams | null {
  if (!initData || !BOT_TOKEN) return null;

  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) return null;

  params.delete('hash');
  // signature is included in the data_check_string (only hash is excluded)

  const dataCheckString = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');

  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(BOT_TOKEN).digest();
  const expectedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

  try {
    if (!crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(expectedHash, 'hex'))) {
      return null;
    }
  } catch {
    return null;
  }

  return params;
}

export function getSessionCookieName(): { name: string; secure: boolean } {
  const isSecure = process.env.NODE_ENV === 'production';
  return {
    name: isSecure ? '__Secure-authjs.session-token' : 'authjs.session-token',
    secure: isSecure,
  };
}
