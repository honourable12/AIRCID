

"use client";

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertCircle, RefreshCw, FileText, PlusCircle, ArrowRight, BookOpen, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const CORE_BACKEND_URL = process.env.NEXT_PUBLIC_CORE_BACKEND_URL || "http://127.0.0.1:8000";

interface Study {
  id: number;
  title: string;
  description: string;
  creator_id: number;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string | null;
  creator_email: string;
}

const formSchema = z.object({
  title: z.string().min(2, {
    message: "Title must be at least 2 characters.",
  }).max(255, {
    message: "Title cannot be more than 255 characters.",
  }),
  description: z.string().optional(),
});

export default function StudiesPage() {
  const { toast } = useToast();
  const { user, token } = useAuth();
  const [studies, setStudies] = useState<Study[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
    },
  });

  const fetchStudies = useCallback(async () => {
    if (!token) return;

    setIsLoading(true);
    setIsError(false);
    try {
      const response = await fetch(`${CORE_BACKEND_URL}/api/v1/studies/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch studies');
      }

      const data: Study[] = await response.json();
      setStudies(data);
    } catch (error) {
      console.error('Error fetching studies:', error);
      setIsError(true);
      toast({
        title: "Error",
        description: "Failed to load studies. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [token, toast]);

  useEffect(() => {
    if (token) {
      fetchStudies();
    }
  }, [token, fetchStudies]);

  const handleCreateStudy = async (values: z.infer<typeof formSchema>) => {
    if (!token) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to create a study.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(`${CORE_BACKEND_URL}/api/v1/studies/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create study.');
      }

      const newStudy: Study = await response.json();
      setStudies(prevStudies => [...prevStudies, newStudy]);
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: `Study "${newStudy.title}" has been created.`,
      });
    } catch (error) {
      console.error('Error creating study:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  const handleExport = async (format: 'csv' | 'parquet') => {
    if (!token) {
      toast({ title: "Authentication Error", description: "You are not logged in.", variant: "destructive" });
      return;
    }
    setIsExporting(true);
    try {
      const response = await fetch(`${CORE_BACKEND_URL}/api/v1/export/studies/${format}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: `Failed to export ${format.toUpperCase()}` }));
        throw new Error(errorData.detail);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `studies.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast({ title: "Export successful", description: `Studies data has been downloaded as ${format.toUpperCase()}.` });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      toast({ title: 'Export Failed', description: errorMessage, variant: 'destructive' });
    } finally {
      setIsExporting(false);
    }
  };

  const getStatusBadgeVariant = (status: Study['status']) => {
    switch (status) {
      case 'active':
        return "default";
      case 'completed':
        return "default"; 
      case 'cancelled':
        return "destructive";
      case 'pending':
      default:
        return "secondary";
    }
  };

  const canExport = user?.role?.name === 'administrator' || user?.role?.name === 'researcher';

  const renderContent = () => {
    if (!user) {
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <AlertCircle className="h-12 w-12 text-gray-500 mb-4" />
          <p className="text-xl text-gray-500">Please log in to view and create studies.</p>
        </div>
      );
    }

    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center p-8">
          <Loader2 className="h-12 w-12 animate-spin text-gray-500" />
          <p className="mt-4 text-gray-500">Loading studies...</p>
        </div>
      );
    }

    if (isError) {
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <p className="text-xl text-red-500">Error loading studies.</p>
          <Button onClick={() => fetchStudies()} className="mt-4" variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </div>
      );
    }

    if (studies.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <BookOpen className="h-12 w-12 text-gray-500 mb-4" />
          <p className="text-xl text-gray-500">No studies found.</p>
          <p className="text-gray-400">Click "Create Study" to get started.</p>
        </div>
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead className="hidden md:table-cell">Description</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Creator</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {studies.map((study) => (
            <TableRow key={study.id}>
              <TableCell className="font-medium">{study.title}</TableCell>
              <TableCell className="text-gray-500 hidden md:table-cell max-w-xs overflow-hidden text-ellipsis whitespace-nowrap">
                {study.description}
              </TableCell>
              <TableCell>
                <Badge variant={getStatusBadgeVariant(study.status)}>
                  {study.status.charAt(0).toUpperCase() + study.status.slice(1)}
                </Badge>
              </TableCell>
              <TableCell className="text-gray-500">{study.creator_email}</TableCell>
              <TableCell>
                <Link href={`/dashboard/studies/${study.id}`} passHref>
                  <Button variant="ghost" size="sm">
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Studies</CardTitle>
            <CardDescription>
              Manage and view all research studies.
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {canExport && (
              <>
                <Button variant="outline" onClick={() => handleExport('csv')} disabled={isExporting}>
                  <Download className="mr-2 h-4 w-4" />
                  {isExporting ? 'Exporting...' : 'Export CSV'}
                </Button>
                <Button variant="outline" onClick={() => handleExport('parquet')} disabled={isExporting}>
                  <Download className="mr-2 h-4 w-4" />
                  {isExporting ? 'Exporting...' : 'Export Parquet'}
                </Button>
              </>
            )}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="font-semibold rounded-md shadow-sm">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create Study
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Create a new Study</DialogTitle>
                  <DialogDescription>
                    Fill in the details for your new research study.
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleCreateStudy)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title</FormLabel>
                          <FormControl>
                            <Input placeholder="E.g., The effects of... " {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea placeholder="A short description of the study's objectives." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                      <Button type="submit" disabled={form.formState.isSubmitting}>
                        {form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                        Create Study
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {renderContent()}
      </CardContent>
    </Card>
  );
}

    