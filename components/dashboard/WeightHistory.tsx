'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Popconfirm, message } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import styles from './WeightHistory.module.scss';

interface WeightEntry {
  id: string;
  weight: number;
  date: string;
}

interface Props {
  entries: WeightEntry[];
}

export function WeightHistory({ entries: initial }: Props) {
  const router = useRouter();
  const [messageApi, contextHolder] = message.useMessage();
  const [entries, setEntries] = useState(initial);
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      const res = await fetch(`/api/weight/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setEntries((prev) => prev.filter((e) => e.id !== id));
      router.refresh();
    } catch {
      messageApi.error('Не удалось удалить запись');
    } finally {
      setDeleting(null);
    }
  };

  if (entries.length === 0) {
    return (
      <div className={styles.empty}>
        <span className={styles.emptyText}>Нет записей веса</span>
      </div>
    );
  }

  return (
    <div className={styles.list}>
      {contextHolder}
      {entries.map((e) => {
        const date = new Date(e.date);
        return (
          <div key={e.id} className={styles.item}>
            <div className={styles.itemLeft}>
              <span className={styles.dateDay}>
                {date.toLocaleDateString('ru', { weekday: 'short' }).toUpperCase()}
              </span>
              <span className={styles.dateMain}>
                {date.toLocaleDateString('ru', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </div>
            <div className={styles.itemRight}>
              <span className={styles.weight}>{e.weight} кг</span>
              <Popconfirm
                title="Удалить запись?"
                onConfirm={() => handleDelete(e.id)}
                okText="Удалить"
                cancelText="Отмена"
                okButtonProps={{ danger: true }}
              >
                <button
                  className={styles.deleteBtn}
                  disabled={deleting === e.id}
                  aria-label="Удалить запись"
                >
                  <DeleteOutlined />
                </button>
              </Popconfirm>
            </div>
          </div>
        );
      })}
    </div>
  );
}
