import { useState, useMemo } from 'react';
import {
  Workflow,
  Search,
  Filter,
  ArrowLeft,
  Users,
  Building2,
  Clock,
  CheckCircle2,
  Circle,
  AlertCircle,
  PlayCircle,
  Lock,
  ChevronRight,
  ClipboardList,
  Activity,
} from 'lucide-react';
import { workflowDefinitions, workflowInstances } from '@/data/mockData';
import { Badge } from '@/components/Badge';
import type {
  WorkflowDefinition,
  WorkflowInstance,
  WorkflowStepStatus,
  WorkflowInstanceStatus,
} from '@/types';

const instanceStatusColors: Record<WorkflowInstanceStatus, 'success' | 'warning' | 'danger' | 'brand' | 'ink'> = {
  'Not Started': 'ink',
  'In Progress': 'brand',
  'On Hold': 'warning',
  'Completed': 'success',
  'Cancelled': 'danger',
};

const stepStatusColors: Record<WorkflowStepStatus, 'success' | 'warning' | 'danger' | 'brand' | 'ink' | 'accent'> = {
  Pending: 'ink',
  'In Progress': 'brand',
  Completed: 'success',
  Skipped: 'ink',
  Blocked: 'danger',
  Exception: 'warning',
};

const stepStatusIcons: Record<WorkflowStepStatus, typeof Circle> = {
  Pending: Circle,
  'In Progress': PlayCircle,
  Completed: CheckCircle2,
  Skipped: Lock,
  Blocked: AlertCircle,
  Exception: AlertCircle,
};

const roleLabels: Record<string, string> = {
  admin: 'Admin',
  coordinator: 'Coordinator',
  employer: 'HR / Employer',
  provider: 'Provider / Doctor',
  employee: 'Employee',
  lab: 'Laboratory',
  ai: 'AI Assistant',
};

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatDateTime(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ' · ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

export function Workflows() {
  const [view, setView] = useState<'library' | 'instances'>('instances');
  const [selectedDef, setSelectedDef] = useState<WorkflowDefinition | null>(null);
  const [selectedInst, setSelectedInst] = useState<WorkflowInstance | null>(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const categories = useMemo(() => {
    const cats = new Set(workflowDefinitions.map((d) => d.category));
    return ['all', ...Array.from(cats)];
  }, []);

  const filteredInstances = useMemo(() => {
    return workflowInstances.filter((inst) => {
      const q = search.toLowerCase();
      const matchesSearch = !q ||
        inst.employeeName.toLowerCase().includes(q) ||
        inst.companyName.toLowerCase().includes(q) ||
        inst.instanceReference.toLowerCase().includes(q) ||
        inst.workflowName.toLowerCase().includes(q);
      const matchesCategory = categoryFilter === 'all' ||
        workflowDefinitions.find((d) => d.id === inst.workflowDefinitionId)?.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [search, categoryFilter]);

  const filteredDefs = useMemo(() => {
    return workflowDefinitions.filter((d) => {
      const q = search.toLowerCase();
      const matchesSearch = !q ||
        d.name.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q);
      const matchesCategory = categoryFilter === 'all' || d.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [search, categoryFilter]);

  if (selectedInst) {
    const def = workflowDefinitions.find((d) => d.id === selectedInst.workflowDefinitionId);
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <button onClick={() => setSelectedInst(null)} className="btn-secondary">
            <ArrowLeft size={16} /> Back to Workflow Instances
          </button>
          <Badge color={instanceStatusColors[selectedInst.status]} dot>{selectedInst.status}</Badge>
        </div>

        <div className="card p-5 lg:p-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-brand-600 uppercase tracking-wider mb-1">{selectedInst.instanceReference}</p>
              <h2 className="text-xl font-display font-bold text-ink-900">{selectedInst.workflowName}</h2>
              <p className="text-sm text-ink-500 mt-1">{def?.description}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 text-sm">
              <div>
                <p className="text-ink-400 text-xs uppercase tracking-wider">Employee</p>
                <p className="font-semibold text-ink-900 flex items-center gap-1.5"><Users size={14} /> {selectedInst.employeeName}</p>
              </div>
              <div>
                <p className="text-ink-400 text-xs uppercase tracking-wider">Company</p>
                <p className="font-semibold text-ink-900 flex items-center gap-1.5"><Building2 size={14} /> {selectedInst.companyName}</p>
              </div>
              <div>
                <p className="text-ink-400 text-xs uppercase tracking-wider">Assigned to</p>
                <p className="font-semibold text-ink-900">{selectedInst.assignedTo}</p>
              </div>
              <div>
                <p className="text-ink-400 text-xs uppercase tracking-wider">Progress</p>
                <p className="font-semibold text-ink-900">{selectedInst.currentStep} / {selectedInst.totalSteps} steps</p>
              </div>
            </div>
          </div>

          {selectedInst.notes && (
            <div className="mt-4 p-3 bg-brand-50 rounded-lg">
              <p className="text-sm text-brand-800">{selectedInst.notes}</p>
            </div>
          )}

          <div className="mt-4">
            <div className="h-2 bg-ink-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-500 rounded-full transition-all"
                style={{ width: `${(selectedInst.currentStep / selectedInst.totalSteps) * 100}%` }}
              />
            </div>
          </div>
        </div>

        <div className="card p-5">
          <h3 className="font-display font-bold text-ink-900 mb-4 flex items-center gap-2">
            <ClipboardList size={18} className="text-brand-600" /> Process Steps
          </h3>
          <div className="space-y-3">
            {selectedInst.stepInstances.map((step, idx) => {
              const StepIcon = stepStatusIcons[step.status];
              const isLast = idx === selectedInst.stepInstances.length - 1;
              return (
                <div key={step.id} className="relative">
                  {!isLast && (
                    <div className="absolute left-[19px] top-10 bottom-0 w-0.5 bg-ink-100" />
                  )}
                  <div className="flex gap-4 pb-6">
                    <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center border-2 ${
                      step.status === 'Completed' ? 'bg-success-50 border-success-200 text-success-600' :
                      step.status === 'In Progress' ? 'bg-brand-50 border-brand-200 text-brand-600' :
                      step.status === 'Exception' || step.status === 'Blocked' ? 'bg-warning-50 border-warning-200 text-warning-600' :
                      'bg-ink-50 border-ink-200 text-ink-400'
                    }`}>
                      <StepIcon size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-ink-400">Step {step.stepNumber}</span>
                            <h4 className="font-semibold text-ink-900">{step.stepName}</h4>
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-ink-500">
                            <span>Role: {roleLabels[step.responsibleRole] || step.responsibleRole}</span>
                            {step.assignedPerson && <span>· {step.assignedPerson}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {step.exceptionFlagged && (
                            <Badge color="warning" dot>Exception</Badge>
                          )}
                          <Badge color={stepStatusColors[step.status]}>{step.status}</Badge>
                        </div>
                      </div>
                      {step.notes && (
                        <p className="text-sm text-ink-600 mt-2 bg-ink-50 rounded-lg p-2.5">{step.notes}</p>
                      )}
                      <div className="flex flex-wrap gap-4 mt-2 text-xs text-ink-400">
                        <span className="flex items-center gap-1"><Clock size={12} /> Started: {formatDateTime(step.startedAt)}</span>
                        <span className="flex items-center gap-1"><CheckCircle2 size={12} /> Completed: {formatDateTime(step.completedAt)}</span>
                      </div>
                      {step.exceptionFlagged && step.exceptionReason && (
                        <div className="mt-2 p-2.5 bg-warning-50 rounded-lg">
                          <p className="text-xs text-warning-700"><AlertCircle size={12} className="inline mr-1" /> {step.exceptionReason}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  if (selectedDef) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <button onClick={() => setSelectedDef(null)} className="btn-secondary">
            <ArrowLeft size={16} /> Back to Workflow Library
          </button>
          <Badge color={selectedDef.active ? 'success' : 'ink'} dot>{selectedDef.active ? 'Active' : 'Inactive'}</Badge>
        </div>

        <div className="card p-5 lg:p-6">
          <p className="text-xs font-semibold text-brand-600 uppercase tracking-wider mb-1">{selectedDef.category}</p>
          <h2 className="text-xl font-display font-bold text-ink-900">{selectedDef.name}</h2>
          <p className="text-sm text-ink-500 mt-2 max-w-3xl">{selectedDef.description}</p>
          <div className="flex flex-wrap gap-4 mt-4 text-sm">
            <span className="text-ink-500">Version <span className="font-semibold text-ink-900">{selectedDef.version}</span></span>
            <span className="text-ink-500">Steps: <span className="font-semibold text-ink-900">{selectedDef.steps.length}</span></span>
            <span className="text-ink-500">Created: <span className="font-semibold text-ink-900">{formatDate(selectedDef.createdAt)}</span></span>
          </div>
        </div>

        <div className="card p-5">
          <h3 className="font-display font-bold text-ink-900 mb-4 flex items-center gap-2">
            <ClipboardList size={18} className="text-brand-600" /> Process Definition ({selectedDef.steps.length} steps)
          </h3>
          <div className="space-y-3">
            {selectedDef.steps.map((step, idx) => {
              const isLast = idx === selectedDef.steps.length - 1;
              return (
                <div key={step.id} className="relative">
                  {!isLast && (
                    <div className="absolute left-[19px] top-10 bottom-0 w-0.5 bg-ink-100" />
                  )}
                  <div className="flex gap-4 pb-6">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-brand-50 border-2 border-brand-200 flex items-center justify-center text-brand-600 font-bold text-sm">
                      {step.stepNumber}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-ink-900">{step.stepName}</h4>
                      <p className="text-sm text-ink-500 mt-1">{step.purpose}</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                        <div className="space-y-2">
                          <div>
                            <p className="text-xs font-semibold text-ink-400 uppercase tracking-wider">Responsible Role</p>
                            <Badge color="teal">{roleLabels[step.responsibleRole] || step.responsibleRole}</Badge>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-ink-400 uppercase tracking-wider">Required Info</p>
                            <ul className="text-sm text-ink-600 list-disc list-inside">
                              {step.requiredInfo.map((info) => <li key={info}>{info}</li>)}
                            </ul>
                          </div>
                          {step.requiredDocuments.length > 0 && (
                            <div>
                              <p className="text-xs font-semibold text-ink-400 uppercase tracking-wider">Required Documents</p>
                              <ul className="text-sm text-ink-600 list-disc list-inside">
                                {step.requiredDocuments.map((doc) => <li key={doc}>{doc}</li>)}
                              </ul>
                            </div>
                          )}
                        </div>
                        <div className="space-y-2">
                          <div>
                            <p className="text-xs font-semibold text-ink-400 uppercase tracking-wider">Instructions</p>
                            <p className="text-sm text-ink-600">{step.instructions}</p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-ink-400 uppercase tracking-wider">Completion Criteria</p>
                            <p className="text-sm text-ink-600">{step.completionCriteria}</p>
                          </div>
                          {step.requiredApprovals.length > 0 && (
                            <div>
                              <p className="text-xs font-semibold text-ink-400 uppercase tracking-wider">Required Approvals</p>
                              <ul className="text-sm text-ink-600 list-disc list-inside">
                                {step.requiredApprovals.map((a) => <li key={a}>{a}</li>)}
                              </ul>
                            </div>
                          )}
                          <div>
                            <p className="text-xs font-semibold text-ink-400 uppercase tracking-wider">System Actions</p>
                            <div className="flex flex-wrap gap-1.5 mt-1">
                              {step.systemActions.map((a) => (
                                <span key={a} className="text-xs bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full">{a}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 p-3 bg-ink-50 rounded-lg space-y-1">
                        <p className="text-xs text-ink-500"><span className="font-semibold">Escalation:</span> {step.escalationRules}</p>
                        <p className="text-xs text-ink-500"><span className="font-semibold">Exception handling:</span> {step.exceptionHandling}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-display font-bold text-ink-900">Workflow Centre</h2>
          <p className="text-sm text-ink-500">Manage process definitions and track live workflow instances</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
          <input
            type="text"
            placeholder="Search by employee, company, or reference..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="input sm:w-52"
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat === 'all' ? 'All Categories' : cat}</option>
          ))}
        </select>
      </div>

      <div className="flex gap-1 p-1 bg-ink-100 rounded-lg w-fit">
        <button
          onClick={() => setView('instances')}
          className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${view === 'instances' ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500'}`}
        >
          <Activity size={15} className="inline mr-1.5" /> Live Instances
        </button>
        <button
          onClick={() => setView('library')}
          className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${view === 'library' ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500'}`}
        >
          <Workflow size={15} className="inline mr-1.5" /> Process Library
        </button>
      </div>

      {view === 'instances' && (
        filteredInstances.length === 0 ? (
          <div className="card p-12 text-center">
            <Workflow size={32} className="text-ink-300 mx-auto mb-3" />
            <p className="text-sm text-ink-500">No workflow instances found. Try adjusting your filters.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredInstances.map((inst) => {
              const def = workflowDefinitions.find((d) => d.id === inst.workflowDefinitionId);
              const completedSteps = inst.stepInstances.filter((s) => s.status === 'Completed').length;
              return (
                <div
                  key={inst.id}
                  onClick={() => setSelectedInst(inst)}
                  className="card card-hover p-4 cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 h-12 w-12 rounded-xl bg-brand-50 flex items-center justify-center">
                      <Workflow size={22} className="text-brand-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono font-semibold text-brand-600">{inst.instanceReference}</span>
                        <Badge color={instanceStatusColors[inst.status]} dot>{inst.status}</Badge>
                      </div>
                      <h3 className="font-display font-bold text-ink-900 mt-0.5">{inst.workflowName}</h3>
                      <div className="flex items-center gap-3 mt-1 text-sm text-ink-500">
                        <span className="flex items-center gap-1"><Users size={13} /> {inst.employeeName}</span>
                        <span className="flex items-center gap-1"><Building2 size={13} /> {inst.companyName}</span>
                        {def && <Badge color="ink">{def.category}</Badge>}
                      </div>
                    </div>
                    <div className="flex-shrink-0 text-right hidden sm:block">
                      <p className="text-xs text-ink-400">Progress</p>
                      <p className="font-semibold text-ink-900">{completedSteps} / {inst.totalSteps}</p>
                      <div className="w-24 h-1.5 bg-ink-100 rounded-full mt-1 overflow-hidden">
                        <div className="h-full bg-brand-500 rounded-full" style={{ width: `${(completedSteps / inst.totalSteps) * 100}%` }} />
                      </div>
                    </div>
                    <ChevronRight size={20} className="text-ink-300 flex-shrink-0" />
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {view === 'library' && (
        filteredDefs.length === 0 ? (
          <div className="card p-12 text-center">
            <Workflow size={32} className="text-ink-300 mx-auto mb-3" />
            <p className="text-sm text-ink-500">No workflow definitions found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredDefs.map((def) => {
              const instanceCount = workflowInstances.filter((i) => i.workflowDefinitionId === def.id).length;
              return (
                <div
                  key={def.id}
                  onClick={() => setSelectedDef(def)}
                  className="card card-hover p-5 cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="h-11 w-11 rounded-xl bg-brand-50 flex items-center justify-center">
                      <Workflow size={20} className="text-brand-600" />
                    </div>
                    <Badge color={def.active ? 'success' : 'ink'} dot>{def.active ? 'Active' : 'Inactive'}</Badge>
                  </div>
                  <p className="text-xs font-semibold text-brand-600 uppercase tracking-wider">{def.category}</p>
                  <h3 className="font-display font-bold text-ink-900 mt-1">{def.name}</h3>
                  <p className="text-sm text-ink-500 mt-1 line-clamp-2">{def.description}</p>
                  <div className="flex items-center gap-4 mt-4 pt-4 border-t border-ink-100 text-xs text-ink-500">
                    <span className="flex items-center gap-1"><ClipboardList size={13} /> {def.steps.length} steps</span>
                    <span className="flex items-center gap-1"><Activity size={13} /> {instanceCount} live</span>
                    <span>v{def.version}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}
