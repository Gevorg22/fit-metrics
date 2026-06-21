'use client';

import { useState, useRef, useEffect } from 'react';
import NextImage from 'next/image';
import { signOut } from 'next-auth/react';
import { Button, Input, message, Spin } from 'antd';
import {
  LogoutOutlined,
  UserOutlined,
  TrophyOutlined,
  ClockCircleOutlined,
  FireOutlined,
  EditOutlined,
  CheckOutlined,
  CloseOutlined,
  HeartOutlined,
  CameraOutlined,
  DownOutlined,
  UpOutlined,
  ColumnWidthOutlined,
} from '@ant-design/icons';

import { getExerciseImageUrl, formatVolume, calcAge } from '@/lib/utils';
import { patchProfile } from '@/lib/api/profile';
import { EditableField } from './EditableField';
import { PushNotificationButton } from './PushNotificationButton';
import styles from './ProfileView.module.scss';

interface BodyMeasurement {
  id: string;
  date: string;
  neck: number | null;
  chest: number | null;
  waist: number | null;
  hips: number | null;
  bicepL: number | null;
  bicepR: number | null;
  thighL: number | null;
  thighR: number | null;
}

interface TopExercise {
  exerciseId: string;
  name: string;
  count: number;
  image?: string | null;
}

interface Props {
  email: string;
  name: string;
  notificationsEnabled: boolean;
  gender: string | null;
  heightCm: number | null;
  goalWeight: number | null;
  birthDate: string | null;
  image: string | null;
  fitnessLevel: string | null;
  weeklyGoal: number | null;
  totalWorkouts: number;
  totalVolume: number;
  avgDurationMin: number;
  topExercises: TopExercise[];
}

export function ProfileView({
  email,
  name: initialName,
  notificationsEnabled,
  gender: initialGender,
  heightCm: initialHeight,
  goalWeight: initialGoalWeight,
  birthDate: initialBirthDate,
  image: initialImage,
  fitnessLevel: initialFitnessLevel,
  weeklyGoal: initialWeeklyGoal,
  totalWorkouts,
  totalVolume,
  avgDurationMin,
  topExercises,
}: Props) {
  const [name, setName] = useState(initialName);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(initialName);
  const [savingName, setSavingName] = useState(false);

  const [gender, setGender] = useState<string | null>(initialGender);
  const [savingGender, setSavingGender] = useState(false);
  const [heightCm, setHeightCm] = useState<number | null>(initialHeight);
  const [goalWeight, setGoalWeight] = useState<number | null>(initialGoalWeight);
  const [birthDate, setBirthDate] = useState<string | null>(initialBirthDate);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialImage);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fitnessLevel, setFitnessLevel] = useState<string | null>(initialFitnessLevel);
  const [weeklyGoal, setWeeklyGoal] = useState<number | null>(initialWeeklyGoal);
  const [savingFitness, setSavingFitness] = useState(false);

  const [measurements, setMeasurements] = useState<BodyMeasurement[]>([]);
  const [measureOpen, setMeasureOpen] = useState(false);
  const [trainingOpen, setTrainingOpen] = useState(false);
  const [measureForm, setMeasureForm] = useState<Record<string, string>>({
    date: new Date().toISOString().slice(0, 10),
    neck: '', chest: '', waist: '', hips: '', bicepL: '', bicepR: '', thighL: '', thighR: '',
  });
  const [savingMeasure, setSavingMeasure] = useState(false);

  useEffect(() => {
    if (!measureOpen) return;
    fetch('/api/measurements')
      .then((r) => r.json())
      .then((d) => Array.isArray(d) ? setMeasurements(d) : null)
      .catch(() => null);
  }, [measureOpen]);

  const patch = patchProfile;

  const handleAvatarFile = (file: File) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onload = (e) => {
      img.onload = async () => {
        const size = 200;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d')!;
        const minSide = Math.min(img.width, img.height);
        const sx = (img.width - minSide) / 2;
        const sy = (img.height - minSide) / 2;
        ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);
        const base64 = canvas.toDataURL('image/jpeg', 0.85);
        setUploadingAvatar(true);
        try {
          await patch({ image: base64 });
          setAvatarUrl(base64);
          message.success('Фото обновлено');
        } catch {
          message.error('Не удалось загрузить фото');
        } finally {
          setUploadingAvatar(false);
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const startEdit = () => { setNameInput(name); setEditingName(true); };
  const cancelEdit = () => setEditingName(false);
  const saveName = async () => {
    const trimmed = nameInput.trim();
    setSavingName(true);
    try {
      await patch({ name: trimmed });
      setName(trimmed);
      setEditingName(false);
      message.success('Имя сохранено');
    } catch {
      message.error('Не удалось сохранить');
    } finally {
      setSavingName(false);
    }
  };

  const saveGender = async (value: string | null) => {
    setSavingGender(true);
    try {
      await patch({ gender: value });
      setGender(value);
      message.success('Пол сохранён');
    } catch {
      message.error('Не удалось сохранить');
    } finally {
      setSavingGender(false);
    }
  };

  const saveHeight = async (v: string) => {
    const val = v ? parseInt(v) : null;
    await patch({ heightCm: val });
    setHeightCm(val);
    message.success('Рост сохранён');
  };

  const saveGoalWeight = async (v: string) => {
    const val = v ? parseFloat(v) : null;
    await patch({ goalWeight: val });
    setGoalWeight(val);
    message.success('Цель сохранена');
  };

  const saveBirthDate = async (v: string) => {
    await patch({ birthDate: v || null });
    setBirthDate(v || null);
    message.success('Дата рождения сохранена');
  };

  const saveFitnessLevel = async (level: string) => {
    setSavingFitness(true);
    try {
      await patch({ fitnessLevel: level });
      setFitnessLevel(level);
      message.success('Уровень сохранён');
    } catch {
      message.error('Не удалось сохранить');
    } finally {
      setSavingFitness(false);
    }
  };

  const saveWeeklyGoal = async (v: string) => {
    const val = v ? parseInt(v) : null;
    await patch({ weeklyGoal: val });
    setWeeklyGoal(val);
    message.success('Цель сохранена');
  };

  const saveMeasurement = async () => {
    setSavingMeasure(true);
    try {
      await fetch('/api/measurements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(measureForm),
      });
      message.success('Замеры сохранены');
      const updated = await fetch('/api/measurements').then((r) => r.json());
      if (Array.isArray(updated)) setMeasurements(updated);
      setMeasureForm((f) => ({ ...f, neck: '', chest: '', waist: '', hips: '', bicepL: '', bicepR: '', thighL: '', thighR: '' }));
    } catch {
      message.error('Не удалось сохранить');
    } finally {
      setSavingMeasure(false);
    }
  };

  const deleteMeasurement = async (id: string) => {
    await fetch(`/api/measurements?id=${id}`, { method: 'DELETE' });
    setMeasurements((prev) => prev.filter((m) => m.id !== id));
  };

  const displayName = name || email;
  const age = birthDate ? calcAge(birthDate) : null;

  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <div className={styles.avatarWrap} onClick={() => fileInputRef.current?.click()} title="Сменить фото">
          <div className={styles.avatar}>
            {uploadingAvatar ? (
              <Spin size="small" />
            ) : avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="Аватар" className={styles.avatarImg} />
            ) : (
              <UserOutlined />
            )}
          </div>
          <div className={styles.avatarOverlay}>
            <CameraOutlined className={styles.cameraIcon} />
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className={styles.fileInput}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleAvatarFile(f);
              e.target.value = '';
            }}
          />
        </div>
        <div className={styles.heroInfo}>
          {editingName ? (
            <div className={styles.nameEdit}>
              <Input
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onPressEnter={saveName}
                placeholder="Ваше имя"
                size="small"
                className={styles.nameInput}
                autoFocus
              />
              <Button type="text" icon={<CheckOutlined />} size="small" loading={savingName} onClick={saveName} className={styles.nameActionBtn} />
              <Button type="text" icon={<CloseOutlined />} size="small" onClick={cancelEdit} className={styles.nameActionBtn} />
            </div>
          ) : (
            <div className={styles.nameRow}>
              <span className={styles.displayName}>{displayName}</span>
              <Button type="text" icon={<EditOutlined />} size="small" onClick={startEdit} className={styles.editBtn} />
            </div>
          )}
          {name && <span className={styles.email}>{email}</span>}
          {age !== null && <span className={styles.ageBadge}>{age} лет</span>}
          <span className={styles.badge}>fitMetrics</span>
        </div>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <TrophyOutlined className={styles.statIcon} />
          <span className={styles.statValue}>{totalWorkouts}</span>
          <span className={styles.statLabel}>Тренировок</span>
        </div>
        <div className={styles.statCard}>
          <FireOutlined className={styles.statIcon} />
          <span className={styles.statValue}>{formatVolume(totalVolume)}</span>
          <span className={styles.statLabel}>Поднято всего</span>
        </div>
        <div className={styles.statCard}>
          <ClockCircleOutlined className={styles.statIcon} />
          <span className={styles.statValue}>{avgDurationMin} мин</span>
          <span className={styles.statLabel}>Средняя тренировка</span>
        </div>
      </div>

      {topExercises.length > 0 && (
        <div className={styles.topSection}>
          <h3 className={styles.sectionTitle}>Любимые упражнения</h3>
          <div className={styles.topList}>
            {topExercises.map((ex, i) => (
              <div key={ex.exerciseId} className={styles.topRow}>
                <span className={styles.topRank}>#{i + 1}</span>
                {ex.image && (
                  <NextImage
                    src={getExerciseImageUrl(ex.image)}
                    alt={ex.name}
                    width={36}
                    height={36}
                    className={styles.topImg}
                    unoptimized
                  />
                )}
                <span className={styles.topName}>{ex.name}</span>
                <span className={styles.topCount}>{ex.count} подх.</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={styles.bodySection}>
        <h3 className={styles.sectionTitle}><HeartOutlined style={{ marginRight: 8 }} />Параметры тела</h3>
        <div className={styles.fieldsList}>
          <div className={styles.fieldRow}>
            <span className={styles.fieldLabel}>Пол</span>
            <div className={styles.genderToggle}>
              <button
                className={`${styles.genderBtn} ${gender === 'male' ? styles.genderBtnActive : ''}`}
                onClick={() => gender !== 'male' && saveGender('male')}
                disabled={savingGender}
              >
                ♂ Мужской
              </button>
              <button
                className={`${styles.genderBtn} ${gender === 'female' ? styles.genderBtnActive : ''}`}
                onClick={() => gender !== 'female' && saveGender('female')}
                disabled={savingGender}
              >
                ♀ Женский
              </button>
            </div>
          </div>
          <EditableField
            label="Рост"
            value={heightCm ? `${heightCm}` : ''}
            onSave={saveHeight}
            placeholder="175"
            type="number"
            suffix="см"
            min="100"
            max="250"
          />
          <EditableField
            label="Цель по весу"
            value={goalWeight ? `${goalWeight}` : ''}
            onSave={saveGoalWeight}
            placeholder="75"
            type="number"
            suffix="кг"
            min="30"
            max="300"
          />
          <EditableField
            label="Дата рождения"
            value={birthDate ?? ''}
            onSave={saveBirthDate}
            placeholder="1990-01-01"
            type="date"
          />
        </div>
      </div>

      <div className={styles.collapsibleSection}>
        <button className={styles.collapsibleHeader} onClick={() => setTrainingOpen((o) => !o)}>
          <span className={styles.collapsibleTitle}>🎯 Цели тренировок</span>
          {trainingOpen ? <UpOutlined className={styles.collapsibleIcon} /> : <DownOutlined className={styles.collapsibleIcon} />}
        </button>
        {trainingOpen && (
          <div className={styles.collapsibleBody}>
            <div className={styles.fieldRow}>
              <span className={styles.fieldLabel}>Уровень подготовки</span>
              <div className={styles.levelToggle}>
                {(['beginner', 'intermediate', 'advanced'] as const).map((lvl) => {
                  const labels: Record<string, string> = { beginner: 'Новичок', intermediate: 'Средний', advanced: 'Продвинутый' };
                  return (
                    <button
                      key={lvl}
                      className={`${styles.levelBtn} ${fitnessLevel === lvl ? styles.levelBtnActive : ''}`}
                      onClick={() => fitnessLevel !== lvl && saveFitnessLevel(lvl)}
                      disabled={savingFitness}
                    >
                      {labels[lvl]}
                    </button>
                  );
                })}
              </div>
            </div>
            <EditableField
              label="Тренировок в неделю"
              value={weeklyGoal ? `${weeklyGoal}` : ''}
              onSave={saveWeeklyGoal}
              placeholder="3"
              type="number"
              suffix="дней"
              min="1"
              max="7"
            />
          </div>
        )}
      </div>

      <div className={styles.collapsibleSection}>
        <button className={styles.collapsibleHeader} onClick={() => setMeasureOpen((o) => !o)}>
          <span className={styles.collapsibleTitle}><ColumnWidthOutlined style={{ marginRight: 6 }} />Замеры тела</span>
          {measureOpen ? <UpOutlined className={styles.collapsibleIcon} /> : <DownOutlined className={styles.collapsibleIcon} />}
        </button>
        {measureOpen && (
          <div className={styles.collapsibleBody}>
            <div className={styles.measureGrid}>
              {[
                { key: 'neck', label: 'Шея' },
                { key: 'chest', label: 'Грудь' },
                { key: 'waist', label: 'Талия' },
                { key: 'hips', label: 'Бёдра' },
                { key: 'bicepL', label: 'Бицепс Л' },
                { key: 'bicepR', label: 'Бицепс П' },
                { key: 'thighL', label: 'Бедро Л' },
                { key: 'thighR', label: 'Бедро П' },
              ].map(({ key, label }) => (
                <div key={key} className={styles.measureField}>
                  <label className={styles.measureLabel}>{label}</label>
                  <input
                    type="number"
                    step="0.1"
                    className={styles.measureInput}
                    placeholder="см"
                    value={measureForm[key]}
                    onChange={(e) => setMeasureForm((f) => ({ ...f, [key]: e.target.value }))}
                  />
                </div>
              ))}
            </div>
            <div className={styles.measureDateRow}>
              <label className={styles.measureLabel}>Дата</label>
              <input
                type="date"
                className={styles.measureInput}
                value={measureForm.date}
                onChange={(e) => setMeasureForm((f) => ({ ...f, date: e.target.value }))}
              />
            </div>
            <Button
              type="primary"
              size="small"
              loading={savingMeasure}
              onClick={saveMeasurement}
              className={styles.measureSaveBtn}
            >
              Сохранить замеры
            </Button>
            {measurements.length > 0 && (
              <div className={styles.measureHistory}>
                <span className={styles.measureHistoryTitle}>История замеров</span>
                {measurements.map((m) => {
                  const parts = [
                    m.chest && `Грудь: ${m.chest}`,
                    m.waist && `Талия: ${m.waist}`,
                    m.hips && `Бёдра: ${m.hips}`,
                    m.bicepL && `Бицепс: ${m.bicepL}`,
                  ].filter(Boolean).join(' · ');
                  return (
                    <div key={m.id} className={styles.measureRow}>
                      <span className={styles.measureRowDate}>{new Date(m.date).toLocaleDateString('ru', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      <span className={styles.measureRowData}>{parts || 'нет данных'} см</span>
                      <button className={styles.measureDelete} onClick={() => deleteMeasurement(m.id)} title="Удалить">✕</button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      <div className={styles.settingsSection}>
        <h3 className={styles.sectionTitle}>Настройки</h3>
        <div className={styles.settingsList}>
          <PushNotificationButton initialEnabled={notificationsEnabled} />
        </div>
      </div>

      <div className={styles.actions}>
        <Button
          href="/report"
          target="_blank"
          icon={<span style={{ fontSize: 14 }}>📄</span>}
        >
          Отчёт за месяц (PDF)
        </Button>
        <Button danger icon={<LogoutOutlined />} onClick={() => signOut({ callbackUrl: '/login' })}>
          Выйти из аккаунта
        </Button>
      </div>
    </div>
  );
}
