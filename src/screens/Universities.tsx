
import React, { useState } from 'react';
import { Search, Filter, Star, MapPin, GraduationCap, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { mockUniversities } from '@/mockData';

export default function Universities() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredUnis = mockUniversities.filter(uni => 
    uni.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    uni.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Explore Universities</h1>
          <p className="text-muted-foreground">Find the perfect university and course for your future.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search by name or city..." 
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" size="icon">
            <Filter className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUnis.map((uni) => (
          <Card key={uni.id} className="group hover:shadow-lg transition-all duration-300 border-muted/60">
            <CardHeader className="relative pb-0">
              <div className="flex justify-between items-start">
                <div className="w-16 h-16 rounded-xl border bg-white dark:bg-white/90 p-2 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                  <img src={uni.logo} alt={uni.name} className="w-full h-full object-contain" />
                </div>
                <Badge variant="secondary" className="bg-amber-500/10 text-amber-500 border-amber-500/20">
                  <Star className="w-3 h-3 mr-1 fill-amber-500" />
                  {uni.rating}
                </Badge>
              </div>
              <div className="mt-4 space-y-1">
                <CardTitle className="text-xl group-hover:text-primary transition-colors">{uni.name}</CardTitle>
                <div className="flex items-center text-sm text-muted-foreground">
                  <MapPin className="w-3 h-3 mr-1" />
                  {uni.location}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <p className="text-sm text-muted-foreground line-clamp-2">{uni.description}</p>
              
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Popular Courses</p>
                <div className="flex flex-wrap gap-2">
                  {uni.courses.map(course => (
                    <Badge key={course} variant="outline" className="text-[10px]">{course}</Badge>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between border-t">
                <div className="space-y-0.5">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Tuition Fee</p>
                  <p className="text-sm font-semibold">{uni.tuitionFee}</p>
                </div>
                <div className="text-right space-y-0.5">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Intake</p>
                  <p className="text-sm font-semibold">Sept / Jan</p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="pt-0">
              <Button className="w-full group/btn">
                View Details
                <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
