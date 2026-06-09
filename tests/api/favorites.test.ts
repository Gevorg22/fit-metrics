// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    favoriteExercise: {
      findMany: vi.fn(),
      upsert: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

import { GET, POST, DELETE } from '@/app/api/favorites/route';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

const makeRequest = (body: object) =>
  new Request('http://localhost', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

describe('GET /api/favorites', () => {
  beforeEach(() => vi.clearAllMocks());

  it('возвращает 401 если не авторизован', async () => {
    vi.mocked(auth).mockResolvedValue(null as any);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('возвращает массив ID упражнений для авторизованного пользователя', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as any);
    vi.mocked(prisma.favoriteExercise.findMany).mockResolvedValue([
      { exerciseId: 'ex-1' },
      { exerciseId: 'ex-2' },
    ] as any);
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual(['ex-1', 'ex-2']);
  });
});

describe('POST /api/favorites', () => {
  beforeEach(() => vi.clearAllMocks());

  it('возвращает 401 если не авторизован', async () => {
    vi.mocked(auth).mockResolvedValue(null as any);
    const res = await POST(makeRequest({ exerciseId: 'ex-1' }));
    expect(res.status).toBe(401);
  });

  it('возвращает 400 если exerciseId не передан', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as any);
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('exerciseId required');
  });

  it('сохраняет избранное и возвращает ok', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as any);
    vi.mocked(prisma.favoriteExercise.upsert).mockResolvedValue({} as any);
    const res = await POST(makeRequest({ exerciseId: 'ex-1' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ ok: true });
    expect(prisma.favoriteExercise.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: { userId: 'user-1', exerciseId: 'ex-1' },
      })
    );
  });
});

describe('DELETE /api/favorites', () => {
  beforeEach(() => vi.clearAllMocks());

  it('возвращает 401 если не авторизован', async () => {
    vi.mocked(auth).mockResolvedValue(null as any);
    const res = await DELETE(makeRequest({ exerciseId: 'ex-1' }));
    expect(res.status).toBe(401);
  });

  it('возвращает 400 если exerciseId не передан', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as any);
    const res = await DELETE(makeRequest({}));
    expect(res.status).toBe(400);
  });

  it('удаляет избранное и возвращает ok', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as any);
    vi.mocked(prisma.favoriteExercise.deleteMany).mockResolvedValue({ count: 1 });
    const res = await DELETE(makeRequest({ exerciseId: 'ex-1' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ ok: true });
    expect(prisma.favoriteExercise.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'user-1', exerciseId: 'ex-1' },
    });
  });
});
