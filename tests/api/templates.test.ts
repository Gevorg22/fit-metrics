// @vitest-environment node
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    workoutTemplate: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
}));

import { GET, POST } from '@/app/api/templates/route';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

const makeRequest = (body: object) =>
  new Request('http://localhost', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

describe('GET /api/templates', () => {
  beforeEach(() => vi.clearAllMocks());

  it('возвращает 401 если не авторизован', async () => {
    vi.mocked(auth).mockResolvedValue(null as any);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('возвращает шаблоны для авторизованного пользователя', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as any);
    const mockTemplates = [
      { id: 't1', name: 'Push Day', exercises: [], createdAt: new Date().toISOString() },
    ];
    vi.mocked(prisma.workoutTemplate.findMany).mockResolvedValue(mockTemplates as any);
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual(mockTemplates);
  });
});

describe('POST /api/templates', () => {
  beforeEach(() => vi.clearAllMocks());

  it('возвращает 401 если не авторизован', async () => {
    vi.mocked(auth).mockResolvedValue(null as any);
    const res = await POST(makeRequest({ name: 'Push Day', exercises: [{ exerciseId: 'ex-1' }] }));
    expect(res.status).toBe(401);
  });

  it('возвращает 400 если имя пустое', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as any);
    const res = await POST(makeRequest({ name: '', exercises: [{ exerciseId: 'ex-1' }] }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid data');
  });

  it('возвращает 400 если список упражнений пустой', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as any);
    const res = await POST(makeRequest({ name: 'Push Day', exercises: [] }));
    expect(res.status).toBe(400);
  });

  it('создаёт шаблон и возвращает его со статусом 201', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as any);
    const exercises = [{ exerciseId: 'ex-1', exerciseName: 'Push Up' }];
    const mockTemplate = { id: 't1', name: 'Push Day', exercises, createdAt: new Date().toISOString() };
    vi.mocked(prisma.workoutTemplate.create).mockResolvedValue(mockTemplate as any);
    const res = await POST(makeRequest({ name: 'Push Day', exercises }));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body).toEqual(mockTemplate);
    expect(prisma.workoutTemplate.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: 'user-1', name: 'Push Day' }),
      })
    );
  });
});
