import { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  X,
  ArrowLeft,
  Building2,
  BedDouble,
  MapPin,
  Phone,
  Mail,
  Clock,
  Star,
  AlertCircle,
  CheckCircle2,
  Calendar,
  User,
  DollarSign,
  Receipt,
  ShieldCheck,
} from 'lucide-react';
import { Badge } from '@/components/Badge';
import { isDemoMode } from '@/hooks/useSupabaseData';
import { demoHotels, demoHotelBookings } from '@/data/mockData';
import type { Hotel, HotelBooking, AccommodationCategory, AccommodationStatus } from '@/types';

const categoryColors: Record<AccommodationCategory, 'success' | 'warning' | 'brand'> = {
  Preferred: 'success',
  'Non-Verified': 'warning',
  'Core Providers': 'brand',
};

const statusColors: Record<AccommodationStatus, 'success' | 'warning' | 'danger' | 'ink'> = {
  Verified: 'success',
  Unverified: 'warning',
  Suspended: 'danger',
  Inactive: 'ink',
};

const bookingStatusColors: Record<string, 'success' | 'warning' | 'danger' | 'ink'> = {
  Confirmed: 'success',
  Pending: 'warning',
  Cancelled: 'danger',
  'Checked Out': 'ink',
};

const allCategories: AccommodationCategory[] = ['Preferred', 'Non-Verified', 'Core Providers'];
const allStatuses: AccommodationStatus[] = ['Verified', 'Unverified', 'Suspended', 'Inactive'];

const emptyHotelForm: Partial<Hotel> = {
  name: '',
  category: 'Non-Verified',
  contactPerson: '',
  phone: '',
  email: '',
  physicalAddress: '',
  area: '',
  indicativeRate: 0,
  currency: 'ZAR',
  notes: '',
};

type Tab = 'directory' | 'bookings';

export function Accommodation() {
  const [tab, setTab] = useState<Tab>('directory');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(emptyHotelForm);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [hotelState, setHotelState] = useState<Hotel[]>([]);

  const mergedHotels = useMemo(() => {
    const overrides = new Map(hotelState.map((h) => [h.id, h]));
    return demoHotels.map((h) => overrides.get(h.id) || h).concat(hotelState.filter((h) => !demoHotels.find((d) => d.id === h.id)));
  }, [hotelState]);

  const filtered = mergedHotels.filter((h) => {
    const matchSearch =
      h.name.toLowerCase().includes(search.toLowerCase()) ||
      h.area.toLowerCase().includes(search.toLowerCase());
    const matchCategory = categoryFilter === 'all' || h.category === categoryFilter;
    const matchStatus = statusFilter === 'all' || h.status === statusFilter;
    return matchSearch && matchCategory && matchStatus;
  });

  const counts = {
    total: mergedHotels.length,
    preferred: mergedHotels.filter((h) => h.category === 'Preferred').length,
    core: mergedHotels.filter((h) => h.category === 'Core Providers').length,
    nonVerified: mergedHotels.filter((h) => h.category === 'Non-Verified').length,
    verified: mergedHotels.filter((h) => h.status === 'Verified').length,
    unverified: mergedHotels.filter((h) => h.status === 'Unverified').length,
  };

  const bookingsForHotel = (hotelId: string): HotelBooking[] => demoHotelBookings.filter((b) => b.hotelId === hotelId);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (!formData.name) {
      setSubmitError('Hotel name is required.');
      return;
    }
    const newHotel: Hotel = {
      id: `hotel-demo-${Date.now()}`,
      name: formData.name,
      category: (formData.category as AccommodationCategory) || 'Non-Verified',
      status: 'Unverified',
      contactPerson: formData.contactPerson || 'To be confirmed',
      phone: formData.phone || 'To be confirmed',
      email: formData.email || 'To be confirmed',
      physicalAddress: formData.physicalAddress || 'To be confirmed',
      gpsCoordinates: null,
      area: formData.area || 'To be confirmed',
      roomTypes: [],
      indicativeRate: formData.indicativeRate || 0,
      currency: (formData.currency as Hotel['currency']) || 'ZAR',
      operatingDetails: 'To be confirmed',
      bookingContact: 'To be confirmed',
      notes: formData.notes || 'Newly created record — all fields pending verification.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setHotelState((prev: Hotel[]) => [...prev, newHotel]);
    setShowForm(false);
    setFormData(emptyHotelForm);
  };

  if (selectedHotel) {
    const h = selectedHotel;
    const bookings = bookingsForHotel(h.id);
    return (
      <div className="space-y-6">
        <button onClick={() => setSelectedHotel(null)} className="btn-ghost">
          <ArrowLeft size={16} /> Back to Accommodation
        </button>

        <div className="card p-6 space-y-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <BedDouble size={20} className="text-brand-600" />
                <h2 className="text-xl font-display font-bold text-ink-900">{h.name}</h2>
              </div>
              <div className="flex items-center gap-2">
                <Badge color={categoryColors[h.category]}>{h.category}</Badge>
                <Badge color={statusColors[h.status]}>{h.status}</Badge>
              </div>
            </div>
          </div>

          {!h.gpsCoordinates && (
            <div className="p-3 bg-ink-50 text-ink-500 text-sm rounded-lg flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              GPS coordinates not yet captured — location-based discovery unavailable for this property.
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DetailItem icon={MapPin} label="Area" value={h.area} />
            <DetailItem icon={MapPin} label="Address" value={h.physicalAddress} />
            <DetailItem icon={User} label="Contact Person" value={h.contactPerson} />
            <DetailItem icon={Phone} label="Phone" value={h.phone} />
            <DetailItem icon={Mail} label="Email" value={h.email} />
            <DetailItem icon={Clock} label="Operating Details" value={h.operatingDetails} />
            <DetailItem icon={DollarSign} label="Indicative Rate" value={`${h.currency} ${h.indicativeRate.toLocaleString()}/night`} />
            <DetailItem icon={Receipt} label="Booking Contact" value={h.bookingContact} />
          </div>

          {h.roomTypes.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-ink-400 uppercase tracking-wide mb-2">Room Types</p>
              <div className="flex flex-wrap gap-2">
                {h.roomTypes.map((rt: string) => (
                  <span key={rt} className="px-2 py-1 bg-ink-50 text-ink-700 text-xs rounded-md">{rt}</span>
                ))}
              </div>
            </div>
          )}

          {h.notes && (
            <div className="p-3 bg-ink-50 rounded-lg">
              <p className="text-xs font-semibold text-ink-400 uppercase tracking-wide mb-1">Notes</p>
              <p className="text-sm text-ink-700">{h.notes}</p>
            </div>
          )}
        </div>

        <div className="card p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-brand-600" />
            <h3 className="text-lg font-bold text-ink-900">Bookings ({bookings.length})</h3>
          </div>
          {bookings.length === 0 ? (
            <p className="text-sm text-ink-400">No bookings recorded for this property.</p>
          ) : (
            <div className="space-y-2">
              {bookings.map((b: HotelBooking) => (
                <BookingCard key={b.id} booking={b} />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {isDemoMode && (
        <div className="p-3 bg-warning-50 text-warning-700 text-sm rounded-lg flex items-center gap-2">
          <AlertCircle size={16} className="shrink-0" />
          Demo mode — all accommodation records are fictional sample data with unverified placeholder fields.
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-display font-bold text-ink-900">Accommodation</h2>
          <p className="text-sm text-ink-500">{tab === 'directory' ? `${filtered.length} properties` : `${demoHotelBookings.length} bookings`}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-ink-100 rounded-lg p-1">
            <button
              onClick={() => setTab('directory')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${tab === 'directory' ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500'}`}
            >
              Directory
            </button>
            <button
              onClick={() => setTab('bookings')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${tab === 'bookings' ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500'}`}
            >
              Bookings
            </button>
          </div>
          {tab === 'directory' && (
            <button className="btn-primary" onClick={() => { setFormData(emptyHotelForm); setShowForm(true); }}>
              <Plus size={16} /> Add Hotel
            </button>
          )}
        </div>
      </div>

      {tab === 'directory' ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <HotelStat icon={Building2} label="Total" value={counts.total} color="brand" />
            <HotelStat icon={Star} label="Preferred" value={counts.preferred} color="success" />
            <HotelStat icon={ShieldCheck} label="Core Providers" value={counts.core} color="brand" />
            <HotelStat icon={AlertCircle} label="Non-Verified" value={counts.nonVerified} color="warning" />
            <HotelStat icon={CheckCircle2} label="Verified" value={counts.verified} color="success" />
            <HotelStat icon={AlertCircle} label="Unverified" value={counts.unverified} color="warning" />
          </div>

          <div className="space-y-3">
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
              <input type="text" placeholder="Search by hotel name or area..." value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-10" />
            </div>
            <div className="flex flex-wrap gap-2">
              <FilterSelect label="Category" value={categoryFilter} options={['all', ...allCategories]} onChange={setCategoryFilter} />
              <FilterSelect label="Status" value={statusFilter} options={['all', ...allStatuses]} onChange={setStatusFilter} />
            </div>
          </div>

          {showForm && (
            <div className="card p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-ink-900">Add New Hotel</h3>
                <button type="button" className="btn-secondary" onClick={() => { setShowForm(false); setFormData(emptyHotelForm); }}><X size={16} /> Cancel</button>
              </div>
              {submitError && <div className="p-3 bg-danger-50 text-danger-700 text-sm rounded-lg">{submitError}</div>}
              <form className="space-y-4" onSubmit={handleCreate}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-ink-700 mb-1">Hotel Name</label>
                    <input type="text" className="input" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Hotel or accommodation name" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ink-700 mb-1">Category</label>
                    <select className="input" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value as AccommodationCategory })}>
                      <option value="Preferred">Preferred</option>
                      <option value="Non-Verified">Non-Verified</option>
                      <option value="Core Providers">Core Providers</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ink-700 mb-1">Area</label>
                    <input type="text" className="input" value={formData.area} onChange={(e) => setFormData({ ...formData, area: e.target.value })} placeholder="City, Province" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ink-700 mb-1">Contact Person</label>
                    <input type="text" className="input" value={formData.contactPerson} onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ink-700 mb-1">Phone</label>
                    <input type="text" className="input" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ink-700 mb-1">Email</label>
                    <input type="text" className="input" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ink-700 mb-1">Physical Address</label>
                    <input type="text" className="input" value={formData.physicalAddress} onChange={(e) => setFormData({ ...formData, physicalAddress: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ink-700 mb-1">Indicative Rate (per night)</label>
                    <input type="number" className="input" value={formData.indicativeRate || ''} onChange={(e) => setFormData({ ...formData, indicativeRate: Number(e.target.value) })} placeholder="0" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-ink-700 mb-1">Currency</label>
                    <select className="input" value={formData.currency} onChange={(e) => setFormData({ ...formData, currency: e.target.value as Hotel['currency'] })}>
                      <option value="ZAR">ZAR</option>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                      <option value="AED">AED</option>
                      <option value="KES">KES</option>
                      <option value="SGD">SGD</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-ink-700 mb-1">Notes</label>
                    <textarea className="input min-h-[60px]" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Additional notes" />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button type="button" className="btn-secondary" onClick={() => { setShowForm(false); setFormData(emptyHotelForm); }}>Cancel</button>
                  <button type="submit" className="btn-primary"><Building2 size={16} /> Add Hotel</button>
                </div>
              </form>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.length === 0 ? (
              <div className="col-span-full card p-8 text-center text-ink-400">
                <BedDouble size={32} className="mx-auto mb-2 opacity-50" />
                <p>No hotels match your filters.</p>
              </div>
            ) : (
              filtered.map((h) => (
                <button
                  key={h.id}
                  onClick={() => setSelectedHotel(h)}
                  className="card p-4 text-left hover:border-brand-300 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center shrink-0">
                      <BedDouble size={18} className="text-brand-600" />
                    </div>
                    <div className="flex gap-1">
                      <Badge color={categoryColors[h.category]}>{h.category}</Badge>
                    </div>
                  </div>
                  <h3 className="text-sm font-bold text-ink-900 mb-1">{h.name}</h3>
                  <p className="text-xs text-ink-500 mb-2">{h.area}</p>
                  <div className="flex items-center justify-between text-xs">
                    <Badge color={statusColors[h.status]}>{h.status}</Badge>
                    <span className="text-ink-700 font-medium">{h.currency} {h.indicativeRate.toLocaleString()}/night</span>
                  </div>
                  {h.roomTypes.length > 0 && (
                    <p className="text-xs text-ink-400 mt-2">{h.roomTypes.join(' · ')}</p>
                  )}
                </button>
              ))
            )}
          </div>
        </>
      ) : (
        <div className="space-y-3">
          {demoHotelBookings.length === 0 ? (
            <div className="card p-8 text-center text-ink-400">
              <Calendar size={32} className="mx-auto mb-2 opacity-50" />
              <p>No bookings recorded.</p>
            </div>
          ) : (
            demoHotelBookings.map((b) => <BookingCard key={b.id} booking={b} />)
          )}
        </div>
      )}
    </div>
  );
}

function BookingCard({ booking: b }: { booking: HotelBooking }) {
  const paymentColors: Record<string, 'brand' | 'success' | 'ink'> = {
    GOP: 'brand',
    Company: 'success',
    Employee: 'ink',
  };
  return (
    <div className="card p-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center shrink-0">
            <Calendar size={18} className="text-brand-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-ink-900">{b.travellerName}</span>
              <Badge color={bookingStatusColors[b.status]}>{b.status}</Badge>
            </div>
            <p className="text-xs text-ink-500 mt-0.5">{b.hotelName} · {b.companyName}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs text-ink-500">
          <span>{b.checkInDate} → {b.checkOutDate}</span>
          <span className="font-semibold text-ink-700">{b.currency} {b.agreedRate.toLocaleString()}/night</span>
          <Badge color={paymentColors[b.paymentResponsibility]}>{b.paymentResponsibility}</Badge>
        </div>
      </div>
      <div className="flex flex-wrap gap-4 mt-3 text-xs text-ink-500">
        <span>Room: {b.roomType}</span>
        <span>Confirmation: {b.bookingConfirmation || 'Pending'}</span>
        {b.linkedGOPId && <span className="text-brand-600 font-medium">Linked GOP</span>}
      </div>
      {b.bookingNotes && <p className="text-xs text-ink-400 mt-2">{b.bookingNotes}</p>}
    </div>
  );
}

function DetailItem({ icon: Icon, label, value }: { icon: typeof Building2; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <Icon size={16} className="text-ink-400 mt-0.5 shrink-0" />
      <div>
        <p className="text-xs font-semibold text-ink-400 uppercase tracking-wide">{label}</p>
        <p className="text-sm text-ink-900">{value}</p>
      </div>
    </div>
  );
}

function HotelStat({ icon: Icon, label, value, color }: { icon: typeof Building2; label: string; value: number; color: 'brand' | 'success' | 'warning' | 'danger' }) {
  const colorClasses: Record<string, string> = {
    brand: 'bg-brand-50 text-brand-600',
    success: 'bg-success-50 text-success-600',
    warning: 'bg-warning-50 text-warning-600',
    danger: 'bg-danger-50 text-danger-600',
  };
  return (
    <div className="card p-3 flex items-center gap-3">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${colorClasses[color]}`}>
        <Icon size={16} />
      </div>
      <div>
        <p className="text-lg font-bold text-ink-900 leading-none">{value}</p>
        <p className="text-xs text-ink-400 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

function FilterSelect({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs font-semibold text-ink-400">{label}:</span>
      <select
        className="text-sm border border-ink-200 rounded-lg px-2 py-1.5 bg-white text-ink-900 focus:outline-none focus:border-brand-500"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt === 'all' ? 'All' : opt}</option>
        ))}
      </select>
    </div>
  );
}
