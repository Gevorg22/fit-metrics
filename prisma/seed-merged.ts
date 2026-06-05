import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const GIF_DB_URL =
  'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/api/en/exercises.json';

const OLD_DB_URL =
  'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json';

const OLD_IMG_BASE =
  'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/';

interface GifExercise {
  id: string;
  slug: string;
  name: string;
  muscle: string;
  bodyPart: string;
  equipment: string;
  category: string;
  secondaryMuscles: string[];
  instructions: string[];
  file: string;
  gifUrl: string;
}

interface OldExercise {
  id: string;
  name: string;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  images: string[];
  category: string;
  equipment: string | null;
}

const MUSCLE_RU: Record<string, string> = {
  abductors: 'Отводящие',
  abs: 'Пресс',
  abdominals: 'Пресс',
  adductors: 'Приводящие',
  biceps: 'Бицепс',
  calves: 'Икры',
  chest: 'Грудь',
  pectorals: 'Грудь',
  forearms: 'Предплечья',
  glutes: 'Ягодицы',
  hamstrings: 'Задняя поверхность бедра',
  lats: 'Широчайшие',
  'lower back': 'Нижняя спина',
  lower_back: 'Нижняя спина',
  'middle back': 'Средняя спина',
  middle_back: 'Средняя спина',
  neck: 'Шея',
  quadriceps: 'Квадрицепс',
  quads: 'Квадрицепс',
  shoulders: 'Плечи',
  traps: 'Трапеции',
  triceps: 'Трицепс',
  delts: 'Дельты',
  'upper-back': 'Верхняя спина',
  'serratus-anterior': 'Зубчатая мышца',
  'levator-scapulae': 'Мышца шеи',
  cardio: 'Кардио',
  legs: 'Ноги',
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
  [/Pullovers?\b/gi, 'Пуловер'],
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
  [/Chest Fly(e?)\b/gi, 'Разведение на грудь'],
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
  [/Cross[- ]Bench/gi, 'Поперечная скамья'],
  [/Single[- ]Arm/gi, 'Одной рукой'],
  [/Single[- ]Leg/gi, 'На одной ноге'],
  [/Flat Bench/gi, 'Горизонтальная скамья'],
  [/Over the [Hh]ead/gi, 'Над головой'],
  [/Claps? [Oo]ver/gi, 'Хлопки над'],
  [/\bClaps?\b/gi, 'Хлопки'],
  [/\bCommando\b/gi, 'Коммандо'],
  [/Deadlift/gi, 'Становая тяга'],
  [/\bPress\b/gi, 'Жим'],
  [/\bCurl\b/gi, 'Подъем'],
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
  [/Stretch(ing)?/gi, 'Растяжка'],
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
  [/Bilateral/gi, 'Двусторонний'],
  [/Unilateral/gi, 'Односторонний'],
  [/\bSingle\b/gi, 'Односторонний'],
  [/\bDouble\b/gi, 'Двусторонний'],
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
  [/\bGlutes?\b/gi, 'Ягодица'],
  [/\bDelts?\b/gi, 'Дельты'],
  [/\bShoulder\b/gi, 'Плечо'],
  [/Forearm/gi, 'Предплечье'],
  [/\bBiceps?\b/gi, 'Бицепс'],
  [/\bTriceps?\b/gi, 'Трицепс'],
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
  [/\bBench\b/gi, 'Скамья'],
  [/\bMachine\b/gi, 'Тренажер'],
  [/\bBar\b/gi, 'Гриф'],
  [/\bRope\b/gi, 'Канат'],
  [/\bPike\b/gi, 'Уголок'],
  [/\bFloor\b/gi, 'Пол'],
  [/\bWall\b/gi, 'Стена'],
  [/\bWith\b/gi, 'с'],
  [/\bFrom\b/gi, 'из'],
  [/\bOn\b/gi, 'на'],
  [/\bAnd\b/gi, 'и'],
  [/\bv[- ]?(\d+)\b/gi, 'вар.$1'],
  [/\bFemale\b/gi, '(ж)'],
  [/\bMale\b/gi, '(м)'],
];

function translateName(name: string): string {
  let result = name;
  for (const [pattern, replacement] of WORD_TR) {
    result = result.replace(pattern, replacement);
  }
  result = result.replace(/\s{2,}/g, ' ').trim();
  return result.charAt(0).toUpperCase() + result.slice(1);
}

function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
}

async function main() {
  console.log('Fetching exercises from ExerciseGymGifsDB...');
  const gifRes = await fetch(GIF_DB_URL);
  if (!gifRes.ok) throw new Error(`GifDB fetch failed: ${gifRes.status}`);
  const gifData = (await gifRes.json()) as { count: number; exercises: GifExercise[] };
  console.log(`GifDB: ${gifData.count} exercises`);

  console.log('Fetching exercises from free-exercise-db...');
  const oldRes = await fetch(OLD_DB_URL);
  if (!oldRes.ok) throw new Error(`OldDB fetch failed: ${oldRes.status}`);
  const oldData = (await oldRes.json()) as OldExercise[];
  console.log(`free-exercise-db: ${oldData.length} exercises`);

  await prisma.exercise.deleteMany();
  console.log('Cleared existing exercises. Building merged list...');

  const gifRecords = gifData.exercises.map((ex) => ({
    id: ex.id,
    name: ex.name,
    nameRu: translateName(ex.name),
    category: MUSCLE_RU[ex.muscle] ?? ex.muscle,
    primaryMuscles: [ex.muscle],
    secondaryMuscles: ex.secondaryMuscles,
    equipment: ex.equipment ?? null,
    images: [ex.gifUrl],
  }));

  const gifNameSet = new Set(gifRecords.map((r) => normalizeName(r.name)));

  const oldRecords = oldData
    .filter((ex) => !gifNameSet.has(normalizeName(ex.name)))
    .map((ex) => ({
      id: `old-${ex.id}`,
      name: ex.name,
      nameRu: translateName(ex.name),
      category: MUSCLE_RU[ex.primaryMuscles[0]] ?? ex.primaryMuscles[0],
      primaryMuscles: ex.primaryMuscles,
      secondaryMuscles: ex.secondaryMuscles,
      equipment: ex.equipment ?? null,
      images: ex.images.slice(0, 1).map((img) => `${OLD_IMG_BASE}${img}`),
    }));

  console.log(`GifDB exercises: ${gifRecords.length}`);
  console.log(`Old DB unique exercises added: ${oldRecords.length}`);
  console.log(`Total: ${gifRecords.length + oldRecords.length}`);

  const allRecords = [...gifRecords, ...oldRecords];

  const result = await prisma.exercise.createMany({
    data: allRecords,
    skipDuplicates: true,
  });

  console.log(`Done! Seeded ${result.count} exercises total.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
