import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface RawExercise {
  id: string;
  name: string;
  category: string;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  equipment: string;
  images: string[];
}

const TRANSLATIONS: Record<string, string> = {
  'barbell-bench-press-medium-grip': 'Жим штанги лёжа',
  'barbell-incline-bench-press-medium-grip': 'Жим штанги лёжа на наклонной скамье',
  'barbell-decline-bench-press': 'Жим штанги лёжа на скамье с отрицательным наклоном',
  'dumbbell-bench-press': 'Жим гантелей лёжа',
  'decline-dumbbell-bench-press': 'Жим гантелей лёжа на скамье с наклоном вниз',
  'dumbbell-flyes': 'Разводка гантелей лёжа',
  'cable-crossover': 'Сведение рук в кроссовере',
  'low-cable-crossover': 'Сведение рук в кроссовере снизу',
  'dips-chest-version': 'Отжимания на брусьях (грудь)',
  'chest-dip': 'Отжимания на брусьях (грудь)',
  'push-up': 'Отжимания',
  'decline-push-up': 'Отжимания с наклоном вниз',
  'close-grip-push-up-off-of-a-dumbbell': 'Отжимания узким хватом от гантели',
  'barbell-guillotine-bench-press': 'Жим штанги лёжа к шее',
  'barbell-deadlift': 'Становая тяга',
  'romanian-deadlift': 'Румынская становая тяга',
  'romanian-deadlift-from-deficit': 'Румынская тяга с дефицитом',
  'bent-over-barbell-row': 'Тяга штанги в наклоне',
  'bent-over-two-dumbbell-row': 'Тяга двух гантелей в наклоне',
  'seated-cable-rows': 'Тяга нижнего блока сидя',
  'elevated-cable-rows': 'Тяга нижнего блока стоя',
  'close-grip-front-lat-pulldown': 'Тяга верхнего блока узким хватом',
  'full-range-of-motion-lat-pulldown': 'Тяга верхнего блока широким хватом',
  'one-arm-lat-pulldown': 'Тяга верхнего блока одной рукой',
  'chin-up': 'Подтягивания (узкий хват)',
  'band-assisted-pull-up': 'Подтягивания с лентой',
  'scapular-pull-up': 'Подтягивания с опусканием лопаток',
  'hyperextensions-back-extension': 'Гиперэкстензия',
  'back-extension': 'Гиперэкстензия',
  'straight-arm-dumbbell-pullover': 'Пуловер с гантелью',
  't-bar-row-with-handle': 'Тяга Т-грифа',
  'face-pull': 'Тяга к лицу на тросе',
  'barbell-full-squat': 'Приседания со штангой',
  'barbell-hack-squat': 'Приседания Хака со штангой',
  'leg-press': 'Жим ногами в тренажёре',
  'narrow-stance-leg-press': 'Жим ногами узкой постановкой',
  'lying-leg-curls': 'Сгибание ног лёжа в тренажёре',
  'seated-leg-curl': 'Сгибание ног сидя в тренажёре',
  'ball-leg-curl': 'Сгибание ног на мяче',
  'leg-extensions': 'Разгибание ног в тренажёре',
  'single-leg-leg-extension': 'Разгибание ноги одной в тренажёре',
  'barbell-lunge': 'Выпады со штангой',
  'barbell-walking-lunge': 'Шагающие выпады со штангой',
  'bodyweight-walking-lunge': 'Шагающие выпады с весом тела',
  'dumbbell-squat': 'Приседания с гантелями',
  'barbell-hip-thrust': 'Ягодичный мостик со штангой',
  'standing-calf-raises': 'Подъёмы на носки стоя',
  'barbell-seated-calf-raise': 'Подъёмы на носки сидя со штангой',
  'calf-press-on-the-leg-press-machine': 'Подъёмы на носки в жиме ногами',
  'calf-raise-on-a-dumbbell': 'Подъём на носки с гантелью',
  'rocking-standing-calf-raise': 'Подъёмы на носки стоя (покачивание)',
  'sumo-squat': 'Приседания сумо',
  'barbell-shoulder-press': 'Жим штанги стоя над головой',
  'seated-barbell-military-press': 'Жим штанги сидя (военный жим)',
  'standing-military-press': 'Жим штанги стоя (военный жим)',
  'arnold-dumbbell-press': 'Жим Арнольда',
  'machine-shoulder-military-press': 'Жим в тренажёре (плечи)',
  'smith-machine-overhead-shoulder-press': 'Жим в тренажёре Смита над головой',
  'dumbbell-one-arm-upright-row': 'Тяга гантели к подбородку одной рукой',
  'standing-dumbbell-upright-row': 'Тяга гантелей к подбородку стоя',
  'smith-machine-upright-row': 'Тяга штанги в Смите к подбородку',
  'upright-row-with-bands': 'Тяга к подбородку с лентой',
  'dumbbell-lateral-raise': 'Подъём гантелей через стороны',
  'cable-seated-lateral-raise': 'Подъём на блоке через стороны сидя',
  'bent-over-dumbbell-rear-delt-raise': 'Подъём гантелей через стороны в наклоне',
  'dumbbell-front-raise': 'Подъём гантелей перед собой',
  'two-arm-dumbbell-front-raise': 'Подъём двух гантелей перед собой',
  'triceps-pushdown': 'Разгибание рук на блоке (верёвка)',
  'reverse-grip-triceps-pushdown': 'Разгибание рук на блоке обратным хватом',
  'bench-dips': 'Отжимания от скамьи',
  'dip-machine': 'Отжимания на тренажёре',
  'overhead-triceps': 'Французский жим над головой',
  'cable-rope-overhead-triceps-extension': 'Французский жим на блоке над головой',
  'standing-overhead-barbell-triceps-extension': 'Французский жим штангой стоя',
  'sled-overhead-triceps-extension': 'Французский жим на блоке',
  'decline-ez-bar-triceps-extension': 'Французский жим EZ-грифом на наклонной',
  'body-tricep-press': 'Отжимания на брусьях',
  'dumbbell-bicep-curl': 'Сгибание рук с гантелями стоя',
  'dumbbell-alternate-bicep-curl': 'Попеременное сгибание рук с гантелями',
  'alternate-hammer-curl': 'Молотки с гантелями (попеременно)',
  'cable-hammer-curls-rope-attachment': 'Сгибание рук на блоке (молоток)',
  'alternate-incline-dumbbell-curl': 'Попеременное сгибание рук на наклонной скамье',
  'close-grip-ez-bar-curl': 'Сгибание рук EZ-грифом узким хватом',
  'overhead-cable-curl': 'Сгибание рук на блоке над головой',
  'barbell-curl': 'Сгибание рук со штангой стоя',
  'concentration-curls': 'Сгибание рук сидя с упором (концентрированное)',
  'preacher-curl': 'Сгибание рук на скамье Скотта',
  'plank': 'Планка',
  'cable-crunch': 'Скручивания на блоке',
  'ab-crunch-machine': 'Скручивания в тренажёре',
  'crunch': 'Скручивания',
  'decline-crunch': 'Скручивания на наклонной скамье',
  'jackknife-sit-up': 'Складной нож',
  'hanging-leg-raise': 'Подъём ног в висе',
  'hanging-knee-raise': 'Подъём колен в висе',
  'air-bike': 'Велосипед (пресс)',
  'russian-twist': 'Русский твист',
  'mountain-climber': 'Горизонтальный бег (планка)',
  '3-4-sit-up': 'Скручивания (3/4)',
  'flutter-kicks': 'Перекрёстные махи ногами',
  'burpee': 'Бёрпи',
  'jumping-jacks': 'Прыжки с разведением рук и ног',
  'box-jump-onto-or-over': 'Прыжки на тумбу',
  'jump-rope': 'Скакалка',
  'battle-rope-waves': 'Волны верёвками',
  'tire-flip': 'Переворот покрышки',
};

const EXERCISES_URL =
  'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json';

async function fetchExercises(): Promise<RawExercise[]> {
  const localPath = path.join(process.cwd(), 'prisma', 'exercises.json');
  if (fs.existsSync(localPath)) {
    return JSON.parse(fs.readFileSync(localPath, 'utf-8'));
  }
  console.log('exercises.json not found locally, downloading from source...');
  const res = await fetch(EXERCISES_URL);
  if (!res.ok) throw new Error(`Failed to fetch exercises: ${res.status}`);
  return res.json();
}

async function main() {
  const raw = await fetchExercises();

  console.log(`Seeding ${raw.length} exercises...`);

  await prisma.exercise.deleteMany();

  const data = raw.map((ex) => ({
    id: ex.id,
    name: ex.name,
    nameRu: TRANSLATIONS[ex.id] ?? null,
    category: ex.category,
    primaryMuscles: ex.primaryMuscles,
    secondaryMuscles: ex.secondaryMuscles,
    equipment: ex.equipment ?? null,
    images: ex.images,
  }));

  const result = await prisma.exercise.createMany({ data, skipDuplicates: true });

  console.log(`Done. ${result.count} exercises seeded.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
