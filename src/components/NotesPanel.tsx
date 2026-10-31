import { useState } from 'react';
import { MessageSquare, Lock, Plus, X, AlertCircle } from 'lucide-react';
import { useRecordNotes } from '@/hooks/useSupabaseData';
import { isDemoMode } from '@/hooks/useSupabaseData';
import { Badge } from '@/components/Badge';

interface NotesPanelProps {
  recordType: string;
  recordId: string;
  authorName: string;
  canAddNote?: boolean;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ' · ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

export function NotesPanel({ recordType, recordId, authorName, canAddNote = true }: NotesPanelProps) {
  const { data: notes, loading, addNote } = useRecordNotes(recordType, recordId);
  const [showForm, setShowForm] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [noteType, setNoteType] = useState('general');
  const [isConfidential, setIsConfidential] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    setSubmitError(null);
    setSubmitting(true);
    try {
      await addNote(noteText, noteType, authorName, isConfidential);
      setNoteText('');
      setNoteType('general');
      setIsConfidential(false);
      setShowForm(false);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to add note');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-bold text-ink-900 flex items-center gap-2">
          <MessageSquare size={18} className="text-brand-600" /> Notes & Activity History
        </h3>
        {canAddNote && !showForm && (
          <button className="btn-secondary text-sm" onClick={() => setShowForm(true)}>
            <Plus size={14} /> Add Note
          </button>
        )}
      </div>

      {isDemoMode && (
        <div className="mb-3 p-2.5 bg-warning-50 rounded-lg">
          <p className="text-xs text-warning-700">Demo mode — notes cannot be saved. Connecting the database will enable full note functionality.</p>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-4 p-4 bg-ink-50 rounded-lg space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-ink-900">New Note</h4>
            <button type="button" onClick={() => setShowForm(false)} className="text-ink-400 hover:text-ink-600"><X size={16} /></button>
          </div>
          {submitError && <div className="p-2.5 bg-danger-50 text-danger-700 text-sm rounded-md">{submitError}</div>}
          <textarea
            className="input w-full"
            rows={3}
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Enter your note..."
            required
          />
          <div className="flex flex-wrap items-center gap-3">
            <select
              className="input text-sm py-1.5"
              value={noteType}
              onChange={(e) => setNoteType(e.target.value)}
            >
              <option value="general">General</option>
              <option value="clinical">Clinical</option>
              <option value="administrative">Administrative</option>
              <option value="follow-up">Follow-up</option>
            </select>
            <label className="flex items-center gap-2 text-sm text-ink-600 cursor-pointer">
              <input
                type="checkbox"
                checked={isConfidential}
                onChange={(e) => setIsConfidential(e.target.checked)}
                className="rounded border-ink-300 text-brand-600 focus:ring-brand-500"
              />
              <Lock size={13} /> Confidential
            </label>
            <button type="submit" disabled={submitting} className="btn-primary text-sm ml-auto">
              {submitting ? <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Save Note'}
            </button>
          </div>
          {isConfidential && (
            <p className="text-xs text-warning-700 flex items-center gap-1">
              <AlertCircle size={12} /> Confidential notes are hidden from employer/HR roles.
            </p>
          )}
        </form>
      )}

      {loading ? (
        <p className="text-sm text-ink-400">Loading notes...</p>
      ) : notes.length === 0 ? (
        <p className="text-sm text-ink-400">No notes recorded yet.</p>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <div key={note.id} className={`p-3 rounded-lg border ${note.isConfidential ? 'bg-warning-50/50 border-warning-100' : 'bg-white border-ink-100'}`}>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-ink-900">{note.authorName}</span>
                  <Badge color={note.noteType === 'clinical' ? 'danger' : note.noteType === 'follow-up' ? 'brand' : 'ink'}>{note.noteType}</Badge>
                  {note.isConfidential && (
                    <Badge color="warning"><Lock size={10} className="mr-0.5" /> Confidential</Badge>
                  )}
                </div>
                <span className="text-xs text-ink-400">{formatDate(note.createdAt)}</span>
              </div>
              <p className="text-sm text-ink-700">{note.note}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
