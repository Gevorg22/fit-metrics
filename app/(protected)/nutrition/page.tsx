import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { NutritionView } from '@/components/nutrition/NutritionView';

export const metadata = { title: 'Питание — fitMetrics' };

function calcTargetCalories(
  gender: string | null,
  heightCm: number | null,
  weightKg: number | null,
  birthDate: Date | null,
  goalWeight: number | null,
): number | null {
  if (!heightCm || !weightKg || !birthDate) return null;
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  const isMale = gender !== 'female';
  const bmr = isMale
    ? 10 * weightKg + 6.25 * heightCm - 5 * age + 5
    : 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
  const tdee = Math.round(bmr * 1.55);
  if (goalWeight && goalWeight < weightKg - 0.5) return tdee - 400;
  if (goalWeight && goalWeight > weightKg + 0.5) return tdee + 300;
  return tdee;
}

export default async function NutritionPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const today = new Date().toISOString().slice(0, 10);

  const [user, latestWeight, entries] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { gender: true, heightCm: true, goalWeight: true, birthDate: true },
    }),
    prisma.weightLog.findFirst({
      where: { userId: session.user.id },
      orderBy: { date: 'desc' },
      select: { weight: true },
    }),
    prisma.foodEntry.findMany({
      where: { userId: session.user.id, date: new Date(today) },
      orderBy: { createdAt: 'asc' },
      select: { id: true, name: true, calories: true, protein: true, fat: true, carbs: true },
    }),
  ]);

  const weightKg = latestWeight?.weight ?? null;

  const targetCalories = user
    ? calcTargetCalories(user.gender, user.heightCm, weightKg, user.birthDate ?? null, user.goalWeight)
    : null;

  return (
    <NutritionView
      gender={user?.gender ?? null}
      heightCm={user?.heightCm ?? null}
      weightKg={weightKg}
      birthDate={user?.birthDate ? user.birthDate.toISOString().slice(0, 10) : null}
      goalWeight={user?.goalWeight ?? null}
      targetCalories={targetCalories}
      initialEntries={entries}
    />
  );
}
