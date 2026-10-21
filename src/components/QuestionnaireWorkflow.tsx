import { useState, useMemo } from 'react';
import {
  ClipboardList,
  Check,
  Save,
  Send,
  Stethoscope,
  AlertCircle,
  Flag,
  ArrowLeft,
  FileText,
  Clock,
  User,
  ChevronDown,
} from 'lucide-react';
import { Badge } from '@/components/Badge';
import { isDemoMode } from '@/hooks/useSupabaseData';
import { questionnaireTemplates, questionnaireInstances } from '@/data/mockData';
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
  // Find or create a questionnaire instance for this medical
  const existingInstance = useMemo(
    () => questionnaireInstances.find((qi) => qi.medicalId === medical.id),
    [medical.id],
  );

  const availableTemplates = useMemo(
    () => questionnaireTemplates.filter((t) => t.medicalTypes.includes(medical.type)),
    [medical.type],
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
    () => questionnaireTemplates.find((t) => t.id === (instance.templateId || selectedTemplateId)),
    [instance.templateId, selectedTemplateId],
  );

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

  const handleSaveDraft = () => {
    setInstance((prev) => ({ ...prev, status: 'Draft', completedBy: prev.completedBy || 'Current user' }));
    setSaveNotice('Draft saved locally. ' + (isDemoMode ? 'Demo mode — not saved to the live database.' : ''));
    setSubmitError(null);
    setTimeout(() => setSaveNotice(null), 3000);
  };

  const handleSubmit = () => {
    const missingRequired = requiredFields.filter((f) => !instance.answers[f.id]?.trim());
    if (missingRequired.length > 0) {
      setSubmitError(`Please complete all required fields: ${missingRequired.map((f) => f.label).join(', ')}`);
      return;
    }
    const now = new Date().toISOString();
    setInstance((prev) => ({
      ...prev,
      status: 'Submitted',
      submittedBy: prev.completedBy || 'Current user',
      submittedAt: now,
    }));
    setSaveNotice('Questionnaire submitted for clinician review. ' + (isDemoMode ? 'Demo mode — not saved to the live database.' : ''));
    setSubmitError(null);
    setTimeout(() => setSaveNotice(null), 3000);
  };

  const handleStartReview = () => {
    setInstance((prev) => ({ ...prev, status: 'Under Review', reviewedBy: 'Current clinician' }));
    setSaveNotice('Review started.');
    setTimeout(() => setSaveNotice(null), 2000);
  };

  const handleCompleteReview = () => {
    const now = new Date().toISOString();
    setInstance((prev) => ({
      ...prev,
      status: 'Completed',
      reviewedAt: now,
    }));
    setSaveNotice('Review completed. ' + (isDemoMode ? 'Demo mode — not saved to the live database.' : ''));
    setTimeout(() => setSaveNotice(null), 3000);
  };

  const isClinician = true; // In the full app, this would check user role

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
                {section.fields.map((field) => (
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
                ))}
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
      <div className="mt-1">
        {field.type === 'yesno' && (
          <div className="flex gap-4 mt-1">
            <label className={`flex items-center gap-2 text-sm cursor-pointer ${disabled ? 'opacity-60' : ''}`}>
              <input
                type="radio"
                name={field.id}
                checked={value === 'Yes'}
                onChange={() => onChange('Yes')}
                disabled={disabled}
                className="text-brand-600 focus:ring-brand-500"
              />
              Yes
            </label>
            <label className={`flex items-center gap-2 text-sm cursor-pointer ${disabled ? 'opacity-60' : ''}`}>
              <input
                type="radio"
                name={field.id}
                checked={value === 'No'}
                onChange={() => onChange('No')}
                disabled={disabled}
                className="text-brand-600 focus:ring-brand-500"
              />
              No
            </label>
          </div>
        )}
        {field.type === 'text' && (
          <input
            className="input w-full"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            placeholder={field.placeholder}
          />
        )}
        {field.type === 'textarea' && (
          <textarea
            className="input w-full min-h-[60px] resize-y"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            placeholder={field.placeholder}
          />
        )}
        {field.type === 'date' && (
          <input
            className="input w-full"
            type="date"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
          />
        )}
        {field.type === 'number' && (
          <input
            className="input w-full"
            type="number"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            placeholder={field.placeholder}
          />
        )}
        {field.type === 'select' && (
          <select
            className="input w-full"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
          >
            <option value="">Select...</option>
            {field.options?.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
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
