import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const WGER_BASE = 'https://wger.de/api/v2/exerciseinfo/?format=json&language=2&limit=100';

interface WgerMuscle { id: number; name: string; name_en: string }
interface WgerEquipment { id: number; name: string }
interface WgerCategory { id: number; name: string }
interface WgerImage { id: number; image: string; is_main: boolean; is_ai_generated: boolean }
interface WgerTranslation { id: number; name: string; language: number }
interface WgerExercise {
  id: number;
  category: WgerCategory;
  muscles: WgerMuscle[];
  muscles_secondary: WgerMuscle[];
  equipment: WgerEquipment[];
  images: WgerImage[];
  translations: WgerTranslation[];
}
interface WgerResponse { count: number; next: string | null; results: WgerExercise[] }

const MUSCLE_SLUG: Record<number, string> = {
  1: 'biceps',
  2: 'delts',
  3: 'serratus-anterior',
  4: 'pectorals',
  5: 'triceps',
  6: 'abs',
  7: 'calves',
  8: 'glutes',
  9: 'traps',
  10: 'quads',
  11: 'hamstrings',
  12: 'lats',
  13: 'forearms',
  14: 'abs',
  15: 'calves',
};

const CATEGORY_RU: Record<string, string> = {
  Arms: 'Руки',
  Legs: 'Ноги',
  Abs: 'Пресс',
  Chest: 'Грудь',
  Back: 'Спина',
  Shoulders: 'Плечи',
  Calves: 'Икры',
  Cardio: 'Кардио',
  'General': 'Общее',
};

const WORD_TR: [RegExp, string][] = [
  [/Resistance Band/gi, 'Эспандер'],
  [/Stability Ball/gi, 'Фитбол'],
  [/Bosu Ball/gi, 'Босу'],
  [/Medicine Ball/gi, 'Медбол'],
  [/Smith Machine/gi, 'Тренажер Смит'],
  [/EZ[- ]Bar/gi, 'EZ-гриф'],
  [/Barbell/gi, 'Штанга'],
  [/Dumbbell/gi, 'Гантели'],
  [/Kettlebell/gi, 'Гиря'],
  [/Cable/gi, 'Блок'],
  [/Smith/gi, 'Смит'],
  [/Lever/gi, 'Рычажный тренажер'],
  [/\bBand\b/gi, 'Эспандер'],
  [/Hip Thrust/gi, 'Ягодичный мостик'],
  [/Pull[- ]Up/gi, 'Подтягивание'],
  [/Push[- ]Up/gi, 'Отжимание'],
  [/Pulldown/gi, 'Тяга вниз'],
  [/Sit[- ]Up/gi, 'Подъем туловища'],
  [/Leg Raise/gi, 'Подъем ног'],
  [/Leg Curl/gi, 'Сгибание ног'],
  [/Leg Press/gi, 'Жим ногами'],
  [/Leg Extension/gi, 'Разгибание ног'],
  [/Hip Abduction/gi, 'Отведение бедра'],
  [/Hip Adduction/gi, 'Приведение бедра'],
  [/Hip Raise/gi, 'Подъем таза'],
  [/Shoulder Press/gi, 'Жим на плечи'],
  [/Chest Press/gi, 'Жим на грудь'],
  [/Chest Fly(e?)/gi, 'Разведение на грудь'],
  [/Bent[- ]Over\b/gi, 'В наклоне'],
  [/Close[- ]Grip/gi, 'Узким хватом'],
  [/Wide[- ]Grip/gi, 'Широким хватом'],
  [/Romanian Deadlift/gi, 'Румынская становая тяга'],
  [/Stiff[- ]Leg(ged)?/gi, 'На прямых ногах'],
  [/Mountain Climber/gi, 'Альпинист'],
  [/Side Bend/gi, 'Наклон в сторону'],
  [/Side Raise/gi, 'Подъем в сторону'],
  [/Front Raise/gi, 'Подъем перед собой'],
  [/Lateral Raise/gi, 'Подъем в стороны'],
  [/Rear Delt/gi, 'Задние дельты'],
  [/Calf Raise/gi, 'Подъем на носки'],
  [/Good Morning/gi, 'Наклон с отягощением'],
  [/Russian Twist/gi, 'Русское скручивание'],
  [/Nordic Curl/gi, 'Скандинавский подъем'],
  [/Dead Bug/gi, 'Мертвый жук'],
  [/Donkey Kick/gi, 'Удар ослика'],
  [/Fire Hydrant/gi, 'Пожарный гидрант'],
  [/Bird Dog/gi, 'Птичья собака'],
  [/Box Jump/gi, 'Запрыгивание на тумбу'],
  [/Step[- ]Up/gi, 'Зашаг на ступеньку'],
  [/Chin[- ]Up/gi, 'Подтягивание обратным хватом'],
  [/Muscle[- ]Up/gi, 'Подъем с переворотом'],
  [/Toes[- ]To[- ]Bar/gi, 'Подъем ног к перекладине'],
  [/Knee[- ]Raise/gi, 'Подъем коленей'],
  [/Face[- ]Pull/gi, 'Тяга к лицу'],
  [/Hip[- ]Hinge/gi, 'Наклон бедром'],
  [/Cross[- ]Body/gi, 'Перекрестный'],
  [/Single[- ]Arm/gi, 'Одной рукой'],
  [/Single[- ]Leg/gi, 'На одной ноге'],
  [/Flat Bench/gi, 'Горизонтальная скамья'],
  [/Deadlift/gi, 'Становая тяга'],
  [/Pullover/gi, 'Пуловер'],
  [/Press/gi, 'Жим'],
  [/Curl/gi, 'Подъем'],
  [/\bRow\b/gi, 'Тяга'],
  [/\bRaise\b/gi, 'Подъем'],
  [/Fly(e?)\b/gi, 'Разведение'],
  [/Extension/gi, 'Разгибание'],
  [/Flexion/gi, 'Сгибание'],
  [/Crunch/gi, 'Скручивание'],
  [/Squat/gi, 'Приседание'],
  [/Lunge/gi, 'Выпад'],
  [/Plank/gi, 'Планка'],
  [/Shrug/gi, 'Шраги'],
  [/Twist/gi, 'Скручивание'],
  [/Swing/gi, 'Мах'],
  [/\bBridge\b/gi, 'Мостик'],
  [/\bDip\b/gi, 'Отжимание на брусьях'],
  [/Snatch/gi, 'Рывок'],
  [/\bClean\b/gi, 'Подъем на грудь'],
  [/\bJerk\b/gi, 'Толчок'],
  [/Windmill/gi, 'Мельница'],
  [/Burpee/gi, 'Бёрпи'],
  [/Stretch/gi, 'Растяжка'],
  [/\bKick\b/gi, 'Удар'],
  [/\bJump\b/gi, 'Прыжок'],
  [/\bHop\b/gi, 'Прыжок'],
  [/Rollout/gi, 'Прокатка'],
  [/Alternating/gi, 'Поочередный'],
  [/Alternate/gi, 'Поочередный'],
  [/Assisted/gi, 'С помощью'],
  [/Incline/gi, 'На наклонной скамье'],
  [/Decline/gi, 'Наклонный вниз'],
  [/Seated/gi, 'Сидя'],
  [/Standing/gi, 'Стоя'],
  [/Lying/gi, 'Лежа'],
  [/Kneeling/gi, 'На коленях'],
  [/Hanging/gi, 'В висе'],
  [/Overhead/gi, 'Над головой'],
  [/Reverse/gi, 'Обратный'],
  [/Underhand/gi, 'Обратным хватом'],
  [/Overhand/gi, 'Прямым хватом'],
  [/Incline/gi, 'На наклонной скамье'],
  [/Straight/gi, 'Прямой'],
  [/\bBent\b/gi, 'Согнутый'],
  [/\bFull\b/gi, 'Полный'],
  [/\bHalf\b/gi, 'Частичный'],
  [/\bInner\b/gi, 'Внутренний'],
  [/\bOuter\b/gi, 'Внешний'],
  [/\bUpper\b/gi, 'Верхний'],
  [/\bLower\b/gi, 'Нижний'],
  [/\bFront\b/gi, 'Передний'],
  [/\bRear\b/gi, 'Задний'],
  [/\bSide\b/gi, 'Боковой'],
  [/Lateral/gi, 'Боковой'],
  [/Diagonal/gi, 'Диагональный'],
  [/Supine/gi, 'Лежа на спине'],
  [/Prone/gi, 'Лежа на животе'],
  [/Advanced/gi, 'Усложненный'],
  [/Modified/gi, 'Модифицированный'],
  [/\bBasic\b/gi, 'Базовый'],
  [/Weighted/gi, 'С отягощением'],
  [/Bodyweight/gi, 'Вес тела'],
  [/\bNarrow\b/gi, 'Узкий'],
  [/\bWide\b/gi, 'Широкий'],
  [/\bDeep\b/gi, 'Глубокий'],
  [/\bFlat\b/gi, 'Горизонтальный'],
  [/Vertical/gi, 'Вертикальный'],
  [/Horizontal/gi, 'Горизонтальный'],
  [/\bArnold\b/gi, 'Арнольда'],
  [/\bPallof\b/gi, 'Паллоф'],
  [/Romanian/gi, 'Румынский'],
  [/Bulgarian/gi, 'Болгарский'],
  [/\bSumo\b/gi, 'Сумо'],
  [/\bHack\b/gi, 'Гак'],
  [/\bPendlay\b/gi, 'Пендлей'],
  [/Jefferson/gi, 'Джефферсон'],
  [/\bZercher\b/gi, 'Зерхер'],
  [/Landmine/gi, 'Наклонный гриф'],
  [/\bGoblet\b/gi, 'Кубок'],
  [/Suitcase/gi, 'Чемодан'],
  [/\bNordic\b/gi, 'Скандинавский'],
  [/Hamstring/gi, 'Задняя поверхность бедра'],
  [/Quadricep/gi, 'Квадрицепс'],
  [/\bGlute\b/gi, 'Ягодица'],
  [/\bShoulder\b/gi, 'Плечо'],
  [/Forearm/gi, 'Предплечье'],
  [/\bBicep\b/gi, 'Бицепс'],
  [/\bTricep\b/gi, 'Трицепс'],
  [/Oblique/gi, 'Косая мышца'],
  [/Abdominal/gi, 'Пресс'],
  [/\bCalf\b/gi, 'Икры'],
  [/\bHip\b/gi, 'Бедро'],
  [/\bLeg\b/gi, 'Ноги'],
  [/\bArm\b/gi, 'Руки'],
  [/\bBack\b/gi, 'Спина'],
  [/\bChest\b/gi, 'Грудь'],
  [/\bNeck\b/gi, 'Шея'],
  [/\bAbs\b/gi, 'Пресс'],
  [/\bCore\b/gi, 'Кор'],
  [/\bWith\b/gi, 'с'],
  [/\bFrom\b/gi, 'из'],
  [/\bOn\b/gi, 'на'],
  [/\bAnd\b/gi, 'и'],
  [/\bFemale\b/gi, '(ж)'],
  [/\bMale\b/gi, '(м)'],
  [/\bZone\b/gi, 'Зона'],
  [/Running/gi, 'Бег'],
  [/Swimming/gi, 'Плавание'],
  [/Walking/gi, 'Ходьба'],
  [/Cycling/gi, 'Велосипед'],
  [/Sprints/gi, 'Спринты'],
  [/Handstand/gi, 'Стойка на руках'],
  [/Bear Walk/gi, 'Медвежья ходьба'],
];

function translateName(name: string): string {
  let result = name;
  for (const [pattern, replacement] of WORD_TR) {
    result = result.replace(pattern, replacement);
  }
  result = result.replace(/\s{2,}/g, ' ').trim();
  return result.charAt(0).toUpperCase() + result.slice(1);
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchAllExercises(): Promise<WgerExercise[]> {
  const all: WgerExercise[] = [];
  let url: string | null = WGER_BASE;
  let page = 1;

  while (url) {
    console.log(`  Fetching page ${page}...`);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status} on page ${page}`);
    const data = (await res.json()) as WgerResponse;
    all.push(...data.results);
    url = data.next;
    page++;
    if (url) await delay(400);
  }

  return all;
}

async function main() {
  console.log('Fetching exercises from wger.de API...');

  const raw = await fetchAllExercises();
  console.log(`Fetched ${raw.length} exercises total.`);

  const records: {
    id: string;
    name: string;
    nameRu: string;
    category: string;
    primaryMuscles: string[];
    secondaryMuscles: string[];
    equipment: string | null;
    images: string[];
  }[] = [];

  for (const ex of raw) {
    const enTranslation = ex.translations.find((t) => t.language === 2);
    if (!enTranslation?.name?.trim()) continue;

    const name = enTranslation.name.trim();
    const nameRu = translateName(name);

    const primaryMuscles = [...new Set(ex.muscles.map((m) => MUSCLE_SLUG[m.id] ?? m.name_en.toLowerCase()).filter(Boolean))];
    const secondaryMuscles = [...new Set(ex.muscles_secondary.map((m) => MUSCLE_SLUG[m.id] ?? m.name_en.toLowerCase()).filter(Boolean))];

    const mainImage = ex.images.find((img) => img.is_main)?.image ?? ex.images[0]?.image ?? null;

    const equipment = ex.equipment.length > 0 ? ex.equipment.map((e) => e.name).join(', ') : null;
    const category = CATEGORY_RU[ex.category.name] ?? ex.category.name;

    records.push({
      id: `wger-${ex.id}`,
      name,
      nameRu,
      category,
      primaryMuscles: primaryMuscles.length > 0 ? primaryMuscles : [ex.category.name.toLowerCase()],
      secondaryMuscles,
      equipment,
      images: mainImage ? [mainImage] : [],
    });
  }

  console.log(`Valid exercises with English name: ${records.length}. Clearing old exercises...`);

  await prisma.exercise.deleteMany();

  const result = await prisma.exercise.createMany({ data: records, skipDuplicates: true });

  console.log(`Done! Seeded ${result.count} exercises from wger.de.`);
  const withImages = records.filter((r) => r.images.length > 0).length;
  console.log(`Exercises with images: ${withImages} / ${records.length}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
