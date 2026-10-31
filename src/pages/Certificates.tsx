import { useState, useMemo } from 'react';
import {
  Award,
  Search,
  ArrowLeft,
  Users,
  Building2,
  Calendar,
  ShieldCheck,
  AlertCircle,
  Download,
  QrCode,
  HeartPulse,
  CreditCard,
  FileCheck2,
  ChevronRight,
  Fingerprint,
} from 'lucide-react';
import { digitalCertificates } from '@/data/mockData';
import { Badge } from '@/components/Badge';
import { QRCode } from '@/components/QRCode';
import type { DigitalCertificate, CertificateType, CertificateStatus } from '@/types';

const statusColors: Record<CertificateStatus, 'success' | 'warning' | 'danger' | 'ink'> = {
  Active: 'success',
  Expired: 'warning',
  Suspended: 'danger',
  Revoked: 'danger',
  Replaced: 'ink',
};

const typeIcons: Record<CertificateType, typeof Award> = {
  membership: CreditCard,
  medical_alert: HeartPulse,
  fitness: FileCheck2,
};

const typeLabels: Record<CertificateType, string> = {
  membership: 'Membership Card',
  medical_alert: 'Medical Alert Card',
  fitness: 'Fitness Certificate',
};

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function Certificates() {
  const [selected, setSelected] = useState<DigitalCertificate | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const types = useMemo(() => ['all', ...Array.from(new Set(digitalCertificates.map((c) => c.certificateType)))], []);

  const filtered = useMemo(() => {
    return digitalCertificates.filter((cert) => {
      const q = search.toLowerCase();
      const matchesSearch = !q ||
        cert.employeeName.toLowerCase().includes(q) ||
        cert.companyName.toLowerCase().includes(q) ||
        cert.certificateNumber.toLowerCase().includes(q) ||
        cert.title.toLowerCase().includes(q);
      const matchesType = typeFilter === 'all' || cert.certificateType === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [search, typeFilter]);

  const stats = useMemo(() => {
    return {
      total: digitalCertificates.length,
      active: digitalCertificates.filter((c) => c.status === 'Active').length,
      membership: digitalCertificates.filter((c) => c.certificateType === 'membership').length,
      alerts: digitalCertificates.filter((c) => c.certificateType === 'medical_alert').length,
      fitness: digitalCertificates.filter((c) => c.certificateType === 'fitness').length,
    };
  }, []);

  if (selected) {
    const Icon = typeIcons[selected.certificateType];

    const cardGradient =
      selected.certificateType === 'membership'
        ? 'from-brand-700 via-brand-800 to-ink-900'
        : selected.certificateType === 'medical_alert'
        ? 'from-danger-600 via-danger-700 to-ink-900'
        : 'from-teal-600 via-teal-700 to-ink-900';

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <button onClick={() => setSelected(null)} className="btn-secondary">
            <ArrowLeft size={16} /> Back to Digital Identity
          </button>
          <div className="flex items-center gap-2">
            <Badge color={statusColors[selected.status]} dot>{selected.status}</Badge>
            <button className="btn-secondary"><Download size={16} /> Download</button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Digital Card */}
            <div className={`relative rounded-2xl overflow-hidden bg-gradient-to-br ${cardGradient} p-6 text-white shadow-xl`}>
              {/* Decorative pattern */}
              <div className="absolute top-0 right-0 w-64 h-64 opacity-10">
                <div className="absolute inset-0 rounded-full border-2 border-white" />
                <div className="absolute inset-8 rounded-full border-2 border-white" />
                <div className="absolute inset-16 rounded-full border-2 border-white" />
              </div>
              <div className="absolute bottom-0 left-0 w-48 h-48 opacity-5">
                <Fingerprint size={192} className="text-white" />
              </div>

              <div className="relative z-10">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <p className="text-xs font-semibold text-white/60 uppercase tracking-wider">STelo Health</p>
                    <h3 className="text-lg font-display font-bold mt-0.5">{typeLabels[selected.certificateType]}</h3>
                  </div>
                  <Icon size={32} className="text-white/80" />
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-white/50 uppercase tracking-wider">Cardholder</p>
                    <p className="text-xl font-bold">{selected.employeeName}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-white/50 uppercase tracking-wider">Company</p>
                      <p className="text-sm font-semibold">{selected.companyName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-white/50 uppercase tracking-wider">Certificate No.</p>
                      <p className="text-sm font-mono">{selected.certificateNumber}</p>
                    </div>
                    {selected.certificateType === 'medical_alert' && (
                      <div className="col-span-2 p-3 bg-white/15 rounded-lg backdrop-blur-sm border border-white/20">
                        <p className="text-xs text-white/70 uppercase tracking-wider mb-1">Medical Alert</p>
                        <p className="text-sm font-bold">
                          {(selected.metadata as Record<string, unknown>).alertText as string || selected.description}
                        </p>
                        {(selected.metadata as Record<string, unknown>).allergies && (
                          <p className="text-xs mt-1 text-white/80">
                            Allergies: {Array.from(selected.metadata.allergies as string[]).join(', ')}
                          </p>
                        )}
                      </div>
                    )}
                    {selected.certificateType === 'membership' && (
                      <>
                        <div>
                          <p className="text-xs text-white/50 uppercase tracking-wider">Blood Group</p>
                          <p className="text-sm font-bold">{(selected.metadata as Record<string, unknown>).bloodGroup as string || 'Unknown'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-white/50 uppercase tracking-wider">Organ Donor</p>
                          <p className="text-sm font-bold">{(selected.metadata as Record<string, unknown>).organDonor ? 'Yes' : 'No'}</p>
                        </div>
                      </>
                    )}
                    {selected.certificateType === 'fitness' && (
                      <>
                        <div>
                          <p className="text-xs text-white/50 uppercase tracking-wider">Outcome</p>
                          <p className="text-sm font-bold">{(selected.metadata as Record<string, unknown>).fitnessOutcome as string || '—'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-white/50 uppercase tracking-wider">Restrictions</p>
                          <p className="text-sm font-bold">{(selected.metadata as Record<string, unknown>).restrictions as string || 'None'}</p>
                        </div>
                      </>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/20">
                    <div>
                      <p className="text-xs text-white/50 uppercase tracking-wider">Issued</p>
                      <p className="text-sm font-semibold">{formatDate(selected.issueDate)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-white/50 uppercase tracking-wider">Valid Until</p>
                      <p className="text-sm font-semibold">{formatDate(selected.expiryDate)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Verification panel */}
            <div className="card p-5">
              <h3 className="font-display font-bold text-ink-900 mb-3 flex items-center gap-2">
                <ShieldCheck size={18} className="text-success-600" /> Verification Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs font-semibold text-ink-400 uppercase tracking-wider">Verification Code</p>
                  <p className="font-mono font-semibold text-ink-900 mt-0.5">{selected.verificationCode}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-ink-400 uppercase tracking-wider">Issued By</p>
                  <p className="font-semibold text-ink-900 mt-0.5">{selected.issuedBy}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-ink-400 uppercase tracking-wider">QR Payload</p>
                  <p className="font-mono text-xs text-ink-600 mt-0.5 break-all">{selected.qrPayload}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-ink-400 uppercase tracking-wider">Linked Medical</p>
                  <p className="font-semibold text-ink-900 mt-0.5">{selected.linkedMedicalId || '—'}</p>
                </div>
              </div>
              {selected.status === 'Revoked' && selected.revokedReason && (
                <div className="mt-4 p-3 bg-danger-50 rounded-lg">
                  <p className="text-sm text-danger-700"><AlertCircle size={14} className="inline mr-1" /> Revoked: {selected.revokedReason}</p>
                </div>
              )}
              {selected.description && selected.certificateType !== 'medical_alert' && (
                <div className="mt-4 p-3 bg-ink-50 rounded-lg">
                  <p className="text-sm text-ink-600">{selected.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* QR Code panel */}
          <div className="card p-5 flex flex-col items-center justify-center text-center">
            <h3 className="font-display font-bold text-ink-900 mb-1 flex items-center gap-2">
              <QrCode size={18} className="text-brand-600" /> Verification QR
            </h3>
            <p className="text-xs text-ink-500 mb-4">Scan to verify authenticity</p>
            <div className="p-4 bg-white border-2 border-ink-100 rounded-xl shadow-sm">
              <QRCode value={selected.qrPayload} size={192} />
            </div>
            <div className="mt-4 space-y-2 w-full">
              <div className="flex items-center justify-between text-sm py-2 border-b border-ink-100">
                <span className="text-ink-500 flex items-center gap-1.5"><Users size={14} /> Holder</span>
                <span className="font-semibold text-ink-900">{selected.employeeName}</span>
              </div>
              <div className="flex items-center justify-between text-sm py-2 border-b border-ink-100">
                <span className="text-ink-500 flex items-center gap-1.5"><Building2 size={14} /> Company</span>
                <span className="font-semibold text-ink-900 text-right">{selected.companyName}</span>
              </div>
              <div className="flex items-center justify-between text-sm py-2 border-b border-ink-100">
                <span className="text-ink-500 flex items-center gap-1.5"><Calendar size={14} /> Expires</span>
                <span className="font-semibold text-ink-900">{formatDate(selected.expiryDate)}</span>
              </div>
              <div className="flex items-center justify-between text-sm py-2">
                <span className="text-ink-500 flex items-center gap-1.5"><ShieldCheck size={14} /> Status</span>
                <Badge color={statusColors[selected.status]} dot>{selected.status}</Badge>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-display font-bold text-ink-900">Digital Identity</h2>
        <p className="text-sm text-ink-500">Membership cards, medical alert cards, and fitness certificates with QR verification</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-brand-50 flex items-center justify-center"><Award size={20} className="text-brand-600" /></div>
            <div>
              <p className="text-2xl font-bold text-ink-900">{stats.total}</p>
              <p className="text-xs text-ink-500">Total Issued</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-success-50 flex items-center justify-center"><ShieldCheck size={20} className="text-success-600" /></div>
            <div>
              <p className="text-2xl font-bold text-ink-900">{stats.active}</p>
              <p className="text-xs text-ink-500">Active</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-danger-50 flex items-center justify-center"><HeartPulse size={20} className="text-danger-600" /></div>
            <div>
              <p className="text-2xl font-bold text-ink-900">{stats.alerts}</p>
              <p className="text-xs text-ink-500">Medical Alerts</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-teal-50 flex items-center justify-center"><FileCheck2 size={20} className="text-teal-600" /></div>
            <div>
              <p className="text-2xl font-bold text-ink-900">{stats.fitness}</p>
              <p className="text-xs text-ink-500">Fitness Certs</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
          <input
            type="text"
            placeholder="Search by holder, company, or certificate number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="input sm:w-52"
        >
          {types.map((t) => (
            <option key={t} value={t}>{t === 'all' ? 'All Types' : typeLabels[t as CertificateType]}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <Award size={32} className="text-ink-300 mx-auto mb-3" />
          <p className="text-sm text-ink-500">No certificates found. Try adjusting your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((cert) => {
            const Icon = typeIcons[cert.certificateType];
            return (
              <div
                key={cert.id}
                onClick={() => setSelected(cert)}
                className="card card-hover p-5 cursor-pointer"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="h-11 w-11 rounded-xl flex items-center justify-center" style={{
                    backgroundColor:
                      cert.certificateType === 'medical_alert' ? 'rgb(254 226 226)' :
                      cert.certificateType === 'membership' ? 'rgb(224 231 255)' :
                      'rgb(204 251 241)',
                  }}>
                    <Icon size={20} style={{
                      color:
                        cert.certificateType === 'medical_alert' ? 'rgb(220 38 38)' :
                        cert.certificateType === 'membership' ? 'rgb(37 99 235)' :
                        'rgb(13 148 136)',
                    }} />
                  </div>
                  <Badge color={statusColors[cert.status]} dot>{cert.status}</Badge>
                </div>
                <p className="text-xs font-semibold text-brand-600 uppercase tracking-wider">{typeLabels[cert.certificateType]}</p>
                <h3 className="font-display font-bold text-ink-900 mt-0.5">{cert.title}</h3>
                <div className="flex items-center gap-3 mt-2 text-sm text-ink-500">
                  <span className="flex items-center gap-1"><Users size={13} /> {cert.employeeName}</span>
                </div>
                <div className="flex items-center gap-3 mt-1 text-sm text-ink-500">
                  <span className="flex items-center gap-1"><Building2 size={13} /> {cert.companyName}</span>
                </div>
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-ink-100 text-xs text-ink-500">
                  <span className="font-mono">{cert.certificateNumber}</span>
                  <span className="flex items-center gap-1"><Calendar size={12} /> {formatDate(cert.expiryDate)}</span>
                </div>
                <div className="flex items-center justify-end mt-2">
                  <span className="text-xs font-semibold text-brand-600 flex items-center gap-0.5">View details <ChevronRight size={14} /></span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
