// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    exercise: {
      findMany: vi.fn(),
    },
  },
}));

import { GET } from '@/app/api/exercises/route';
import { prisma } from '@/lib/prisma';

describe('GET /api/exercises', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns list of exercises with cache headers', async () => {
    const mockExercises = [
      { id: 'ex-1', name: 'Push Up', nameRu: 'Отжимания', primaryMuscles: ['chest'], images: [] },
      { id: 'ex-2', name: 'Squat', nameRu: 'Приседания', primaryMuscles: ['quads'], images: [] },
    ];
    vi.mocked(prisma.exercise.findMany).mockResolvedValue(mockExercises as any);
    const res = await GET();
    expect(res.status).toBe(200);
    expect(res.headers.get('Cache-Control')).toContain('s-maxage=3600');
    const body = await res.json();
    expect(body).toEqual(mockExercises);
  });

  it('returns 500 when database throws an error', async () => {
    vi.mocked(prisma.exercise.findMany).mockRejectedValue(new Error('DB error'));
    const res = await GET();
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Failed to fetch exercises');
  });
});
