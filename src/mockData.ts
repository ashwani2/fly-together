
import { Student, University, ServiceProvider, Document, Notification, Testimonial, BlogPost } from './types';

export const mockBlogPosts: BlogPost[] = [
  {
    id: 'b1',
    title: 'Top 5 UK Universities for 2024 International Students',
    slug: 'top-5-uk-universities-2024',
    excerpt: 'Explore the best picks for academic excellence, student life, and career prospects in the United Kingdom this year.',
    content: 'Choosing the right university is a pivotal decision... (full content here)',
    coverImage: 'https://images.pexels.com/photos/32752097/pexels-photo-32752097.jpeg',
    author: 'UniFlow Editorial',
    date: '2024-03-25',
    category: 'Education',
    readTime: '6 min read'
  },
  {
    id: 'b2',
    title: 'How to Secure an Education Loan without Collateral',
    slug: 'education-loan-no-collateral',
    excerpt: 'Detailed guide on financing your overseas education through student loans with favorable terms.',
    content: 'Financial barriers shouldn\'t stop your dreams... (full content here)',
    coverImage: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&q=80&w=1200',
    author: 'Finance Team',
    date: '2024-03-10',
    category: 'Finance',
    readTime: '8 min read'
  }
];

export const mockTestimonials: Testimonial[] = [
  {
    id: 't1',
    studentName: 'Aarav Sharma',
    universityName: 'University of Oxford',
    content: 'The journey from application to arrival was seamless. UniFlow handled all my documents and even helped me find a great studio apartment near campus.',
    mediaUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=800',
    mediaType: 'image',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aarav',
    date: '2024-02-15'
  },
  {
    id: 't2',
    studentName: 'Priya Patel',
    universityName: 'Imperial College London',
    content: 'Getting my visa and student loan was my biggest worry, but the team here made it look easy. Highly recommend their education loan assistance!',
    mediaUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=800',
    mediaType: 'image',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Priya',
    date: '2024-01-20'
  },
  {
    id: 't3',
    studentName: 'Michael Chen',
    universityName: 'University of Manchester',
    content: 'The logistics service was a lifesaver. My 30kg of books and clothes reached my room even before I landed. Brilliant support!',
    mediaUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=800',
    mediaType: 'image',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Michael',
    date: '2024-03-05'
  }
];

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
    name: 'Royal Rahi Logistics',
    category: 'Logistics',
    rating: 4.9,
    price: 'Price per KG',
    image: 'https://picsum.photos/seed/truck/400/300',
    description: 'Safe and secure shipping for your baggage and documents worldwide.',
  },
  {
    id: 's2',
    name: 'UniSafe Payments',
    category: 'Online Payment',
    rating: 4.9,
    price: 'Zero Fee',
    image: 'https://picsum.photos/seed/finance/400/300',
    description: 'Secure tuition fee payments and currency exchange services for students.',
  },
  {
    id: 's3',
    name: 'SkyHigh Travels',
    category: 'Ticket Booking',
    rating: 4.8,
    price: 'Student Deals',
    image: 'https://picsum.photos/seed/travel/400/300',
    description: 'Special student fares for international and domestic flights.',
  },
  {
    id: 's4',
    name: 'Student Comforts',
    category: 'Accommodation',
    rating: 4.7,
    price: 'From £120/week',
    image: 'https://picsum.photos/seed/house/400/300',
    description: 'Premium student housing near major universities.',
  }
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
