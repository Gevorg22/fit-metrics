'use client';

import { useEffect, useState } from 'react';
import { Button, Input, Modal, Popconfirm, Spin, message } from 'antd';
import { DeleteOutlined, SaveOutlined, ThunderboltOutlined } from '@ant-design/icons';
import type { WorkoutTemplate, TemplateExercise } from '@/types';
import styles from './WorkoutTemplates.module.scss';

interface Props {
  activeExercises: TemplateExercise[];
  onLoad: (exercises: TemplateExercise[]) => void;
  isGuest: boolean;
}

export function WorkoutTemplates({ activeExercises, onLoad, isGuest }: Props) {
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [messageApi, contextHolder] = message.useMessage();

  const fetchTemplates = () => {
    if (isGuest) return;
    setLoading(true);
    fetch('/api/templates')
      .then((r) => r.json())
      .then((data) => Array.isArray(data) ? setTemplates(data) : setTemplates([]))
      .catch(() => setTemplates([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTemplates();
  }, [isGuest]);

  const handleSave = async () => {
    if (!templateName.trim()) return;
    if (activeExercises.length === 0) {
      messageApi.warning('Нет упражнений для сохранения');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: templateName.trim(), exercises: activeExercises }),
      });
      if (!res.ok) throw new Error();
      const created = await res.json();
      setTemplates((prev) => [{ ...created, exercises: activeExercises }, ...prev]);
      setSaveModalOpen(false);
      setTemplateName('');
      messageApi.success('Шаблон сохранён');
    } catch {
      messageApi.error('Не удалось сохранить шаблон');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await fetch(`/api/templates/${id}`, { method: 'DELETE' });
      setTemplates((prev) => prev.filter((t) => t.id !== id));
    } catch {
      messageApi.error('Не удалось удалить шаблон');
    } finally {
      setDeletingId(null);
    }
  };

  if (isGuest) return null;

  return (
    <div className={styles.wrap}>
      {contextHolder}

      <div className={styles.header}>
        <span className={styles.title}>Шаблоны тренировок</span>
        {activeExercises.length > 0 && (
          <button className={styles.saveBtn} onClick={() => setSaveModalOpen(true)}>
            <SaveOutlined /> Сохранить как шаблон
          </button>
        )}
      </div>

      {loading && (
        <div className={styles.center}>
          <Spin size="small" />
        </div>
      )}

      {!loading && templates.length === 0 && (
        <p className={styles.empty}>Сохрани текущую тренировку как шаблон, чтобы быстро повторить её</p>
      )}

      {!loading && templates.length > 0 && (
        <div className={styles.list}>
          {templates.map((t) => (
            <div key={t.id} className={styles.card}>
              <div className={styles.cardLeft}>
                <span className={styles.cardName}>{t.name}</span>
                <span className={styles.cardMeta}>
                  {t.exercises.length} упр. · {new Date(t.createdAt).toLocaleDateString('ru', { day: 'numeric', month: 'short' })}
                </span>
              </div>
              <div className={styles.cardActions}>
                <button
                  className={styles.loadBtn}
                  onClick={() => onLoad(t.exercises)}
                  title="Загрузить шаблон"
                >
                  <ThunderboltOutlined /> Загрузить
                </button>
                <Popconfirm
                  title="Удалить шаблон?"
                  onConfirm={() => handleDelete(t.id)}
                  okText="Да"
                  cancelText="Нет"
                  okButtonProps={{ danger: true }}
                >
                  <button
                    className={styles.deleteBtn}
                    disabled={deletingId === t.id}
                    title="Удалить"
                  >
                    <DeleteOutlined />
                  </button>
                </Popconfirm>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={saveModalOpen}
        title="Сохранить шаблон"
        onCancel={() => { setSaveModalOpen(false); setTemplateName(''); }}
        footer={[
          <Button key="cancel" onClick={() => { setSaveModalOpen(false); setTemplateName(''); }}>
            Отмена
          </Button>,
          <Button key="save" type="primary" loading={saving} onClick={handleSave} disabled={!templateName.trim()}>
            Сохранить
          </Button>,
        ]}
      >
        <div className={styles.modalBody}>
          <label className={styles.label}>Название шаблона</label>
          <Input
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            placeholder="Например: Грудь и трицепс"
            maxLength={60}
            onPressEnter={handleSave}
            autoFocus
          />
          <span className={styles.hint}>
            Упражнения: {activeExercises.map((e) => e.exerciseName).join(', ')}
          </span>
        </div>
      </Modal>
    </div>
  );
}
