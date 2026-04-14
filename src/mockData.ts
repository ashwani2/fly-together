
import { Student, University, ServiceProvider, Document, Notification } from './types';

export const mockStudent: Student = {
  id: '1',
  name: 'Alex Johnson',
  email: 'alex.j@example.com',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
  progress: 65,
  status: 'Verification',
  university: 'University of Oxford',
  course: 'MSc in Computer Science',
};

export const mockUniversities: University[] = [
  {
    id: 'u1',
    name: 'University of Oxford',
    location: 'Oxford, UK',
    logo: 'https://logo.clearbit.com/ox.ac.uk',
    rating: 4.9,
    tuitionFee: '£28,000 - £45,000',
    courses: ['Computer Science', 'Philosophy', 'Medicine'],
    description: 'The oldest university in the English-speaking world.',
  },
  {
    id: 'u2',
    name: 'Imperial College London',
    location: 'London, UK',
    logo: 'https://logo.clearbit.com/imperial.ac.uk',
    rating: 4.8,
    tuitionFee: '£32,000 - £50,000',
    courses: ['Engineering', 'Business', 'Natural Sciences'],
    description: 'A world-class university focusing on science, engineering, medicine and business.',
  },
  {
    id: 'u3',
    name: 'University of Manchester',
    location: 'Manchester, UK',
    logo: 'https://logo.clearbit.com/manchester.ac.uk',
    rating: 4.6,
    tuitionFee: '£22,000 - £35,000',
    courses: ['Physics', 'Economics', 'Arts'],
    description: 'A prestigious Red Brick university with a rich heritage.',
  },
];

export const mockServices: ServiceProvider[] = [
  {
    id: 's1',
    name: 'Student.com',
    category: 'Accommodation',
    rating: 4.7,
    price: 'From £150/week',
    location: 'London, Manchester, Birmingham',
    image: 'https://picsum.photos/seed/accommodation/400/300',
    description: 'The world\'s leading marketplace for student housing.',
  },
  {
    id: 's2',
    name: 'Flywire',
    category: 'Loans',
    rating: 4.9,
    price: 'Low interest rates',
    image: 'https://picsum.photos/seed/finance/400/300',
    description: 'Global payment and receivables solution for education.',
  },
  {
    id: 's3',
    name: 'Skyscanner',
    category: 'Ticket Booking',
    rating: 4.8,
    price: 'Best price guarantee',
    image: 'https://picsum.photos/seed/travel/400/300',
    description: 'Compare cheap flights from all major airlines.',
  },
];

export const mockDocuments: Document[] = [
  { id: 'd1', name: 'Passport Copy', status: 'Verified', uploadDate: '2024-03-10' },
  { id: 'd2', name: 'IELTS Certificate', status: 'Verified', uploadDate: '2024-03-12' },
  { id: 'd3', name: 'Academic Transcripts', status: 'Uploaded', uploadDate: '2024-03-15' },
  { id: 'd4', name: 'Statement of Purpose', status: 'Pending', uploadDate: '2024-03-18' },
];

export const mockNotifications: Notification[] = [
  {
    id: 'n1',
    title: 'Document Verified',
    message: 'Your IELTS certificate has been successfully verified.',
    time: '2 hours ago',
    type: 'success',
  },
  {
    id: 'n2',
    title: 'New Message',
    message: 'Your consultant sent you a message regarding your application.',
    time: '5 hours ago',
    type: 'info',
  },
  {
    id: 'n3',
    title: 'Payment Reminder',
    message: 'University application fee is due in 3 days.',
    time: '1 day ago',
    type: 'warning',
  },
];
