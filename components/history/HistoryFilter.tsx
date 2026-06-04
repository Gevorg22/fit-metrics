'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Select } from 'antd';
import styles from './HistoryFilter.module.scss';

interface ExerciseOption {
  id: string;
  name: string;
}

interface Props {
  exercises: ExerciseOption[];
  currentExerciseId: string | null;
}

export function HistoryFilter({ exercises, currentExerciseId }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleChange = (value: string | undefined) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', '1');
    if (value) {
      params.set('exerciseId', value);
    } else {
      params.delete('exerciseId');
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const options = exercises.map((e) => ({ value: e.id, label: e.name }));

  return (
    <div className={styles.wrap}>
      <Select
        allowClear
        showSearch
        placeholder="Фильтр по упражнению..."
        value={currentExerciseId ?? undefined}
        onChange={handleChange}
        options={options}
        filterOption={(input, option) =>
          (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
        }
        style={{ width: '100%', maxWidth: 320 }}
      />
    </div>
  );
}
