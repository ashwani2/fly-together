/**
 * Typed client for the Fly Together backend (Express + Prisma).
 * One place that knows every endpoint. Handles JWT storage, the standard
 * `{ data }` / `{ error }` envelopes, and a single refresh-on-401 retry.
 */

const BASE_URL: string =
  (import.meta.env.VITE_API_URL as string | undefined) || 'http://localhost:4000/api';

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

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
  phoneNumber: string | null;
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
export type DocStatus = 'UPLOADED' | 'PENDING' | 'VERIFIED' | 'REJECTED';
export interface StudentDocument {
  id: string;
  studentId: string;
  docUrl: string;
  docType: DocType;
  status: DocStatus;
  removed: boolean;
  createdAt: string;
  updatedAt: string;
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
}

export interface LoanApplication {
  id: string;
  studentId: string;
  amount: string;
  status: string;
  details: Record<string, unknown> | null;
  createdAt: string;
}

export type ApplicationStatus =
  | 'PROFILE'
  | 'DOCUMENTS'
  | 'VERIFICATION'
  | 'APPLICATION'
  | 'PAYMENT'
  | 'COMPLETED';
export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED';
export interface Application {
  id: string;
  studentId: string;
  universityName: string;
  course: string;
  status: ApplicationStatus;
  rejectionReason: string | null;
  paymentLink: string | null;
  paymentStatus: PaymentStatus;
  createdAt: string;
}
export interface ApplicationTimelineEntry {
  id: string;
  applicationId: string;
  action: string;
  actionTakenBy: string | null;
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

// ---------- Endpoint groups ----------

export const api = {
  auth: {
    register: (body: { email: string; password: string; role?: 'STUDENT' | 'AGENT'; consent: true; name?: string; phoneNumber?: string }) =>
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
    documentViewUrl: (id: string) => rawRequest<{ url: string }>(`/students/me/documents/${id}/url`),
    uploadDocument: (docType: DocType, file: File) => {
      const form = new FormData();
      form.append('docType', docType);
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
    create: (body: Omit<Accommodation, 'id'>) => rawRequest<Accommodation>('/accommodations', { method: 'POST', body }),
    update: (id: string, body: Partial<Omit<Accommodation, 'id'>>) =>
      rawRequest<Accommodation>(`/accommodations/${id}`, { method: 'PUT', body }),
    remove: (id: string) => rawRequest<{ success: boolean }>(`/accommodations/${id}`, { method: 'DELETE' }),
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
  },

  loans: {
    create: (body: { amount: string; details?: Record<string, unknown> }) =>
      rawRequest<LoanApplication>('/loans', { method: 'POST', body }),
    list: () => rawRequest<LoanApplication[]>('/loans'),
    updateStatus: (id: string, status: string) =>
      rawRequest<LoanApplication>(`/loans/${id}`, { method: 'PATCH', body: { status } }),
  },

  applications: {
    create: (body: { universityName: string; course: string }) =>
      rawRequest<Application>('/applications', { method: 'POST', body }),
    list: () => rawRequest<Application[]>('/applications'),
    get: (id: string) => rawRequest<Application>(`/applications/${id}`),
    timeline: (id: string) => rawRequest<ApplicationTimelineEntry[]>(`/applications/${id}/timeline`),
    setStatus: (id: string, status: ApplicationStatus, rejectionReason?: string) =>
      rawRequest<Application>(`/applications/${id}/status`, { method: 'PATCH', body: { status, rejectionReason } }),
    setPayment: (id: string, paymentStatus: PaymentStatus, paymentLink?: string) =>
      rawRequest<Application>(`/applications/${id}/payment`, { method: 'PATCH', body: { paymentStatus, paymentLink } }),
  },

  admin: {
    stats: () => rawRequest<AdminStats>('/admin/stats'),
    applications: () => rawRequest<AdminApplication[]>('/admin/applications'),
    assignAgent: (applicationId: string, agentId: string | null) =>
      rawRequest<{ success: boolean }>(`/admin/applications/${applicationId}/assign-agent`, {
        method: 'PATCH',
        body: { agentId },
      }),
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
