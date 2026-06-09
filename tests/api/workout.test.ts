// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/auth', () => ({ auth: vi.fn() }));
vi.mock('@/lib/prisma', () => ({
  prisma: {
    workout: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
}));

import { GET, POST } from '@/app/api/workout/route';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

describe('GET /api/workout', () => {
  beforeEach(() => vi.clearAllMocks());

  it('возвращает 401 если не авторизован', async () => {
    vi.mocked(auth).mockResolvedValue(null as any);
    const res = await GET();
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('возвращает список тренировок для авторизованного пользователя', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as any);
    const mockWorkouts = [{ id: 'w1', userId: 'user-1', sets: [] }];
    vi.mocked(prisma.workout.findMany).mockResolvedValue(mockWorkouts as any);
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual(mockWorkouts);
    expect(prisma.workout.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'user-1' } })
    );
  });
});

describe('POST /api/workout', () => {
  beforeEach(() => vi.clearAllMocks());

  it('возвращает 401 если не авторизован', async () => {
    vi.mocked(auth).mockResolvedValue(null as any);
    const res = await POST();
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('создаёт тренировку и возвращает её со статусом 201', async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: 'user-1' } } as any);
    const mockWorkout = { id: 'w1', userId: 'user-1', startedAt: new Date().toISOString() };
    vi.mocked(prisma.workout.create).mockResolvedValue(mockWorkout as any);
    const res = await POST();
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body).toEqual(mockWorkout);
    expect(prisma.workout.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: { userId: 'user-1' } })
    );
  });
});
