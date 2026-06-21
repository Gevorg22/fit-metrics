'use client';

import { useState, useEffect, useRef } from 'react';
import { Button, message, Popconfirm, Spin } from 'antd';
import { PlusOutlined, DeleteOutlined, CheckOutlined } from '@ant-design/icons';
import type { ActiveExercise, ActiveSet } from '@/types';
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
  isCardio?: boolean;
  onSetAdded: (set: ActiveSet) => void;
  onSetRemoved: (setId: string) => void;
  onSetUpdated: (setId: string, data: { weight: number; reps: number }) => void;
}

interface LastResult {
  date: string;
  sets: { setNumber: number; weight: number; reps: number }[];
}

export function SetForm({ workoutId, exercise, isGuest, isCardio, onSetAdded, onSetRemoved, onSetUpdated }: Props) {
  const [messageApi, contextHolder] = message.useMessage();
  const [drafts, setDrafts] = useState<DraftSet[]>(() =>
    exercise.sets.length > 0
      ? exercise.sets.map((s) => ({ weight: String(s.weight), reps: String(s.reps), saved: true, id: s.id }))
      : [{ weight: '', reps: '', saved: false }]
  );
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<LastResult | null>(null);
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiCollapsed, setAiCollapsed] = useState(false);
  const prevSetIds = useRef<string[]>(exercise.sets.map((s) => s.id ?? ''));
  const weightRefs = useRef<(HTMLInputElement | null)[]>([]);
  const repsRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (isGuest) return;
    const params = new URLSearchParams({ exerciseId: exercise.exerciseId });
    if (workoutId) params.set('currentWorkoutId', workoutId);
    fetch(`/api/analytics/last-result?${params}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setLastResult(d ?? null))
      .catch(() => null);
  }, [exercise.exerciseId, workoutId, isGuest]);

  useEffect(() => {
    const currentIds = exercise.sets.map((s) => s.id ?? '');
    const prev = prevSetIds.current;
    const externallyAdded = currentIds.some((id) => id && !prev.includes(id));
    if (externallyAdded) {
      setDrafts(
        exercise.sets.length > 0
          ? exercise.sets.map((s) => ({ weight: String(s.weight), reps: String(s.reps), saved: true, id: s.id }))
          : [{ weight: '', reps: '', saved: false }]
      );
    }
    prevSetIds.current = currentIds;
  }, [exercise.sets]);

  const normalizeWeight = (v: string) => v.replace(/,/g, '.');

  const updateDraft = (idx: number, field: 'weight' | 'reps', value: string) => {
    setDrafts((prev) =>
      prev.map((d, i) => (i === idx ? { ...d, [field]: value, saved: false } : d))
    );
  };

  const addRow = () => {
    const last = drafts[drafts.length - 1];
    setDrafts((prev) => [...prev, { weight: last?.weight ?? '', reps: last?.reps ?? '', saved: false }]);
  };

  const removeSaved = async (idx: number) => {
    const draft = drafts[idx];
    if (!draft.id) return;
    setDeleting(draft.id);
    try {
      if (!isGuest) {
        const res = await fetch(`/api/workout/${workoutId}/sets/${draft.id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error();
      }
      onSetRemoved(draft.id);
      setDrafts((prev) => prev.filter((_, i) => i !== idx));
    } catch {
      messageApi.error('Не удалось удалить подход');
    } finally {
      setDeleting(null);
    }
  };

  const removeRow = (idx: number) => {
    const draft = drafts[idx];
    if (draft.saved && draft.id) {
      onSetRemoved(draft.id);
    }
    setDrafts((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleWeightKeyDown = (e: React.KeyboardEvent, idx: number) => {
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      repsRefs.current[idx]?.focus();
    }
  };

  const handleRepsKeyDown = (e: React.KeyboardEvent, idx: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (idx < drafts.length - 1) {
        weightRefs.current[idx + 1]?.focus();
      } else {
        addRow();
        setTimeout(() => weightRefs.current[idx + 1]?.focus(), 50);
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      if (idx < drafts.length - 1) {
        weightRefs.current[idx + 1]?.focus();
      }
    }
  };

  const saveAll = async () => {
    const unsaved = drafts.filter((d) => !d.saved);
    if (unsaved.length === 0) return;

    const invalid = unsaved.some((d) => {
      const w = parseFloat(normalizeWeight(d.weight));
      const r = parseFloat(normalizeWeight(d.reps));
      if (isCardio) return !d.weight || isNaN(w) || w <= 0;
      return !d.weight || !d.reps || isNaN(w) || w <= 0 || isNaN(r) || r <= 0;
    });
    if (invalid) {
      messageApi.warning(
        isCardio
          ? 'Укажи время тренировки для всех записей'
          : 'Заполни вес и количество повторений для всех подходов'
      );
      return;
    }

    if (isGuest) {
      setDrafts((prev) =>
        prev.map((d) =>
          d.saved ? d : { ...d, saved: true, id: d.id ?? `guest-${Date.now()}-${Math.random()}` }
        )
      );
      messageApi.success('Подходы записаны (гостевой режим)');
      return;
    }

    setSaving(true);
    try {
      for (let i = 0; i < drafts.length; i++) {
        const d = drafts[i];
        if (d.saved) continue;

        const weight = parseFloat(normalizeWeight(d.weight));
        const reps = isCardio
          ? Math.round(parseFloat(normalizeWeight(d.reps)) * 10) || 0
          : Math.round(Number(d.reps));

        if (d.id) {
          const res = await fetch(`/api/workout/${workoutId}/sets/${d.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ weight, reps }),
          });
          if (!res.ok) throw new Error();
          onSetUpdated(d.id, { weight, reps });
          setDrafts((prev) =>
            prev.map((x, xi) => (xi === i ? { ...x, weight: String(weight), saved: true } : x))
          );
        } else {
          const setNumber = i + 1;
          const res = await fetch(`/api/workout/${workoutId}/sets`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              exerciseId: exercise.exerciseId,
              setNumber,
              weight,
              reps,
            }),
          });
          if (!res.ok) throw new Error();
          const saved = await res.json();
          const savedSet: ActiveSet = {
            exerciseId: exercise.exerciseId,
            setNumber,
            weight,
            reps,
            id: saved.id,
            savedAt: new Date(),
          };
          onSetAdded(savedSet);
          setDrafts((prev) =>
            prev.map((x, xi) => (xi === i ? { ...x, weight: String(weight), saved: true, id: saved.id } : x))
          );
        }
      }
      messageApi.success('Подходы сохранены');
    } catch {
      messageApi.error('Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const hasUnsaved = drafts.some((d) => !d.saved);

  const handleAiAdvice = () => {
    setAiLoading(true);
    setAiAdvice(null);
    fetch(`/api/ai/exercise-advice?exerciseId=${exercise.exerciseId}&exerciseName=${encodeURIComponent(exercise.exerciseName)}`)
      .then((r) => r.json())
      .then((d) => setAiAdvice(d.advice ?? d.error ?? 'Не удалось получить совет.'))
      .catch(() => setAiAdvice('Ошибка соединения с AI.'))
      .finally(() => setAiLoading(false));
  };

  return (
    <div className={styles.wrap}>
      {contextHolder}

      {!isCardio && (
        <div className={styles.lastResult}>
          {lastResult && (
            <div className={styles.lastResultRow}>
              <span className={styles.lastResultLabel}>В прошлый раз:</span>
              <div className={styles.lastResultSets}>
                {lastResult.sets.map((s) => (
                  <span key={s.setNumber} className={styles.lastResultSet}>
                    {s.weight}кг × {s.reps}
                  </span>
                ))}
              </div>
            </div>
          )}
          {!aiAdvice && !aiLoading && (
            <button className={styles.aiBtn} onClick={handleAiAdvice}>
              ✦ Спросить AI тренера
            </button>
          )}
          {aiLoading && (
            <div className={styles.aiLoading}>
              <Spin size="small" />
              <span>Анализирую...</span>
            </div>
          )}
          {aiAdvice && !aiLoading && (
            <div className={styles.aiCard}>
              <div className={styles.aiCardHeader}>
                <span className={styles.aiCardLabel}>✦ Совет AI-тренера</span>
                <div className={styles.aiCardActions}>
                  <button className={styles.aiRefresh} onClick={handleAiAdvice} title="Обновить">↻</button>
                  <button className={styles.aiCollapse} onClick={() => setAiCollapsed((c) => !c)} title={aiCollapsed ? 'Развернуть' : 'Свернуть'}>
                    {aiCollapsed ? '▾' : '▴'}
                  </button>
                </div>
              </div>
              {!aiCollapsed && <p className={styles.aiCardText}>{aiAdvice}</p>}
            </div>
          )}
        </div>
      )}

      <div className={styles.header}>
        <span className={styles.headerNum}>#</span>
        <span className={styles.headerLabel}>{isCardio ? 'Время (мин)' : 'Вес (кг)'}</span>
        <span className={styles.headerLabel}>{isCardio ? 'Дистанция (км)' : 'Повторения'}</span>
        <span />
      </div>

      {drafts.map((draft, idx) => (
        <div key={idx} className={`${styles.setRow} ${draft.saved ? styles.setRowSaved : ''}`}>
          <span className={styles.setNum}>{idx + 1}</span>
          <input
            type="text"
            inputMode="decimal"
            className={`${styles.setInput} ${draft.saved ? styles.setInputSaved : ''}`}
            value={draft.weight}
            onChange={(e) => !draft.saved && updateDraft(idx, 'weight', e.target.value)}
            onKeyDown={(e) => !draft.saved && handleWeightKeyDown(e, idx)}
            ref={(el) => { weightRefs.current[idx] = el; }}
            placeholder="0"
            readOnly={draft.saved}
          />
          <input
            type={isCardio ? 'text' : 'number'}
            inputMode="decimal"
            className={`${styles.setInput} ${draft.saved ? styles.setInputSaved : ''}`}
            value={draft.reps}
            onChange={(e) => !draft.saved && updateDraft(idx, 'reps', e.target.value)}
            onKeyDown={(e) => !draft.saved && handleRepsKeyDown(e, idx)}
            ref={(el) => { repsRefs.current[idx] = el; }}
            placeholder="0"
            min={isCardio ? undefined : 1}
            readOnly={draft.saved}
          />
          {draft.saved ? (
            <div className={styles.savedActions}>
              <span className={styles.savedCheck}><CheckOutlined /></span>
              <Popconfirm
                title="Удалить подход?"
                onConfirm={() => removeSaved(idx)}
                okText="Да"
                cancelText="Нет"
                okButtonProps={{ danger: true }}
              >
                <button
                  className={styles.savedDeleteBtn}
                  disabled={deleting === draft.id}
                  aria-label="Удалить подход"
                >
                  <DeleteOutlined />
                </button>
              </Popconfirm>
            </div>
          ) : (
            <button className={styles.deleteBtn} onClick={() => removeRow(idx)}>
              <DeleteOutlined />
            </button>
          )}
        </div>
      ))}

      <div className={styles.addRow}>
        <button className={styles.addBtn} onClick={addRow}>
          <PlusOutlined /> {isCardio ? 'Добавить активность' : 'Добавить подход'}
        </button>
      </div>

      {hasUnsaved && (
        <Button
          type="primary"
          block
          loading={saving}
          onClick={saveAll}
          className={styles.saveBtn}
        >
          {isCardio ? 'Сохранить активность' : 'Сохранить подходы'}
        </Button>
      )}
    </div>
  );
}
