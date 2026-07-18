/**
 * Typed client for the Fly Together backend (Express + Prisma).
 * One place that knows every endpoint. Handles JWT storage, the standard
 * `{ data }` / `{ error }` envelopes, and a single refresh-on-401 retry.
 */

const BASE_URL: string =
  (import.meta.env.VITE_API_URL as string | undefined) || 'http://localhost:4000/api';

// Signed URLs from the backend are relative paths ("/api/files/...").
// In production they share an origin with the frontend; in dev the backend
// is on a different port, so we need to prepend the backend origin.
export function resolveSignedUrl(url: string): string {
  if (url.startsWith('http')) return url;
  const apiOrigin = new URL(BASE_URL).origin; // e.g. "http://localhost:4000"
  return `${apiOrigin}${url}`;
}

const ACCESS_KEY = 'ft_access_token';
const REFRESH_KEY = 'ft_refresh_token';

export const tokenStore = {
  get access() {
    return localStorage.getItem(ACCESS_KEY);
  },
  get refresh() {
    return localStorage.getItem(REFRESH_KEY);
  },
  set(access: string, refresh?: string) {
    if (access) localStorage.setItem(ACCESS_KEY, access);
    if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
  },
  clear() {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  /** Attach the bearer token (default true). */
  auth?: boolean;
  /** Send FormData instead of JSON (for file uploads). */
  form?: FormData;
  /** Internal: prevents infinite refresh recursion. */
  _retried?: boolean;
}

// ---------- Global upload activity (for the branded uploading loader) ----------
// Any request that sends FormData is treated as an "upload". Components can
// subscribe to show a logo loader while one or more uploads are in flight.
let activeUploads = 0;
const uploadListeners = new Set<(active: number) => void>();
function emitUploadActivity() {
  for (const fn of uploadListeners) fn(activeUploads);
}
export const uploadActivity = {
  /** Subscribe to the in-flight upload count; returns an unsubscribe fn. */
  subscribe(fn: (active: number) => void): () => void {
    uploadListeners.add(fn);
    fn(activeUploads);
    return () => uploadListeners.delete(fn);
  },
};

async function rawRequest<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, auth = true, form } = opts;
  const headers: Record<string, string> = {};
  if (auth && tokenStore.access) headers['Authorization'] = `Bearer ${tokenStore.access}`;

  let payload: BodyInit | undefined;
  if (form) {
    payload = form; // browser sets multipart boundary
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  // Count this as an active upload (skip on the internal 401-refresh retry so it
  // isn't double-counted).
  const isUpload = !!form && !opts._retried;
  if (isUpload) {
    activeUploads++;
    emitUploadActivity();
  }
  try {
    const res = await fetch(`${BASE_URL}${path}`, { method, headers, body: payload });

    // 204 / empty
    if (res.status === 204) return undefined as T;

    let json: any = null;
    const text = await res.text();
    if (text) {
      try {
        json = JSON.parse(text);
      } catch {
        json = null;
      }
    }

    if (!res.ok) {
      // Try a single refresh on 401, then retry the original request.
      if (res.status === 401 && auth && !opts._retried && tokenStore.refresh) {
        const refreshed = await tryRefresh();
        if (refreshed) return rawRequest<T>(path, { ...opts, _retried: true });
      }
      const err = json?.error;
      throw new ApiError(res.status, err?.code ?? 'ERROR', err?.message ?? res.statusText, err?.details);
    }

    return (json?.data ?? json) as T;
  } finally {
    if (isUpload) {
      activeUploads--;
      emitUploadActivity();
    }
  }
}

let refreshing: Promise<boolean> | null = null;
function tryRefresh(): Promise<boolean> {
  if (refreshing) return refreshing;
  refreshing = (async () => {
    try {
      const res = await fetch(`${BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: tokenStore.refresh }),
      });
      if (!res.ok) {
        tokenStore.clear();
        return false;
      }
      const json = await res.json();
      tokenStore.set(json.data.accessToken, json.data.refreshToken);
      return true;
    } catch {
      tokenStore.clear();
      return false;
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}

// ---------- Domain types (mirror backend responses) ----------

export type Role = 'STUDENT' | 'ADMIN' | 'AGENT';

export type Gender = 'MALE' | 'FEMALE' | 'OTHERS';
export interface AuthUser {
  id: string;
  email: string;
  role: Role;
  phoneNumber: string | null;
  gender: Gender | null;
}
export interface AuthResult {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

export interface StudentProfile {
  id: string;
  userId: string;
  agentId: string | null;
  agent?: { id: string; name: string } | null;
  firstName: string | null;
  lastName: string | null;
  dob: string | null;
  address: string | null;
  isProfileCompleted: boolean;
  isProfileVerified: boolean;
  isDocSubmitted: boolean;
  profileCompletion: number;
}

export type DocType = 'PASSPORT' | 'AADHAR' | 'ACADEMICS' | 'IELTS';
export type AcademicSubType = 'TENTH' | 'TWELFTH' | 'GRADUATION' | 'OTHER';
export type DocStatus = 'UPLOADED' | 'PENDING' | 'VERIFIED' | 'REJECTED';
export interface StudentDocument {
  id: string;
  studentId: string;
  docUrl: string;
  docType: DocType;
  subType: AcademicSubType | null;
  status: DocStatus;
  removed: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Human-readable label for a document, including the academic subtype. */
export const ACADEMIC_SUBTYPE_LABELS: Record<AcademicSubType, string> = {
  TENTH: '10th Certificate',
  TWELFTH: '12th Certificate',
  GRADUATION: 'Graduation',
  OTHER: 'Other Academic',
};

export function docLabel(doc: { docType: DocType; subType?: AcademicSubType | null }): string {
  if (doc.docType === 'ACADEMICS' && doc.subType) return ACADEMIC_SUBTYPE_LABELS[doc.subType];
  if (doc.docType === 'ACADEMICS') return 'Academic Certificate';
  return doc.docType.charAt(0) + doc.docType.slice(1).toLowerCase();
}

export interface University {
  id: string;
  name: string;
  location: string;
  logo: string;
  rating: number;
  tuitionFee: string;
  description: string;
  courses: string[];
}

export interface Accommodation {
  id: string;
  name: string;
  city: string;
  universityProximity: string | null;
  price: string;
  type: string;
  amenities: string[];
  image: string;
  description: string;
  lat: number | null;
  lng: number | null;
}

/** A normalized listing from the Amber Student partner inventory feed. */
export interface AmberListing {
  id: number;
  name: string;
  slug: string;
  locality: string;
  country: string;
  currency: string;
  priceMin: number | null;
  priceMax: number | null;
  duration: string | null;
  image: string | null;
  types: string[];
  tags: string[];
  bedrooms: { min: number | null; max: number | null };
  bathrooms: { min: number | null; max: number | null };
  nearestPlace: string | null;
  nearestDistance: string | null;
  availableFrom: string | null;
  lat: number | null;
  lng: number | null;
  partnerUrl: string | null;
}

export interface AmberSearchResult {
  items: AmberListing[];
  meta: { page: number; count: number; pages: number; hasNext: boolean };
}

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED';

export interface AccommodationBooking {
  id: string;
  accommodationId: string;
  accommodation: Pick<Accommodation, 'id' | 'name' | 'city' | 'price' | 'image' | 'type'>;
  user: { id: string; email: string };
  checkIn: string;
  checkOut: string;
  status: BookingStatus;
  message: string | null;
  createdAt: string;
}

export type ServiceCategory =
  | 'ACCOMMODATION'
  | 'TICKET_BOOKING'
  | 'LOANS'
  | 'LOGISTICS'
  | 'ONLINE_PAYMENT';
export interface ServiceProvider {
  id: string;
  name: string;
  category: ServiceCategory;
  rating: number;
  price: string;
  location: string | null;
  image: string;
  description: string;
}

export interface Partner {
  id: string;
  name: string;
  imageUrl: string;
  redirectionUrl: string;
}

export interface Blog {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  author: string;
  category: string;
  readTime: string;
  isActive: boolean;
  videoUrl: string | null;
  publishedBy: string | null;
  createdAt: string;
}

export type MediaType = 'IMAGE' | 'VIDEO';
export interface Testimonial {
  id: string;
  studentName: string;
  universityName: string | null;
  content: string;
  mediaUrl: string;
  mediaType: MediaType;
  avatarUrl: string | null;
  isActive: boolean;
  createdAt: string;
}

export type LoanStatus =
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'DOCUMENTS_REQUESTED'
  | 'APPROVED'
  | 'REJECTED'
  | 'DISBURSED';

export interface LoanDocumentEntry {
  key: string;
  label: string;
  status?: string;
  url?: string | null;
}

export interface LoanDocumentGroup {
  category: string;
  label: string;
  documents: LoanDocumentEntry[];
}

export interface LoanDocumentRequest {
  reason: string;
  docs: string[];
  requestedAt: string;
  resolvedAt: string | null;
}

export interface LoanDetails {
  loanPurpose?: string;
  personalInfo?: {
    firstName?: string | null;
    lastName?: string | null;
    dob?: string | null;
    address?: string | null;
    email?: string;
    phone?: string | null;
  };
  educationInfo?: {
    universityName?: string;
    course?: string;
    country?: string;
    intakeYear?: string;
    intakeSemester?: string;
  };
  financialInfo?: {
    monthlyIncome?: string;
    existingEMIs?: string;
    collateral?: string;
  };
  guarantor?: {
    relation?: string;
    name?: string;
    email?: string;
    mobile?: string;
  };
  coApplicant?: {
    relation?: string;
    name?: string;
    email?: string;
    mobile?: string;
  };
  documentGroups?: LoanDocumentGroup[];
  documentRequest?: LoanDocumentRequest;
  rejectionReason?: string;
}

export interface LoanApplication {
  id: string;
  studentId: string;
  amount: string;
  status: LoanStatus;
  details: LoanDetails | null;
  student?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    user: { email: string; phoneNumber: string | null };
  };
  createdAt: string;
  updatedAt: string;
}

export interface LoanApplicationTimeline {
  id: string;
  loanApplicationId: string;
  action: string;
  actionTakenBy: string | null;
  createdAt: string;
}

export type ApplicationStatus =
  | 'CREATED'
  | 'REJECTED'
  | 'DOCUMENT_VERIFIED'
  | 'SENT_TO_UNIVERSITY'
  | 'PENDING_WITH_UNIVERSITY'
  | 'VERIFIED_BY_UNIVERSITY'
  | 'PAYMENT_PENDING'
  | 'COMPLETED';
export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED';

/** Raw Flywire lifecycle status. */
export type FlywireStatus = 'PENDING' | 'INITIATED' | 'GUARANTEED' | 'DELIVERED' | 'CANCELLED';

export interface FlywirePayment {
  id: string;
  flywireId: string;
  reference: string | null;
  payLink: string | null;
  flywireStatus: FlywireStatus;
  amount: number; // currency subunit
  currency: string;
  destinationId: string;
  createdAt: string;
  updatedAt: string;
}

/** Human-readable label for a Flywire lifecycle status. */
export const FLYWIRE_STATUS_LABELS: Record<FlywireStatus, string> = {
  PENDING: 'Awaiting payment',
  INITIATED: 'Payment started',
  GUARANTEED: 'Funds received',
  DELIVERED: 'Funds delivered',
  CANCELLED: 'Cancelled',
};

export interface Application {
  id: string;
  studentId: string;
  universityName: string;
  course: string;
  status: ApplicationStatus;
  rejectionReason: string | null;
  paymentLink: string | null;
  paymentStatus: PaymentStatus;
  flywirePayment?: FlywirePayment | null;
  createdAt: string;
}
export interface ApplicationTimelineEntry {
  id: string;
  applicationId: string;
  action: string;
  actionTakenBy: string | null;
  /** Set on MEETING_SCHEDULED entries — the Google Meet link and scheduled time. */
  meetingLink?: string | null;
  meetingAt?: string | null;
  createdAt: string;
}

export interface AgentSummary {
  id: string;
  name: string;
  email: string;
  status: 'ACTIVE' | 'INACTIVE';
  numberOfStudents: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminStats {
  students: number;
  agents: number;
  applications: number;
  documents: number;
  universities: number;
}

export interface AdminApplication {
  id: string;
  universityName: string;
  course: string;
  status: ApplicationStatus;
  paymentStatus: PaymentStatus;
  paymentLink: string | null;
  rejectionReason: string | null;
  createdAt: string;
  student: {
    id: string;
    name: string;
    email: string;
    phoneNumber: string | null;
    profileCompletion: number;
    isProfileCompleted: boolean;
    isProfileVerified: boolean;
    documentCount: number;
  };
  agent: { id: string; name: string } | null;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/** A lead captured from the public landing-page SOP generator. */
export interface SopLead {
  id: string;
  fullName: string;
  country: string | null;
  university: string;
  campus: string | null;
  course: string;
  createdAt: string;
}

export interface AdminSopLeadsQuery {
  page?: number;
  pageSize?: number;
  search?: string;
}

export interface AdminApplicationsQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: ApplicationStatus | 'All';
}

export interface AgentApplication {
  id: string;
  universityName: string;
  course: string;
  status: ApplicationStatus;
  paymentStatus: PaymentStatus;
  rejectionReason: string | null;
  createdAt: string;
  student: {
    id: string;
    name: string;
    email: string;
    phoneNumber: string | null;
    profileCompletion: number;
    isProfileCompleted: boolean;
    isProfileVerified: boolean;
    documentCount: number;
  };
  documents: StudentDocument[];
}

export interface AdminStudentsQuery {
  page?: number;
  pageSize?: number;
  search?: string;
}

export interface AdminStudentSummary {
  id: string;
  userId: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  phoneNumber: string | null;
  profileCompletion: number;
  isProfileCompleted: boolean;
  isProfileVerified: boolean;
  isDocSubmitted: boolean;
  documentCount: number;
  agent: { id: string; name: string } | null;
  createdAt: string;
}

export interface AdminStudentDetail extends Omit<AdminStudentSummary, 'documentCount'> {
  dob: string | null;
  address: string | null;
  documents: StudentDocument[];
}

export interface AppNotification {
  id: string;
  applicationId: string | null;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface Consent {
  id: string;
  userId: string;
  consentType: string;
  granted: boolean;
  version: string;
  createdAt: string;
}

const q = (params: Record<string, string | undefined>) => {
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) usp.set(k, v);
  const s = usp.toString();
  return s ? `?${s}` : '';
};

/**
 * Coalesces concurrent identical GET requests into a single in-flight call.
 * Without this, React StrictMode's double-mount fires the same request twice
 * back-to-back (visible as two network calls), which also wastes rate-limited
 * upstream quota. The second caller joins the first's pending promise.
 */
const inFlight = new Map<string, Promise<unknown>>();
function dedupe<T>(key: string, run: () => Promise<T>): Promise<T> {
  const existing = inFlight.get(key) as Promise<T> | undefined;
  if (existing) return existing;
  const p = run().finally(() => inFlight.delete(key));
  inFlight.set(key, p);
  return p;
}

// ---------- Endpoint groups ----------

export interface City {
  id: string;
  name: string;
  country: string;
}

export const api = {
  // Public reference data for the course-search location picker.
  cities: {
    list: (country?: string) => rawRequest<City[]>(`/cities${q({ country })}`, { auth: false }),
  },

  auth: {
    register: (body: { email: string; password: string; role?: 'STUDENT' | 'AGENT'; consent: true; name?: string; phoneNumber?: string; gender?: Gender }) =>
      rawRequest<AuthResult>('/auth/register', { method: 'POST', body, auth: false }),
    login: (email: string, password: string) =>
      rawRequest<AuthResult>('/auth/login', { method: 'POST', body: { email, password }, auth: false }),
    logout: () => rawRequest<{ success: boolean }>('/auth/logout', { method: 'POST', auth: false }),
    me: () => rawRequest<AuthUser>('/auth/me'),
    forgotPassword: (email: string) =>
      rawRequest<{ success: boolean }>('/auth/forgot-password', { method: 'POST', body: { email }, auth: false }),
    resetPassword: (token: string, password: string) =>
      rawRequest<{ success: boolean }>('/auth/reset-password', { method: 'POST', body: { token, password }, auth: false }),
  },

  students: {
    me: () => rawRequest<StudentProfile>('/students/me'),
    updateMe: (body: Partial<{ firstName: string; lastName: string; dob: string; address: string; phoneNumber: string }>) =>
      rawRequest<StudentProfile>('/students/me', { method: 'PUT', body }),
    documents: () => rawRequest<StudentDocument[]>('/students/me/documents'),
    documentViewUrl: async (id: string) => {
      const r = await rawRequest<{ url: string }>(`/students/me/documents/${id}/url`);
      return { url: resolveSignedUrl(r.url) };
    },
    uploadDocument: (docType: DocType, file: File, subType?: AcademicSubType) => {
      const form = new FormData();
      form.append('docType', docType);
      if (subType) form.append('subType', subType);
      form.append('file', file);
      return rawRequest<StudentDocument>('/students/me/documents', { method: 'POST', form });
    },
  },

  documents: {
    remove: (id: string) => rawRequest<StudentDocument>(`/documents/${id}`, { method: 'DELETE' }),
    verify: (id: string, status: DocStatus) =>
      rawRequest<StudentDocument>(`/documents/${id}/verify`, { method: 'PATCH', body: { status } }),
    fileUrl: (key: string) => `${BASE_URL}/files/${encodeURIComponent(key)}`,
  },

  agents: {
    list: () => rawRequest<AgentSummary[]>('/agents'),
    create: (body: { name: string; email: string; password: string }) =>
      rawRequest<AgentSummary>('/agents', { method: 'POST', body }),
    remove: (id: string) => rawRequest<{ success: boolean }>(`/agents/${id}`, { method: 'DELETE' }),
    myStudents: () => rawRequest<StudentProfile[]>('/agents/me/students'),
    verifyStudent: (studentId: string) =>
      rawRequest<StudentProfile>(`/agents/students/${studentId}/verify`, { method: 'PATCH' }),
    applications: () => rawRequest<AgentApplication[]>('/agents/me/applications'),
    verifyDocument: (docId: string, status: DocStatus) =>
      rawRequest<StudentDocument>(`/agents/documents/${docId}/verify`, { method: 'PATCH', body: { status } }),
    studentDocumentUrl: async (studentId: string, docId: string) => {
      const r = await rawRequest<{ url: string }>(`/agents/students/${studentId}/documents/${docId}/url`);
      return { url: resolveSignedUrl(r.url) };
    },
  },

  universities: {
    list: () => rawRequest<University[]>('/universities'),
    get: (id: string) => rawRequest<University>(`/universities/${id}`),
    create: (body: Omit<University, 'id'>) => rawRequest<University>('/universities', { method: 'POST', body }),
    update: (id: string, body: Partial<Omit<University, 'id'>>) =>
      rawRequest<University>(`/universities/${id}`, { method: 'PUT', body }),
    remove: (id: string) => rawRequest<{ success: boolean }>(`/universities/${id}`, { method: 'DELETE' }),
  },

  accommodations: {
    list: (filters?: { city?: string; type?: string }) =>
      rawRequest<Accommodation[]>(`/accommodations${q({ city: filters?.city, type: filters?.type })}`, { auth: false }),
    get: (id: string) => rawRequest<Accommodation>(`/accommodations/${id}`, { auth: false }),
    /** Search the Amber Student partner inventory (UK). Requires auth. */
    explore: (params?: { page?: number; q?: string }) => {
      const path = `/accommodations/explore${q({
        page: params?.page != null ? String(params.page) : undefined,
        q: params?.q || undefined,
      })}`;
      return dedupe(path, () => rawRequest<AmberSearchResult>(path));
    },
    create: (body: Omit<Accommodation, 'id'>) => rawRequest<Accommodation>('/accommodations', { method: 'POST', body }),
    update: (id: string, body: Partial<Omit<Accommodation, 'id'>>) =>
      rawRequest<Accommodation>(`/accommodations/${id}`, { method: 'PUT', body }),
    remove: (id: string) => rawRequest<{ success: boolean }>(`/accommodations/${id}`, { method: 'DELETE' }),
    book: (id: string, body: { checkIn: string; checkOut: string; message?: string }) =>
      rawRequest<AccommodationBooking>(`/accommodations/${id}/bookings`, { method: 'POST', body }),
    myBookings: () => rawRequest<AccommodationBooking[]>('/accommodations/my-bookings'),
    listBookings: () => rawRequest<AccommodationBooking[]>('/accommodations/bookings'),
    updateBookingStatus: (bookingId: string, status: BookingStatus) =>
      rawRequest<AccommodationBooking>(`/accommodations/bookings/${bookingId}`, { method: 'PATCH', body: { status } }),
  },

  serviceProviders: {
    list: (category?: ServiceCategory) =>
      rawRequest<ServiceProvider[]>(`/service-providers${q({ category })}`, { auth: false }),
    create: (body: Omit<ServiceProvider, 'id'>) => rawRequest<ServiceProvider>('/service-providers', { method: 'POST', body }),
    update: (id: string, body: Partial<Omit<ServiceProvider, 'id'>>) =>
      rawRequest<ServiceProvider>(`/service-providers/${id}`, { method: 'PUT', body }),
    remove: (id: string) => rawRequest<{ success: boolean }>(`/service-providers/${id}`, { method: 'DELETE' }),
  },

  partners: {
    list: () => rawRequest<Partner[]>('/partners', { auth: false }),
    create: (body: Omit<Partner, 'id'>) => rawRequest<Partner>('/partners', { method: 'POST', body }),
    update: (id: string, body: Partial<Omit<Partner, 'id'>>) =>
      rawRequest<Partner>(`/partners/${id}`, { method: 'PUT', body }),
    remove: (id: string) => rawRequest<{ success: boolean }>(`/partners/${id}`, { method: 'DELETE' }),
  },

  blogs: {
    list: () => rawRequest<Blog[]>('/blogs', { auth: false }),
    getBySlug: (slug: string) => rawRequest<Blog>(`/blogs/slug/${slug}`, { auth: false }),
    create: (body: {
      title: string; slug: string; excerpt: string; content: string; coverImage: string;
      author: string; category: string; readTime: string; isActive?: boolean; videoUrl?: string; publishedBy?: string;
    }) => rawRequest<Blog>('/blogs', { method: 'POST', body }),
    update: (id: string, body: Partial<Omit<Blog, 'id' | 'createdAt'>>) =>
      rawRequest<Blog>(`/blogs/${id}`, { method: 'PUT', body }),
    remove: (id: string) => rawRequest<{ success: boolean }>(`/blogs/${id}`, { method: 'DELETE' }),
  },

  testimonials: {
    list: () => rawRequest<Testimonial[]>('/testimonials', { auth: false }),
    create: (body: {
      studentName: string; universityName?: string; content: string; mediaUrl: string;
      mediaType?: MediaType; avatarUrl?: string; isActive?: boolean;
    }) => rawRequest<Testimonial>('/testimonials', { method: 'POST', body }),
    update: (id: string, body: Partial<Omit<Testimonial, 'id'>>) =>
      rawRequest<Testimonial>(`/testimonials/${id}`, { method: 'PUT', body }),
    remove: (id: string) => rawRequest<{ success: boolean }>(`/testimonials/${id}`, { method: 'DELETE' }),
    /** Upload a testimonial headshot (admin) → returns a permanent public URL. */
    uploadImage: (file: File) => {
      const form = new FormData();
      form.append('file', file);
      return rawRequest<{ url: string }>('/testimonials/upload-image', { form });
    },
  },

  loans: {
    create: (body: { amount: string; details?: LoanDetails }) =>
      rawRequest<LoanApplication>('/loans', { method: 'POST', body }),
    list: () => rawRequest<LoanApplication[]>('/loans'),
    get: (id: string) => rawRequest<LoanApplication>(`/loans/${id}`),
    timeline: (id: string) => rawRequest<LoanApplicationTimeline[]>(`/loans/${id}/timeline`),
    updateStatus: (id: string, status: LoanStatus, documentRequest?: { reason: string; docs: string[] }, reason?: string) =>
      rawRequest<LoanApplication>(`/loans/${id}`, { method: 'PATCH', body: { status, documentRequest, reason } }),
    resume: (id: string) =>
      rawRequest<LoanApplication>(`/loans/${id}/resume`, { method: 'POST' }),
    updateDocumentStatus: (id: string, docKey: string, status: string) =>
      rawRequest<LoanApplication>(`/loans/${id}/documents/${docKey}`, { method: 'PATCH', body: { status } }),
    uploadDocument: (file: File, docKey: string) => {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('docKey', docKey);
      return rawRequest<{ key: string; signedPath: string }>('/loans/documents', { method: 'POST', form: fd });
    },
    documentViewUrl: (key: string) =>
      rawRequest<{ url: string }>('/loans/documents/url', { method: 'POST', body: { key } }),
  },

  applications: {
    create: (body: { universityName: string; course: string }) =>
      rawRequest<Application>('/applications', { method: 'POST', body }),
    list: () => rawRequest<Application[]>('/applications'),
    get: (id: string) => rawRequest<Application>(`/applications/${id}`),
    timeline: (id: string) => rawRequest<ApplicationTimelineEntry[]>(`/applications/${id}/timeline`),
    setStatus: (id: string, status: ApplicationStatus, rejectionReason?: string, rollback?: boolean) =>
      rawRequest<Application>(`/applications/${id}/status`, { method: 'PATCH', body: { status, rejectionReason, rollback } }),
    /** Schedule a Google Meet (admin/agent) → emails the student + records on the timeline. */
    scheduleMeeting: (id: string, body: { scheduledAt: string; meetLink: string; note?: string }) =>
      rawRequest<Application>(`/applications/${id}/meeting`, { method: 'POST', body }),
    setPayment: (id: string, paymentStatus: PaymentStatus, paymentLink?: string) =>
      rawRequest<Application>(`/applications/${id}/payment`, { method: 'PATCH', body: { paymentStatus, paymentLink } }),
    /** Admin/agent: initialize a real Flywire payment (amount in major units, e.g. EUR). */
    initializeFlywire: (id: string, amount: number) =>
      rawRequest<Application>(`/applications/${id}/flywire/initialize`, { method: 'POST', body: { amount } }),
    /** Pull the latest status from Flywire (no callbacks configured). */
    refreshFlywire: (id: string) =>
      rawRequest<Application>(`/applications/${id}/flywire/refresh`, { method: 'POST' }),
  },

  admin: {
    stats: () => rawRequest<AdminStats>('/admin/stats'),
    applications: (params: AdminApplicationsQuery = {}) =>
      rawRequest<Paginated<AdminApplication>>(
        `/admin/applications${q({
          page: params.page != null ? String(params.page) : undefined,
          pageSize: params.pageSize != null ? String(params.pageSize) : undefined,
          search: params.search || undefined,
          status: params.status && params.status !== 'All' ? params.status : undefined,
        })}`,
      ),
    assignAgent: (applicationId: string, agentId: string | null) =>
      rawRequest<{ success: boolean }>(`/admin/applications/${applicationId}/assign-agent`, {
        method: 'PATCH',
        body: { agentId },
      }),
    students: (params: AdminStudentsQuery = {}) =>
      rawRequest<Paginated<AdminStudentSummary>>(
        `/admin/students${q({
          page: params.page != null ? String(params.page) : undefined,
          pageSize: params.pageSize != null ? String(params.pageSize) : undefined,
          search: params.search || undefined,
        })}`,
      ),
    studentDetail: (id: string) => rawRequest<AdminStudentDetail>(`/admin/students/${id}`),
    studentDocumentUrl: async (studentId: string, docId: string) => {
      const r = await rawRequest<{ url: string }>(`/admin/students/${studentId}/documents/${docId}/url`);
      return { url: resolveSignedUrl(r.url) };
    },
  },

  sop: {
    /**
     * Generates a Statement of Purpose (markdown) for a student application via
     * the external SOP service. Returns the raw markdown string.
     */
    generate: async (studentData: {
      fullName: string;
      country?: string;
      university: string;
      campus?: string;
      course: string;
    }): Promise<string> => {
      const res = await fetch('https://universitysearch-jvqc.onrender.com/generate-sop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentData }),
      });
      let json: any = null;
      try {
        json = await res.json();
      } catch {
        json = null;
      }
      if (!res.ok || !json?.success || typeof json?.sop !== 'string') {
        throw new Error(json?.message || 'Could not generate the SOP. Please try again.');
      }
      return json.sop as string;
    },
  },

  sopLeads: {
    /**
     * Record a landing-page SOP generation as a lead. Public (no auth) — the
     * generator itself needs no account, so leads are captured anonymously.
     */
    capture: (input: {
      fullName: string;
      country?: string;
      university: string;
      campus?: string;
      course: string;
    }) => rawRequest<SopLead>('/sop-leads', { method: 'POST', body: input, auth: false }),
    /** Admin: paginated list of captured SOP leads (newest first). */
    list: (params: AdminSopLeadsQuery = {}) =>
      rawRequest<Paginated<SopLead>>(
        `/sop-leads${q({
          page: params.page != null ? String(params.page) : undefined,
          pageSize: params.pageSize != null ? String(params.pageSize) : undefined,
          search: params.search || undefined,
        })}`,
      ),
  },

  notifications: {
    list: () => rawRequest<AppNotification[]>('/notifications'),
    markAllRead: () => rawRequest<{ success: boolean }>('/notifications/read-all', { method: 'PATCH' }),
  },

  audit: {
    list: () => rawRequest<any[]>('/audit'),
  },

  consent: {
    record: (consentType: string, granted = true) =>
      rawRequest<Consent>('/consent', { method: 'POST', body: { consentType, granted } }),
    mine: () => rawRequest<Consent[]>('/consent/me'),
  },

  health: () => rawRequest<{ status: string }>('/health', { auth: false }),
};
