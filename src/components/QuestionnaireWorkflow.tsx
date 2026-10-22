import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  ClipboardList,
  Check,
  Save,
  Send,
  Stethoscope,
  AlertCircle,
  Flag,
  ArrowLeft,
  User,
  ChevronDown,
  Info,
} from 'lucide-react';
import { Badge } from '@/components/Badge';
import { isDemoMode } from '@/hooks/useSupabaseData';
import { questionnaireTemplates, questionnaireInstances } from '@/data/mockData';
import { supabase } from '@/lib/supabase';
import { useApp } from '@/context/AppContext';
import type {
  Medical,
  QuestionnaireTemplate,
  QuestionnaireInstance,
  QuestionnaireField,
  QuestionnaireInstanceStatus,
} from '@/types';

const statusColors: Record<string, 'success' | 'warning' | 'danger' | 'brand' | 'ink'> = {
  'Not Started': 'ink',
  Draft: 'warning',
  Submitted: 'brand',
  'Under Review': 'brand',
  Completed: 'success',
};

const statusOrder: QuestionnaireInstanceStatus[] = ['Not Started', 'Draft', 'Submitted', 'Under Review', 'Completed'];

interface QuestionnaireWorkflowProps {
  medical: Medical;
  onBack: () => void;
}

export function QuestionnaireWorkflow({ medical, onBack }: QuestionnaireWorkflowProps) {
  const { user } = useApp();

  const existingInstance = useMemo(
    () => questionnaireInstances.find((qi) => qi.medicalId === medical.id),
    [medical.id],
  );

  const [persistedTemplates, setPersistedTemplates] = useState<QuestionnaireTemplate[]>([]);

  const availableTemplates = useMemo(
    () => (persistedTemplates.length > 0 ? persistedTemplates : questionnaireTemplates).filter((t) => t.medicalTypes.includes(medical.type)),
    [medical.type, persistedTemplates],
  );

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    existingInstance?.templateId || availableTemplates[0]?.id || '',
  );
  const [instance, setInstance] = useState<QuestionnaireInstance>(
    existingInstance || {
      id: `qi-new-${medical.id}`,
      medicalId: medical.id,
      templateId: selectedTemplateId,
      templateName: availableTemplates[0]?.name || '',
      employeeName: medical.employeeName,
      employeeId: medical.employeeId,
      medicalType: medical.type,
      status: 'Not Started',
      answers: {},
      flaggedForReview: [],
      clinicianComments: '',
      additionalTests: '',
      recommendations: '',
      followUpDate: null,
      completedBy: '',
      completedAt: null,
      submittedBy: '',
      submittedAt: null,
      reviewedBy: '',
      reviewedAt: null,
    },
  );

  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const template = useMemo(
    () => availableTemplates.find((t) => t.id === (instance.templateId || selectedTemplateId)),
    [availableTemplates, instance.templateId, selectedTemplateId],
  );

  useEffect(() => {
    if (isDemoMode) return;
    (async () => {
      const { data: rows } = await supabase.from('questionnaire_templates').select('*').eq('is_active', true).order('name');
      if (rows && rows.length > 0) {
        const loaded = rows.map((row: Record<string, unknown>) => ({
          id: row.id as string,
          name: row.name as string,
          description: row.description as string,
          medicalTypes: row.medical_types as QuestionnaireTemplate['medicalTypes'],
          fields: row.fields as QuestionnaireTemplate['fields'],
        }));
        setPersistedTemplates(loaded);
        const matching = loaded.find((item) => item.medicalTypes.includes(medical.type));
        if (matching && !existingInstance) {
          setSelectedTemplateId(matching.id);
          setInstance((current) => ({ ...current, templateId: matching.id, templateName: matching.name }));
        }
      }
      const { data: saved } = await supabase.from('questionnaire_instances').select('*').eq('medical_id', medical.id).maybeSingle();
      if (saved) {
        setInstance({
          id: saved.id as string,
          medicalId: saved.medical_id as string,
          templateId: saved.template_id as string,
          templateName: saved.template_name as string,
          employeeName: saved.employee_name as string,
          employeeId: saved.employee_id as string,
          medicalType: saved.medical_type as Medical['type'],
          status: saved.status as QuestionnaireInstanceStatus,
          answers: (saved.answers || {}) as Record<string, string>,
          flaggedForReview: (saved.flagged_for_review || []) as string[],
          clinicianComments: saved.clinician_comments as string,
          additionalTests: saved.additional_tests as string,
          recommendations: saved.recommendations as string,
          followUpDate: saved.follow_up_date as string | null,
          completedBy: saved.completed_by as string,
          completedAt: saved.completed_at as string | null,
          submittedBy: saved.submitted_by as string,
          submittedAt: saved.submitted_at as string | null,
          reviewedBy: saved.reviewed_by as string,
          reviewedAt: saved.reviewed_at as string | null,
        });
      }
    })();
  }, [medical.id, medical.type, existingInstance]);

  const persistInstance = useCallback(async (next: QuestionnaireInstance, action: string, fromStatus: string | null = null) => {
    if (isDemoMode || !user) return;
    const payload = {
      medical_id: next.medicalId,
      template_id: next.templateId,
      template_name: next.templateName,
      employee_name: next.employeeName,
      employee_id: next.employeeId || null,
      medical_type: next.medicalType,
      status: next.status,
      answers: next.answers,
      flagged_for_review: next.flaggedForReview,
      clinician_comments: next.clinicianComments,
      additional_tests: next.additionalTests,
      recommendations: next.recommendations,
      follow_up_date: next.followUpDate || null,
      completed_by: next.completedBy,
      completed_at: next.completedAt,
      submitted_by: next.submittedBy,
      submitted_at: next.submittedAt,
      reviewed_by: next.reviewedBy,
      reviewed_at: next.reviewedAt,
    };
    let instanceId = next.id;
    if (next.id.startsWith('qi-')) {
      const { data: inserted, error } = await supabase.from('questionnaire_instances').insert(payload).select().maybeSingle();
      if (error) throw error;
      if (inserted) {
        instanceId = inserted.id as string;
        setInstance((current) => ({ ...current, id: instanceId }));
      }
    } else {
      const { error } = await supabase.from('questionnaire_instances').update(payload).eq('id', next.id);
      if (error) throw error;
    }
    await supabase.from('questionnaire_audit_entries').insert({
      instance_id: instanceId,
      action,
      from_status: fromStatus,
      to_status: next.status,
      actor: user.name,
    });
  }, [user]);

  const sections = useMemo(() => {
    if (!template) return [];
    const sectionNames = [...new Set(template.fields.map((f) => f.section))];
    return sectionNames.map((name) => ({
      name,
      fields: template.fields.filter((f) => f.section === name),
    }));
  }, [template]);

  const requiredFields = template?.fields.filter((f) => f.required) || [];
  const answeredRequired = requiredFields.filter((f) => instance.answers[f.id]?.trim());
  const completionPct = requiredFields.length > 0
    ? Math.round((answeredRequired.length / requiredFields.length) * 100)
    : 0;

  const setAnswer = (fieldId: string, value: string) => {
    setInstance((prev) => ({
      ...prev,
      answers: { ...prev.answers, [fieldId]: value },
      status: prev.status === 'Not Started' ? 'Draft' : prev.status,
    }));
  };

  const toggleFlag = (fieldId: string) => {
    setInstance((prev) => ({
      ...prev,
      flaggedForReview: prev.flaggedForReview.includes(fieldId)
        ? prev.flaggedForReview.filter((id) => id !== fieldId)
        : [...prev.flaggedForReview, fieldId],
    }));
  };

  const handleSaveDraft = async () => {
    const next = { ...instance, status: 'Draft' as QuestionnaireInstanceStatus, completedBy: instance.completedBy || user?.name || 'Current user' };
    setInstance(next);
    try {
      await persistInstance(next, 'draft_saved', instance.status);
      setSaveNotice(isDemoMode ? 'Draft saved locally. Demo mode — not saved to the live database.' : 'Draft saved.');
      setSubmitError(null);
    } catch {
      setSubmitError('Could not save this questionnaire. Please try again.');
    }
    setTimeout(() => setSaveNotice(null), 3000);
  };

  const handleSubmit = async () => {
    const missingRequired = requiredFields.filter((f) => !instance.answers[f.id]?.trim());
    if (missingRequired.length > 0) {
      setSubmitError(`Please complete all required fields: ${missingRequired.map((f) => f.label).join(', ')}`);
      return;
    }
    const next = { ...instance, status: 'Submitted' as QuestionnaireInstanceStatus, submittedBy: instance.completedBy || user?.name || 'Current user', submittedAt: new Date().toISOString() };
    setInstance(next);
    try {
      await persistInstance(next, 'submitted', instance.status);
      setSaveNotice(isDemoMode ? 'Questionnaire submitted locally. Demo mode — not saved to the live database.' : 'Questionnaire submitted for clinician review.');
      setSubmitError(null);
    } catch {
      setSubmitError('Could not submit this questionnaire. Please try again.');
    }
    setTimeout(() => setSaveNotice(null), 3000);
  };

  const handleStartReview = async () => {
    const next = { ...instance, status: 'Under Review' as QuestionnaireInstanceStatus, reviewedBy: user?.name || 'Current clinician' };
    setInstance(next);
    try {
      await persistInstance(next, 'review_started', instance.status);
      setSaveNotice('Review started.');
    } catch {
      setSubmitError('Could not start the review. Please try again.');
    }
    setTimeout(() => setSaveNotice(null), 2000);
  };

  const handleCompleteReview = async () => {
    const next = { ...instance, status: 'Completed' as QuestionnaireInstanceStatus, reviewedAt: new Date().toISOString() };
    setInstance(next);
    try {
      await persistInstance(next, 'review_completed', instance.status);
      setSaveNotice(isDemoMode ? 'Review completed locally. Demo mode — not saved to the live database.' : 'Review completed.');
    } catch {
      setSubmitError('Could not complete the review. Please try again.');
    }
    setTimeout(() => setSaveNotice(null), 3000);
  };

  const isClinician = user?.role === 'admin' || user?.role === 'provider';

  const canEditAnswers = instance.status === 'Not Started' || instance.status === 'Draft';
  const canSubmit = canEditAnswers && completionPct === 100;
  const canReview = isClinician && (instance.status === 'Submitted' || instance.status === 'Under Review');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="btn-secondary">
          <ArrowLeft size={16} /> Back to Assessment
        </button>
        <Badge color={statusColors[instance.status]} dot>{instance.status}</Badge>
      </div>

      {/* Header */}
      <div className="card overflow-hidden">
        <div className="h-20 bg-gradient-to-br from-brand-600 to-brand-900" />
        <div className="p-5 lg:p-6 -mt-8">
          <div className="flex items-end gap-4">
            <div className="h-16 w-16 rounded-2xl bg-white border-4 border-white shadow-lg flex items-center justify-center">
              <ClipboardList size={28} className="text-brand-600" />
            </div>
            <div className="mb-1">
              <h2 className="text-xl font-display font-bold text-ink-900">{instance.templateName || 'Medical Questionnaire'}</h2>
              <p className="text-sm text-ink-500">{instance.employeeName} — {instance.medicalType}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Demo banner */}
      {isDemoMode && (
        <div className="p-3 bg-warning-50 text-warning-700 text-sm rounded-lg flex items-center gap-2">
          <AlertCircle size={16} className="shrink-0" />
          Demo mode — questionnaire answers are stored locally only and will not be saved as live records.
        </div>
      )}

      {/* Workflow progress bar */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display font-bold text-ink-900">Workflow Progress</h3>
          <span className="text-sm font-semibold text-ink-600">{completionPct}% complete</span>
        </div>
        <div className="flex items-center gap-1 mb-3">
          {statusOrder.map((s, i) => {
            const currentIndex = statusOrder.indexOf(instance.status);
            const isActive = i <= currentIndex && instance.status !== 'Not Started';
            return (
              <div key={s} className="flex items-center flex-1 last:flex-none">
                <div className={`h-2 rounded-full ${isActive ? 'bg-brand-500' : 'bg-ink-100'} ${i === 0 ? 'w-8' : 'flex-1'}`} />
                {i < statusOrder.length - 1 && (
                  <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-brand-500' : 'bg-ink-200'}`} />
                )}
              </div>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-2">
          {statusOrder.map((s) => (
            <span key={s} className={`text-xs font-medium ${instance.status === s ? 'text-brand-600' : 'text-ink-400'}`}>
              {s}
            </span>
          ))}
        </div>
      </div>

      {/* Template selector (only when not started or draft) */}
      {canEditAnswers && availableTemplates.length > 1 && (
        <div className="card p-5">
          <label className="block text-sm font-semibold text-ink-700 mb-2">Questionnaire Template</label>
          <div className="relative">
            <select
              className="input w-full pr-9 appearance-none cursor-pointer"
              value={instance.templateId || selectedTemplateId}
              onChange={(e) => {
                const newTemplate = availableTemplates.find((t) => t.id === e.target.value);
                setSelectedTemplateId(e.target.value);
                setInstance((prev) => ({
                  ...prev,
                  templateId: e.target.value,
                  templateName: newTemplate?.name || '',
                  answers: {},
                  flaggedForReview: [],
                }));
              }}
            >
              {availableTemplates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
          </div>
          <p className="text-xs text-ink-500 mt-2">{template?.description}</p>
        </div>
      )}

      {/* Notices */}
      {saveNotice && <div className="p-3 bg-success-50 text-success-700 text-sm rounded-lg flex items-center gap-2"><Check size={16} /> {saveNotice}</div>}
      {submitError && <div className="p-3 bg-danger-50 text-danger-700 text-sm rounded-lg flex items-start gap-2"><AlertCircle size={16} className="mt-0.5 shrink-0" /> {submitError}</div>}

      {/* Questionnaire sections */}
      {template && (
        <div className="space-y-4">
          {sections.map((section) => (
            <div key={section.name} className="card p-5">
              <h3 className="font-display font-bold text-ink-900 mb-4">{section.name}</h3>
              <div className="space-y-4">
                {section.fields.map((field) => {
                  if (field.dependsOn) {
                    const depValue = instance.answers[field.dependsOn.field];
                    if (depValue !== field.dependsOn.value) return null;
                  }
                  return (
                    <FieldRenderer
                      key={field.id}
                      field={field}
                      value={instance.answers[field.id] || ''}
                      onChange={(val) => setAnswer(field.id, val)}
                      disabled={!canEditAnswers}
                      flagged={instance.flaggedForReview.includes(field.id)}
                      onToggleFlag={() => toggleFlag(field.id)}
                      canFlag={isClinician && !canEditAnswers}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Clinician review section (visible when submitted or under review) */}
      {(instance.status === 'Submitted' || instance.status === 'Under Review' || instance.status === 'Completed') && (
        <div className="card p-5 space-y-4">
          <h3 className="font-display font-bold text-ink-900 flex items-center gap-2">
            <Stethoscope size={18} className="text-brand-600" /> Clinician Review
          </h3>
          <p className="text-xs text-ink-500">A qualified clinician must review and approve clinical conclusions. This questionnaire does not make an automatic diagnosis.</p>

          {/* Flagged items */}
          {instance.flaggedForReview.length > 0 && template && (
            <div className="p-3 bg-warning-50 rounded-lg">
              <p className="text-sm font-semibold text-warning-700 mb-2 flex items-center gap-2"><Flag size={14} /> Flagged for review</p>
              <div className="space-y-1">
                {instance.flaggedForReview.map((fid) => {
                  const field = template.fields.find((f) => f.id === fid);
                  return (
                    <div key={fid} className="text-xs text-warning-700">
                      <span className="font-medium">{field?.label}:</span> {instance.answers[fid] || 'No answer'}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-ink-700 mb-1">Clinician Comments</label>
            <textarea
              className="input w-full min-h-[60px] resize-y"
              value={instance.clinicianComments}
              onChange={(e) => setInstance((prev) => ({ ...prev, clinicianComments: e.target.value }))}
              disabled={instance.status === 'Completed'}
              placeholder="Clinical observations and review notes"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-ink-700 mb-1">Additional Tests Required</label>
            <input
              className="input w-full"
              value={instance.additionalTests}
              onChange={(e) => setInstance((prev) => ({ ...prev, additionalTests: e.target.value }))}
              disabled={instance.status === 'Completed'}
              placeholder="e.g. Audiometry, blood tests, specialist referral"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-ink-700 mb-1">Recommendations & Fitness Outcome</label>
            <textarea
              className="input w-full min-h-[60px] resize-y"
              value={instance.recommendations}
              onChange={(e) => setInstance((prev) => ({ ...prev, recommendations: e.target.value }))}
              disabled={instance.status === 'Completed'}
              placeholder="Fitness outcome, restrictions, and follow-up recommendations"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-ink-700 mb-1">Follow-up Date</label>
              <input
                className="input w-full"
                type="date"
                value={instance.followUpDate || ''}
                onChange={(e) => setInstance((prev) => ({ ...prev, followUpDate: e.target.value || null }))}
                disabled={instance.status === 'Completed'}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-ink-700 mb-1">Reviewed By</label>
              <input className="input w-full" value={instance.reviewedBy} disabled placeholder="Clinician name" />
            </div>
          </div>

          {/* Audit trail */}
          {(instance.completedAt || instance.submittedAt || instance.reviewedAt) && (
            <div className="pt-3 border-t border-ink-100">
              <p className="text-xs font-semibold text-ink-400 uppercase tracking-wider mb-2">Audit Trail</p>
              <div className="space-y-1 text-xs text-ink-500">
                {instance.completedBy && (
                  <div className="flex items-center gap-2"><User size={12} /> Completed by {instance.completedBy} {instance.completedAt && `on ${new Date(instance.completedAt).toLocaleString()}`}</div>
                )}
                {instance.submittedBy && (
                  <div className="flex items-center gap-2"><Send size={12} /> Submitted by {instance.submittedBy} {instance.submittedAt && `on ${new Date(instance.submittedAt).toLocaleString()}`}</div>
                )}
                {instance.reviewedBy && (
                  <div className="flex items-center gap-2"><Stethoscope size={12} /> Reviewed by {instance.reviewedBy} {instance.reviewedAt && `on ${new Date(instance.reviewedAt).toLocaleString()}`}</div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        {canEditAnswers && (
          <>
            <button onClick={handleSaveDraft} className="btn-secondary">
              <Save size={16} /> Save Draft
            </button>
            <button onClick={handleSubmit} disabled={!canSubmit} className="btn-primary">
              <Send size={16} /> Submit for Review
            </button>
          </>
        )}
        {instance.status === 'Submitted' && isClinician && (
          <button onClick={handleStartReview} className="btn-primary">
            <Stethoscope size={16} /> Start Review
          </button>
        )}
        {canReview && instance.status === 'Under Review' && (
          <button onClick={handleCompleteReview} className="btn-primary">
            <Check size={16} /> Complete Review
          </button>
        )}
        {instance.status === 'Completed' && (
          <div className="p-3 bg-success-50 text-success-700 text-sm rounded-lg flex items-center gap-2">
            <Check size={16} /> Questionnaire completed and reviewed. This record is read-only.
          </div>
        )}
      </div>
    </div>
  );
}

function FieldRenderer({
  field,
  value,
  onChange,
  disabled,
  flagged,
  onToggleFlag,
  canFlag,
}: {
  field: QuestionnaireField;
  value: string;
  onChange: (val: string) => void;
  disabled: boolean;
  flagged: boolean;
  onToggleFlag: () => void;
  canFlag: boolean;
}) {
  const showFollowUp = field.followUpLabel && value === 'Yes';

  if (field.type === 'notice') {
    return (
      <div className="p-3 bg-brand-50 border border-brand-100 rounded-lg flex items-start gap-2">
        <Info size={16} className="text-brand-600 shrink-0 mt-0.5" />
        <p className="text-sm text-brand-700">{field.label}</p>
        {field.clinicianNote && (
          <p className="text-xs text-brand-500 ml-2 italic">{field.clinicianNote}</p>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-2">
        <label className="text-sm font-semibold text-ink-700">
          {field.label}
          {field.required && <span className="text-danger-500 ml-1">*</span>}
        </label>
        {canFlag && (
          <button
            onClick={onToggleFlag}
            className={`btn-ghost p-1 ${flagged ? 'text-warning-600 bg-warning-50' : 'text-ink-400'}`}
            title={flagged ? 'Unflag' : 'Flag for clinician review'}
          >
            <Flag size={14} />
          </button>
        )}
      </div>
      {field.clinicianNote && (
        <p className="text-xs text-ink-400 italic mb-1">{field.clinicianNote}</p>
      )}
      <div className="mt-1">
        {field.type === 'yesno' && (
          <div className="flex gap-4 mt-1">
            <label className={`flex items-center gap-2 text-sm cursor-pointer ${disabled ? 'opacity-60' : ''}`}>
              <input type="radio" name={field.id} checked={value === 'Yes'} onChange={() => onChange('Yes')} disabled={disabled} className="text-brand-600 focus:ring-brand-500" />
              Yes
            </label>
            <label className={`flex items-center gap-2 text-sm cursor-pointer ${disabled ? 'opacity-60' : ''}`}>
              <input type="radio" name={field.id} checked={value === 'No'} onChange={() => onChange('No')} disabled={disabled} className="text-brand-600 focus:ring-brand-500" />
              No
            </label>
          </div>
        )}
        {field.type === 'text' && (
          <input className="input w-full" value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} placeholder={field.placeholder} />
        )}
        {field.type === 'textarea' && (
          <textarea className="input w-full min-h-[60px] resize-y" value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} placeholder={field.placeholder} />
        )}
        {field.type === 'date' && (
          <input className="input w-full" type="date" value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} />
        )}
        {field.type === 'number' && (
          <input className="input w-full" type="number" value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} placeholder={field.placeholder} />
        )}
        {field.type === 'select' && (
          <select className="input w-full" value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled}>
            <option value="">Select...</option>
            {field.options?.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        )}
        {field.type === 'multi' && (
          <div className="flex flex-wrap gap-2 mt-1">
            {field.options?.map((opt) => {
              const selected = value === opt;
              return (
                <button
                  key={opt}
                  type="button"
                  disabled={disabled}
                  onClick={() => onChange(selected ? '' : opt)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                    selected
                      ? 'border-brand-500 bg-brand-50 text-brand-700'
                      : 'border-ink-200 bg-white text-ink-600 hover:border-ink-300'
                  } ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        )}
      </div>
      {showFollowUp && (
        <p className="text-xs text-warning-600 mt-1 flex items-center gap-1">
          <AlertCircle size={12} /> {field.followUpLabel}
        </p>
      )}
    </div>
  );
}
