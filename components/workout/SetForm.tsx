'use client';

import { useState } from 'react';
import { Button, message } from 'antd';
import { PlusOutlined, DeleteOutlined, CheckOutlined } from '@ant-design/icons';
import type { ActiveExercise, ActiveSet } from '@/types';
import { RestTimer } from './RestTimer';
import styles from './SetForm.module.scss';

interface DraftSet {
  weight: string;
  reps: string;
  saved: boolean;
  id?: string;
}

interface Props {
  workoutId: string;
  exercise: ActiveExercise;
  isGuest?: boolean;
  onSetAdded: (set: ActiveSet) => void;
  onSetRemoved: (setId: string) => void;
}

export function SetForm({ workoutId, exercise, isGuest, onSetAdded, onSetRemoved }: Props) {
  const [messageApi, contextHolder] = message.useMessage();
  const [drafts, setDrafts] = useState<DraftSet[]>(() =>
    exercise.sets.length > 0
      ? exercise.sets.map((s) => ({ weight: String(s.weight), reps: String(s.reps), saved: true, id: s.id }))
      : [{ weight: '', reps: '', saved: false }]
  );
  const [saving, setSaving] = useState(false);
  const [showTimer, setShowTimer] = useState(false);

  const normalizeDecimal = (v: string) => v.replace(',', '.');

  const updateDraft = (idx: number, field: 'weight' | 'reps', value: string) => {
    const normalized = field === 'weight' ? normalizeDecimal(value) : value;
    setDrafts((prev) =>
      prev.map((d, i) => (i === idx ? { ...d, [field]: normalized, saved: false } : d))
    );
  };

  const addRow = () => {
    const last = drafts[drafts.length - 1];
    setDrafts((prev) => [...prev, { weight: last?.weight ?? '', reps: last?.reps ?? '', saved: false }]);
  };

  const removeRow = (idx: number) => {
    const draft = drafts[idx];
    if (draft.saved && draft.id) {
      onSetRemoved(draft.id);
    }
    setDrafts((prev) => prev.filter((_, i) => i !== idx));
  };

  const saveAll = async () => {
    const unsaved = drafts.filter((d) => !d.saved);
    if (unsaved.length === 0) return;

    const invalid = unsaved.some((d) => !d.weight || !d.reps || isNaN(Number(d.weight)) || Number(d.weight) <= 0 || Number(d.reps) <= 0);
    if (invalid) {
      messageApi.warning('Заполни вес и количество повторений для всех подходов');
      return;
    }

    if (isGuest) {
      setDrafts((prev) =>
        prev.map((d) =>
          d.saved ? d : { ...d, saved: true, id: `guest-${Date.now()}-${Math.random()}` }
        )
      );
      messageApi.success('Подходы записаны (гостевой режим)');
      setShowTimer(true);
      return;
    }

    setSaving(true);
    try {
      for (let i = 0; i < drafts.length; i++) {
        const d = drafts[i];
        if (d.saved) continue;
        const setNumber = i + 1;
        const res = await fetch(`/api/workout/${workoutId}/sets`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            exerciseId: exercise.exerciseId,
            setNumber,
            weight: Number(d.weight),
            reps: Number(d.reps),
          }),
        });
        if (!res.ok) throw new Error();
        const saved = await res.json();
        const savedSet: ActiveSet = {
          exerciseId: exercise.exerciseId,
          setNumber,
          weight: Number(d.weight),
          reps: Number(d.reps),
          id: saved.id,
          savedAt: new Date(),
        };
        onSetAdded(savedSet);
        setDrafts((prev) =>
          prev.map((x, xi) => (xi === i ? { ...x, saved: true, id: saved.id } : x))
        );
      }
      messageApi.success('Подходы сохранены');
      setShowTimer(true);
    } catch {
      messageApi.error('Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const hasUnsaved = drafts.some((d) => !d.saved);

  return (
    <div className={styles.wrap}>
      {contextHolder}

      <div className={styles.header}>
        <span className={styles.headerNum}>#</span>
        <span className={styles.headerLabel}>Вес (кг)</span>
        <span className={styles.headerLabel}>Повторения</span>
        <span />
      </div>

      {drafts.map((draft, idx) => (
        <div key={idx} className={`${styles.setRow} ${draft.saved ? styles.setRowSaved : ''}`}>
          <span className={styles.setNum}>{idx + 1}</span>
          <input
            type="text"
            inputMode="decimal"
            className={styles.setInput}
            value={draft.weight}
            onChange={(e) => updateDraft(idx, 'weight', e.target.value)}
            placeholder="0"
          />
          <input
            type="number"
            inputMode="numeric"
            className={styles.setInput}
            value={draft.reps}
            onChange={(e) => updateDraft(idx, 'reps', e.target.value)}
            placeholder="0"
            min={1}
          />
          {draft.saved ? (
            <span className={styles.savedBadge}>
              <CheckOutlined />
            </span>
          ) : (
            <button className={styles.deleteBtn} onClick={() => removeRow(idx)}>
              <DeleteOutlined />
            </button>
          )}
        </div>
      ))}

      <div className={styles.addRow}>
        <button className={styles.addBtn} onClick={addRow}>
          <PlusOutlined /> Добавить подход
        </button>
      </div>

      {showTimer && <RestTimer onClose={() => setShowTimer(false)} />}

      {hasUnsaved && (
        <Button
          type="primary"
          block
          loading={saving}
          onClick={saveAll}
          className={styles.saveBtn}
        >
          Сохранить подходы
        </Button>
      )}
    </div>
  );
}
