
export type ApplicationStatus = 'Profile' | 'Documents' | 'Verification' | 'Application' | 'Payment' | 'Completed';

export interface Student {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  progress: number;
  status: ApplicationStatus;
  university?: string;
  course?: string;
}

export interface University {
  id: string;
  name: string;
  location: string;
  logo: string;
  rating: number;
  tuitionFee: string;
  courses: string[];
  description: string;
}

export interface ServiceProvider {
  id: string;
  name: string;
  category: 'Accommodation' | 'Ticket Booking' | 'Loans' | 'Logistics' | 'Online Payment';
  rating: number;
  price: string;
  location?: string;
  image: string;
  description: string;
}

export interface Document {
  id: string;
  name: string;
  status: 'Uploaded' | 'Verified' | 'Rejected' | 'Pending';
  uploadDate: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'info' | 'success' | 'warning';
}
