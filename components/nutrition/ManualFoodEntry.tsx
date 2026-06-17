'use client';

import { useState } from 'react';
import { Button, message, Spin } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import styles from './ManualFoodEntry.module.scss';

interface FoodEntry {
  id: string;
  name: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
}

interface Props {
  onAdd: (entry: FoodEntry) => void;
}

export function ManualFoodEntry({ onAdd }: Props) {
  const [messageApi, contextHolder] = message.useMessage();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [estimating, setEstimating] = useState(false);
  const [form, setForm] = useState({ name: '', grams: '', calories: '', protein: '', fat: '', carbs: '' });

  const set = (field: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleEstimate = async () => {
    if (!form.name.trim()) { messageApi.warning('Введи название продукта'); return; }
    setEstimating(true);
    try {
      const res = await fetch('/api/nutrition/estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name.trim(), grams: form.grams ? parseFloat(form.grams) : undefined }),
      });
      const data = await res.json();
      if (!res.ok) { messageApi.error(data.error ?? 'Ошибка AI'); return; }
      setForm((prev) => ({
        ...prev,
        calories: String(data.calories),
        protein: String(data.protein),
        fat: String(data.fat),
        carbs: String(data.carbs),
      }));
      messageApi.success('AI заполнил КБЖУ');
    } catch {
      messageApi.error('Ошибка соединения');
    } finally {
      setEstimating(false);
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) { messageApi.warning('Введи название'); return; }
    const cal = parseInt(form.calories);
    if (!form.calories || isNaN(cal) || cal <= 0) { messageApi.warning('Введи калории (или нажми ✦ AI заполнит)'); return; }

    setSaving(true);
    try {
      const res = await fetch('/api/nutrition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          calories: cal,
          protein: parseFloat(form.protein) || 0,
          fat: parseFloat(form.fat) || 0,
          carbs: parseFloat(form.carbs) || 0,
        }),
      });
      if (!res.ok) throw new Error();
      const saved = await res.json();
      onAdd(saved);
      setForm({ name: '', grams: '', calories: '', protein: '', fat: '', carbs: '' });
      setOpen(false);
      messageApi.success('Добавлено');
    } catch {
      messageApi.error('Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const hasMacros = form.calories !== '';

  return (
    <div className={styles.wrap}>
      {contextHolder}

      {!open && (
        <button className={styles.toggleBtn} onClick={() => setOpen(true)}>
          <PlusOutlined />
          Ввести вручную
        </button>
      )}

      {open && (
        <div className={styles.form}>
          <div className={styles.nameRow}>
            <div className={styles.fieldRow} style={{ flex: 1 }}>
              <label className={styles.label}>Название</label>
              <input
                className={styles.input}
                placeholder="Гречка, куриная грудка..."
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                autoFocus
              />
            </div>
            <div className={styles.fieldRow} style={{ width: 88 }}>
              <label className={styles.label}>Граммы</label>
              <input
                className={styles.input}
                type="number"
                inputMode="numeric"
                placeholder="100"
                value={form.grams}
                onChange={(e) => set('grams', e.target.value)}
              />
            </div>
          </div>

          <button
            className={styles.aiEstimateBtn}
            onClick={handleEstimate}
            disabled={estimating || !form.name.trim()}
            type="button"
          >
            {estimating ? <Spin size="small" /> : '✦'}
            {estimating ? 'Считаю...' : 'AI заполнит КБЖУ'}
          </button>

          {hasMacros && (
            <>
              <div className={styles.fieldRow}>
                <label className={styles.label}>Калории (ккал)</label>
                <input
                  className={styles.input}
                  type="number"
                  inputMode="numeric"
                  placeholder="300"
                  value={form.calories}
                  onChange={(e) => set('calories', e.target.value)}
                />
              </div>

              <div className={styles.macroRow}>
                <div className={styles.macroField}>
                  <label className={styles.labelSmall}>Белки (г)</label>
                  <input
                    className={styles.inputSmall}
                    type="number"
                    inputMode="decimal"
                    placeholder="0"
                    value={form.protein}
                    onChange={(e) => set('protein', e.target.value)}
                  />
                </div>
                <div className={styles.macroField}>
                  <label className={styles.labelSmall}>Жиры (г)</label>
                  <input
                    className={styles.inputSmall}
                    type="number"
                    inputMode="decimal"
                    placeholder="0"
                    value={form.fat}
                    onChange={(e) => set('fat', e.target.value)}
                  />
                </div>
                <div className={styles.macroField}>
                  <label className={styles.labelSmall}>Углеводы (г)</label>
                  <input
                    className={styles.inputSmall}
                    type="number"
                    inputMode="decimal"
                    placeholder="0"
                    value={form.carbs}
                    onChange={(e) => set('carbs', e.target.value)}
                  />
                </div>
              </div>
            </>
          )}

          <div className={styles.actions}>
            <Button type="primary" loading={saving} onClick={handleSave} block>
              Добавить
            </Button>
            <Button onClick={() => setOpen(false)} block>
              Отмена
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
