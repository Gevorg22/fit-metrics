import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useFavorites } from '@/hooks/useFavorites';

vi.mock('next-auth/react', () => ({
  useSession: vi.fn(),
}));

import { useSession } from 'next-auth/react';

const LS_KEY = 'fitmetrics-favorites';

describe('useFavorites - guest mode', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.mocked(useSession).mockReturnValue({ data: null, status: 'unauthenticated', update: vi.fn() });
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('loads favorites from localStorage on mount', async () => {
    localStorage.setItem(LS_KEY, JSON.stringify(['ex-1', 'ex-2']));
    const { result } = renderHook(() => useFavorites());
    await waitFor(() => expect(result.current.mounted).toBe(true));
    expect(result.current.favorites.has('ex-1')).toBe(true);
    expect(result.current.favorites.has('ex-2')).toBe(true);
  });

  it('starts with empty favorites when localStorage is empty', async () => {
    const { result } = renderHook(() => useFavorites());
    await waitFor(() => expect(result.current.mounted).toBe(true));
    expect(result.current.favorites.size).toBe(0);
  });

  it('toggle adds a new favorite to localStorage', async () => {
    const { result } = renderHook(() => useFavorites());
    await waitFor(() => expect(result.current.mounted).toBe(true));
    await act(async () => {
      await result.current.toggle('ex-1');
    });
    expect(result.current.favorites.has('ex-1')).toBe(true);
    const stored = JSON.parse(localStorage.getItem(LS_KEY) ?? '[]');
    expect(stored).toContain('ex-1');
  });

  it('toggle removes an existing favorite from localStorage', async () => {
    localStorage.setItem(LS_KEY, JSON.stringify(['ex-1']));
    const { result } = renderHook(() => useFavorites());
    await waitFor(() => expect(result.current.mounted).toBe(true));
    await act(async () => {
      await result.current.toggle('ex-1');
    });
    expect(result.current.favorites.has('ex-1')).toBe(false);
    const stored = JSON.parse(localStorage.getItem(LS_KEY) ?? '[]');
    expect(stored).not.toContain('ex-1');
  });
});

describe('useFavorites - authenticated mode', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.mocked(useSession).mockReturnValue({
      data: { user: { id: 'user-1', name: 'Test', email: 'test@test.com' }, expires: '' },
      status: 'authenticated',
      update: vi.fn(),
    });
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('fetches favorites from API on mount', async () => {
    mockFetch.mockResolvedValue({
      json: () => Promise.resolve(['ex-1', 'ex-2']),
    });
    const { result } = renderHook(() => useFavorites());
    await waitFor(() => expect(result.current.mounted).toBe(true));
    expect(mockFetch).toHaveBeenCalledWith('/api/favorites');
    expect(result.current.favorites.has('ex-1')).toBe(true);
    expect(result.current.favorites.has('ex-2')).toBe(true);
  });

  it('toggle calls POST to add a favorite', async () => {
    mockFetch
      .mockResolvedValueOnce({ json: () => Promise.resolve([]) })
      .mockResolvedValueOnce({});
    const { result } = renderHook(() => useFavorites());
    await waitFor(() => expect(result.current.mounted).toBe(true));
    await act(async () => {
      await result.current.toggle('ex-1');
    });
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/favorites',
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ exerciseId: 'ex-1' }) })
    );
  });

  it('toggle calls DELETE to remove an existing favorite', async () => {
    mockFetch
      .mockResolvedValueOnce({ json: () => Promise.resolve(['ex-1']) })
      .mockResolvedValueOnce({});
    const { result } = renderHook(() => useFavorites());
    await waitFor(() => expect(result.current.mounted).toBe(true));
    await act(async () => {
      await result.current.toggle('ex-1');
    });
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/favorites',
      expect.objectContaining({ method: 'DELETE', body: JSON.stringify({ exerciseId: 'ex-1' }) })
    );
  });
});
