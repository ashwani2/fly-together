
import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Upload, FileText, CheckCircle2, AlertCircle, Clock, Trash2, Circle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { mockDocuments } from '@/mockData';
import { cn } from '@/lib/utils';

export default function Profile() {
  const [activeTab, setActiveTab] = useState<'personal' | 'documents'>('personal');

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Profile & Documents</h1>
        <p className="text-muted-foreground">Manage your personal information and upload required documents.</p>
      </div>

      <div className="flex gap-4 border-b pb-px">
        <button 
          onClick={() => setActiveTab('personal')}
          className={cn(
            "pb-4 px-2 text-sm font-medium transition-colors relative",
            activeTab === 'personal' ? "text-primary" : "text-muted-foreground hover:text-foreground"
          )}
        >
          Personal Information
          {activeTab === 'personal' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
        </button>
        <button 
          onClick={() => setActiveTab('documents')}
          className={cn(
            "pb-4 px-2 text-sm font-medium transition-colors relative",
            activeTab === 'documents' ? "text-primary" : "text-muted-foreground hover:text-foreground"
          )}
        >
          Documents
          {activeTab === 'documents' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
        </button>
      </div>

      {activeTab === 'personal' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Personal Details</CardTitle>
              <CardDescription>Update your basic information for university applications.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" defaultValue="Alex" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" defaultValue="Johnson" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" defaultValue="alex.j@example.com" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" defaultValue="+44 7700 900000" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dob">Date of Birth</Label>
                  <Input id="dob" type="date" defaultValue="2002-05-15" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Current Address</Label>
                <Input id="address" defaultValue="123 Student Lane, London, UK" />
              </div>
              <Button className="w-full md:w-auto">Save Changes</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Profile Completion</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col items-center gap-4">
                <div className="relative w-32 h-32">
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    <circle className="text-muted stroke-current" strokeWidth="8" fill="transparent" r="40" cx="50" cy="50" />
                    <circle className="text-primary stroke-current" strokeWidth="8" strokeDasharray="251.2" strokeDashoffset={251.2 * (1 - 0.85)} strokeLinecap="round" fill="transparent" r="40" cx="50" cy="50" transform="rotate(-90 50 50)" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold">85%</span>
                  </div>
                </div>
                <p className="text-sm text-center text-muted-foreground">Almost there! Complete your education details to reach 100%.</p>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Personal Info</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Contact Details</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Circle className="w-4 h-4" />
                  <span>Education History</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Drag & Drop Area */}
          <div className="border-2 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center gap-4 bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer group">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
              <Upload className="w-8 h-8" />
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold">Click or drag files to upload</p>
              <p className="text-sm text-muted-foreground">Support for PDF, JPG, PNG (Max 10MB)</p>
            </div>
            <Button variant="outline">Select Files</Button>
          </div>

          {/* Document List */}
          <Card>
            <CardHeader>
              <CardTitle>Uploaded Documents</CardTitle>
              <CardDescription>Track the verification status of your documents.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockDocuments.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-4 rounded-xl border bg-card hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/5 flex items-center justify-center text-primary">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium">{doc.name}</p>
                        <p className="text-xs text-muted-foreground">Uploaded on {doc.uploadDate}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <Badge 
                        variant="secondary"
                        className={cn(
                          "px-3 py-1",
                          doc.status === 'Verified' ? "bg-green-100 text-green-700" :
                          doc.status === 'Rejected' ? "bg-red-100 text-red-700" :
                          doc.status === 'Uploaded' ? "bg-blue-100 text-blue-700" :
                          "bg-amber-100 text-amber-700"
                        )}
                      >
                        {doc.status === 'Verified' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                        {doc.status === 'Rejected' && <AlertCircle className="w-3 h-3 mr-1" />}
                        {doc.status === 'Pending' && <Clock className="w-3 h-3 mr-1" />}
                        {doc.status}
                      </Badge>
                      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
