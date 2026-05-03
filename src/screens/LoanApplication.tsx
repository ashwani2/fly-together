import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, 
  User, 
  Users, 
  ShieldCheck, 
  ArrowLeft, 
  Upload, 
  CheckCircle2,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';

const steps = [
  { id: 'applicant', title: 'Applicant Details', icon: User },
  { id: 'guarantor', title: 'Guarantor Details', icon: ShieldCheck },
  { id: 'coapplicant', title: 'Co-applicant Details', icon: Users },
  { id: 'review', title: 'Review & Submit', icon: FileText }
];

export default function LoanApplication() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    // Applicant
    applicant: {
      academics10: null,
      academics12: null,
      academicsUG: null,
      aadhar: '',
      pan: '',
      email: '',
      mobile: '',
      offerLetter: null,
    },
    // Guarantor
    guarantor: {
      relation: '',
      aadhar: '',
      pan: '',
      photo: null,
      bankStatement: null,
      itr: null,
      incomeProof: null, // Salary Slip / Pension / Business Docs
      email: '',
      mobile: '',
    },
    // Co-applicant
    coApplicant: {
      relation: '',
      aadhar: '',
      pan: '',
      photo: null,
      email: '',
      mobile: '',
    }
  });

  const handleInputChange = (section: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof typeof prev],
        [field]: value
      }
    }));
  };

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 0));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Save to localStorage so admin can see it
    const newApplication = {
      id: `LOAN-${Date.now()}`,
      applicantName: user?.displayName || 'Test Student',
      email: formData.applicant.email,
      date: new Date().toISOString().split('T')[0],
      status: 'Pending',
      type: 'Education Loan'
    };
    
    const existingApplications = JSON.parse(localStorage.getItem('loan_applications') || '[]');
    localStorage.setItem('loan_applications', JSON.stringify([...existingApplications, newApplication]));

    // Simulate submission
    setTimeout(() => {
      setIsSubmitted(true);
    }, 1500);
  };

  if (isSubmitted) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-6 max-w-md"
        >
          <div className="w-20 h-20 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Application Submitted!</h1>
            <p className="text-muted-foreground text-lg">
              Your loan application has been received. Our financial advisors will review your documents and contact you within 24-48 business hours.
            </p>
          </div>
          <Button onClick={() => navigate('/dashboard/services')} className="w-full h-12">
            Back to Services
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/services')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Education Loan Application</h1>
          <p className="text-muted-foreground">Complete all sections to initiate your funding process.</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative flex justify-between before:absolute before:top-5 before:left-0 before:w-full before:h-0.5 before:bg-muted before:-z-10 h-20">
        {steps.map((step, index) => (
          <div key={step.id} className="flex flex-col items-center gap-2">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors duration-300 ${
              index <= currentStep ? 'bg-primary border-primary text-primary-foreground' : 'bg-background border-muted text-muted-foreground'
            }`}>
              <step.icon className="w-5 h-5" />
            </div>
            <span className={`text-xs font-medium hidden md:block ${index <= currentStep ? 'text-primary' : 'text-muted-foreground'}`}>
              {step.title}
            </span>
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{steps[currentStep].title}</CardTitle>
              <CardDescription>All fields with * are mandatory.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {currentStep === 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Email ID *</Label>
                    <Input 
                      placeholder="email@example.com" 
                      value={formData.applicant.email} 
                      onChange={(e) => handleInputChange('applicant', 'email', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Mobile Number *</Label>
                    <Input 
                      placeholder="+91" 
                      value={formData.applicant.mobile} 
                      onChange={(e) => handleInputChange('applicant', 'mobile', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Aadhar Card Number *</Label>
                    <Input 
                      placeholder="12-digit number" 
                      value={formData.applicant.aadhar} 
                      onChange={(e) => handleInputChange('applicant', 'aadhar', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>PAN Card Number *</Label>
                    <Input 
                      placeholder="ABCDE1234F" 
                      value={formData.applicant.pan} 
                      onChange={(e) => handleInputChange('applicant', 'pan', e.target.value)}
                    />
                  </div>
                  <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>10th Certificate *</Label>
                      <div className="border-2 border-dashed rounded-lg p-4 text-center hover:border-primary transition-colors cursor-pointer bg-muted/30">
                        <Upload className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Click to upload</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>12th Certificate *</Label>
                      <div className="border-2 border-dashed rounded-lg p-4 text-center hover:border-primary transition-colors cursor-pointer bg-muted/30">
                        <Upload className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Click to upload</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>UG Certificate (if any)</Label>
                      <div className="border-2 border-dashed rounded-lg p-4 text-center hover:border-primary transition-colors cursor-pointer bg-muted/30">
                        <Upload className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Click to upload</span>
                      </div>
                    </div>
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <Label>University Offer Letter *</Label>
                    <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer bg-muted/30">
                      <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm font-medium">Drag & Drop or Click to Upload</p>
                      <p className="text-xs text-muted-foreground mt-1">PDF, JPG up to 5MB</p>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 1 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Guarantor Relation *</Label>
                    <Select onValueChange={(v) => handleInputChange('guarantor', 'relation', v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Relation" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="father">Father</SelectItem>
                        <SelectItem value="mother">Mother</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Mobile Number *</Label>
                    <Input 
                      placeholder="+91" 
                      value={formData.guarantor.mobile} 
                      onChange={(e) => handleInputChange('guarantor', 'mobile', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Aadhar Card *</Label>
                    <Input placeholder="Enter Number" />
                    <div className="border-2 border-dashed rounded-lg p-3 mt-1 flex items-center justify-center gap-2 text-xs text-muted-foreground cursor-pointer">
                      <Upload className="w-3 h-3" /> Upload Copy
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>PAN Card *</Label>
                    <Input placeholder="Enter Number" />
                    <div className="border-2 border-dashed rounded-lg p-3 mt-1 flex items-center justify-center gap-2 text-xs text-muted-foreground cursor-pointer">
                      <Upload className="w-3 h-3" /> Upload Copy
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>ITR (Last 3 Years) / Form 16 *</Label>
                    <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer bg-muted/30">
                      <Upload className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                      <span className="text-xs">Upload Documents</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Bank Statement (Last 6 Months) *</Label>
                    <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer bg-muted/30">
                      <Upload className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                      <span className="text-xs">Upload PDF</span>
                    </div>
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <Label>Income Proof * (Salary Slip / Pension Slip / Business GST-Udyam)</Label>
                    <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer bg-muted/30">
                      <Upload className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                      <span className="text-xs">Select Files</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Photo *</Label>
                    <div className="w-32 h-32 border-2 border-dashed rounded-xl flex items-center justify-center hover:border-primary transition-colors cursor-pointer bg-muted/30">
                      <User className="w-8 h-8 text-muted-foreground" />
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Co-applicant Relation *</Label>
                    <Select onValueChange={(v) => handleInputChange('coApplicant', 'relation', v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Relation" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="father">Father</SelectItem>
                        <SelectItem value="mother">Mother</SelectItem>
                        <SelectItem value="brother">Brother</SelectItem>
                        <SelectItem value="sister">Sister</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-[10px] text-muted-foreground">Only blood relations are eligible.</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Email ID *</Label>
                    <Input placeholder="email@example.com" />
                  </div>
                  <div className="space-y-2">
                    <Label>Aadhar Card *</Label>
                    <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary cursor-pointer bg-muted/30">
                      <Upload className="w-6 h-6 mx-auto mb-2" />
                      <span className="text-xs">Upload Copy</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>PAN Card *</Label>
                    <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary cursor-pointer bg-muted/30">
                      <Upload className="w-6 h-6 mx-auto mb-2" />
                      <span className="text-xs">Upload Copy</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Passport Photo *</Label>
                    <div className="w-32 h-32 border-2 border-dashed rounded-xl flex items-center justify-center hover:border-primary transition-colors cursor-pointer bg-muted/30">
                      <User className="w-8 h-8 text-muted-foreground" />
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                    <h4 className="font-bold mb-2">Review Summary</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Please ensure all uploaded documents are clear and legible. Misrepresentation of facts or blurred documents may lead to application rejection.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 border rounded-lg">
                      <p className="text-xs text-muted-foreground">Applicant Email</p>
                      <p className="font-medium text-sm">{formData.applicant.email || 'Not provided'}</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <p className="text-xs text-muted-foreground">Guarantor Relation</p>
                      <p className="font-medium text-sm capitalize">{formData.guarantor.relation || 'Not selected'}</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <p className="text-xs text-muted-foreground">Co-applicant Relation</p>
                      <p className="font-medium text-sm capitalize">{formData.coApplicant.relation || 'Not selected'}</p>
                    </div>
                  </div>
                </div>
              )}

            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

      <div className="flex justify-between items-center bg-background p-4 border rounded-xl shadow-sm">
        <Button 
          variant="outline" 
          onClick={prevStep}
          disabled={currentStep === 0}
        >
          <ChevronLeft className="w-4 h-4 mr-2" /> Previous
        </Button>
        {currentStep === steps.length - 1 ? (
          <Button onClick={handleSubmit} className="px-8 bg-green-600 hover:bg-green-700">
            Submit Application
          </Button>
        ) : (
          <Button onClick={nextStep}>
            Next Step <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}
