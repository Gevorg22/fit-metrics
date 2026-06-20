import { NextResponse } from 'next/server';

export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function err(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export const unauthorized = () => err('Unauthorized', 401);
export const forbidden = () => err('Forbidden', 403);
export const notFound = () => err('Not found', 404);
export const badRequest = (msg = 'Bad request') => err(msg, 400);
export const serverError = (msg = 'Internal server error') => err(msg, 500);
