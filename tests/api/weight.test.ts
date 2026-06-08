// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    weightLog: {
      findMany: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));

import { GET, POST } from '@/app/api/weight/route';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

const makeRequest = (body: object) =>
  new Request('http://localhost', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

describe('GET /api/weight', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 401 when not authenticated', async () => {
    vi.mocked(auth).mockResolvedValue(null as any);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('returns weight logs for authenticated user', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as any);
    const mockLogs = [
      { id: 'log-1', weight: 75, date: '2024-01-01T00:00:00.000Z' },
      { id: 'log-2', weight: 74.5, date: '2024-01-02T00:00:00.000Z' },
    ];
    vi.mocked(prisma.weightLog.findMany).mockResolvedValue(mockLogs as any);
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual(mockLogs);
  });
});

describe('POST /api/weight', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 401 when not authenticated', async () => {
    vi.mocked(auth).mockResolvedValue(null as any);
    const res = await POST(makeRequest({ weight: 75 }));
    expect(res.status).toBe(401);
  });

  it('returns 400 when weight is missing', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as any);
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
  });

  it('returns 400 when weight is not a positive number', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as any);
    const res = await POST(makeRequest({ weight: -5 }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Некорректное значение веса');
  });

  it('returns 400 when weight is zero', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as any);
    const res = await POST(makeRequest({ weight: 0 }));
    expect(res.status).toBe(400);
  });

  it('upserts a weight log and returns it', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as any);
    const mockLog = { id: 'log-1', userId: 'user-1', weight: 75, date: new Date().toISOString() };
    vi.mocked(prisma.weightLog.upsert).mockResolvedValue(mockLog as any);
    const res = await POST(makeRequest({ weight: 75 }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual(mockLog);
  });
});
