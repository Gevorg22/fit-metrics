import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;

async function sendMessage(chatId: number, text: string, replyMarkup?: object) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, reply_markup: replyMarkup }),
  });
}

async function answerCallback(callbackQueryId: string, text: string) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ callback_query_id: callbackQueryId, text }),
  });
}

export async function POST(req: NextRequest) {
  const update = await req.json();

  // Handle /start login_TOKEN
  if (update.message?.text?.startsWith('/start login_')) {
    const token = update.message.text.slice('/start login_'.length).trim();
    const from = update.message.from;
    const chatId: number = update.message.chat.id;

    const record = await prisma.telegramLoginToken.findUnique({ where: { token } });
    if (!record || record.expiresAt < new Date()) {
      await sendMessage(chatId, '❌ Ссылка для входа устарела. Попробуй снова.');
      return NextResponse.json({ ok: true });
    }

    await sendMessage(chatId, `👋 Привет, ${from.first_name}!\n\nПодтверди вход в fitMetrics:`, {
      inline_keyboard: [[{ text: '✅ Подтвердить вход', callback_data: `confirm_${token}` }]],
    });

    return NextResponse.json({ ok: true });
  }

  // Handle confirm button tap
  if (update.callback_query?.data?.startsWith('confirm_')) {
    const token = update.callback_query.data.slice('confirm_'.length);
    const from = update.callback_query.from;

    const record = await prisma.telegramLoginToken.findUnique({ where: { token } });
    if (!record || record.expiresAt < new Date()) {
      await answerCallback(update.callback_query.id, '❌ Ссылка устарела');
      return NextResponse.json({ ok: true });
    }

    await prisma.telegramLoginToken.update({
      where: { token },
      data: {
        confirmed: true,
        userData: {
          id: from.id,
          first_name: from.first_name,
          last_name: from.last_name ?? null,
          username: from.username ?? null,
          photo_url: null,
        },
      },
    });

    await answerCallback(update.callback_query.id, '✅ Вход подтверждён!');

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: true });
}
