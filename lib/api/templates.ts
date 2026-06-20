import type { TemplateExercise } from '@/types';

export async function fetchTemplates() {
  const res = await fetch('/api/templates');
  if (!res.ok) throw new Error('Failed to fetch templates');
  return res.json();
}

export async function saveTemplate(name: string, exercises: TemplateExercise[]) {
  const res = await fetch('/api/templates', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, exercises }),
  });
  if (!res.ok) throw new Error('Failed to save template');
  return res.json();
}

export async function deleteTemplate(id: string) {
  const res = await fetch(`/api/templates/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete template');
}
