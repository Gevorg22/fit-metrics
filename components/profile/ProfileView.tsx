'use client';

import { useState, useRef } from 'react';
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
} from '@ant-design/icons';
import { PushNotificationButton } from './PushNotificationButton';
import styles from './ProfileView.module.scss';

const OLD_IMG_BASE = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/';
function exImg(path: string): string {
  return path.startsWith('http') ? path : OLD_IMG_BASE + path;
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
  totalWorkouts: number;
  totalVolume: number;
  avgDurationMin: number;
  topExercises: TopExercise[];
}

function formatVolume(kg: number): string {
  if (kg >= 1_000_000) return `${(kg / 1_000_000).toFixed(1)} млн кг`;
  if (kg >= 1000) return `${(kg / 1000).toFixed(1)} т`;
  return `${kg} кг`;
}

function calcAge(birthDate: string): number {
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

interface EditableFieldProps {
  label: string;
  value: string;
  onSave: (v: string) => Promise<void>;
  placeholder?: string;
  type?: string;
  suffix?: string;
  min?: string;
  max?: string;
}

function EditableField({ label, value, onSave, placeholder, type = 'text', suffix, min, max }: EditableFieldProps) {
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState(value);
  const [saving, setSaving] = useState(false);

  const startEdit = () => { setInput(value); setEditing(true); };
  const cancel = () => setEditing(false);
  const save = async () => {
    setSaving(true);
    try { await onSave(input); setEditing(false); } finally { setSaving(false); }
  };

  return (
    <div className={styles.fieldRow}>
      <span className={styles.fieldLabel}>{label}</span>
      {editing ? (
        <div className={styles.fieldEdit}>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onPressEnter={save}
            placeholder={placeholder}
            type={type}
            size="small"
            suffix={suffix}
            min={min}
            max={max}
            autoFocus
            className={styles.fieldInput}
          />
          <Button type="text" icon={<CheckOutlined />} size="small" loading={saving} onClick={save} />
          <Button type="text" icon={<CloseOutlined />} size="small" onClick={cancel} />
        </div>
      ) : (
        <div className={styles.fieldValue}>
          <span className={styles.fieldText}>{value || <span className={styles.fieldEmpty}>Не указано</span>}</span>
          <Button type="text" icon={<EditOutlined />} size="small" onClick={startEdit} className={styles.editBtn} />
        </div>
      )}
    </div>
  );
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

  const patch = async (data: Record<string, unknown>) => {
    const res = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error();
  };

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
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={exImg(ex.image)} alt={ex.name} className={styles.topImg} />
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

      <div className={styles.settingsSection}>
        <h3 className={styles.sectionTitle}>Настройки</h3>
        <div className={styles.settingsList}>
          <PushNotificationButton initialEnabled={notificationsEnabled} />
        </div>
      </div>

      <div className={styles.actions}>
        <Button danger icon={<LogoutOutlined />} onClick={() => signOut({ callbackUrl: '/login' })}>
          Выйти из аккаунта
        </Button>
      </div>
    </div>
  );
}
