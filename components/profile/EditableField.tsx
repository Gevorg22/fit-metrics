'use client';

import { useState } from 'react';
import { Button, Input } from 'antd';
import { EditOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import styles from './ProfileView.module.scss';

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

export function EditableField({
  label,
  value,
  onSave,
  placeholder,
  type = 'text',
  suffix,
  min,
  max,
}: EditableFieldProps) {
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState(value);
  const [saving, setSaving] = useState(false);

  const startEdit = () => {
    setInput(value);
    setEditing(true);
  };
  const cancel = () => setEditing(false);
  const save = async () => {
    setSaving(true);
    try {
      await onSave(input);
      setEditing(false);
    } finally {
      setSaving(false);
    }
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
          <span className={styles.fieldText}>
            {value || <span className={styles.fieldEmpty}>Не указано</span>}
          </span>
          <Button
            type="text"
            icon={<EditOutlined />}
            size="small"
            onClick={startEdit}
            className={styles.editBtn}
          />
        </div>
      )}
    </div>
  );
}
