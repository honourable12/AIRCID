
"use client";

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, RefreshCw, Edit, Trash2, PlusCircle, ArrowLeft, GripVertical } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';

const CORE_BACKEND_URL = process.env.NEXT_PUBLIC_CORE_BACKEND_URL || "http://127.0.0.1:8000";

interface FormDetails {
  id: number;
  title: string;
  description: string;
}

interface Question {
  id: number;
  form_id: number;
  question_text: string;
  question_type: 'text' | 'textarea' | 'multiple-choice' | 'checkbox' | 'dropdown';
  options: string | null;
  is_required: boolean;
}

const questionSchema = z.object({
  question_text: z.string().min(1, { message: "Question text cannot be empty." }),
  question_type: z.enum(['text', 'textarea', 'multiple-choice', 'checkbox', 'dropdown']),
  options: z.string().optional(),
  is_required: z.boolean().default(false),
}).refine(data => {
    if (['multiple-choice', 'checkbox', 'dropdown'].includes(data.question_type)) {
        return data.options && data.options.trim().length > 0;
    }
    return true;
}, {
    message: "Options are required for this question type (comma-separated).",
    path: ['options'],
});

type QuestionFormValues = z.infer<typeof questionSchema>;


export default function FormDetailsPage({ params }: { params: { studyId: string, formId: string } }) {
  const { studyId, formId } = params;
  const { token } = useAuth();
  const { toast } = useToast();
  
  const [formDetails, setFormDetails] = useState<FormDetails | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isQuestionDialogOpen, setIsQuestionDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  const questionForm = useForm<QuestionFormValues>({
    resolver: zodResolver(questionSchema),
  });


  const fetchFormData = useCallback(async () => {
    if (!token || !formId) return;
    setIsLoading(true);
    setError(null);
    try {
      // Fetch form details and questions in parallel
      const [formRes, questionsRes] = await Promise.all([
        fetch(`${CORE_BACKEND_URL}/api/v1/forms/${formId}`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${CORE_BACKEND_URL}/api/v1/questions/?form_id=${formId}`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      if (!formRes.ok) {
        throw new Error('Failed to fetch form details.');
      }
      if (!questionsRes.ok) {
        throw new Error('Failed to fetch questions.');
      }
      
      const form_data = await formRes.json();
      const questions_data = await questionsRes.json();

      setFormDetails(form_data);
      setQuestions(questions_data);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(errorMessage);
      toast({ variant: 'destructive', title: 'Error', description: errorMessage });
    } finally {
      setIsLoading(false);
    }
  }, [token, formId, toast]);

  useEffect(() => {
    fetchFormData();
  }, [fetchFormData]);

  const handleOpenQuestionDialog = (question: Question | null) => {
    setEditingQuestion(question);
    if (question) {
        questionForm.reset({
            question_text: question.question_text,
            question_type: question.question_type,
            options: question.options || '',
            is_required: question.is_required,
        });
    } else {
        questionForm.reset({
            question_text: '',
            question_type: 'text',
            options: '',
            is_required: false,
        });
    }
    setIsQuestionDialogOpen(true);
  };

  const handleQuestionSubmit = async (values: QuestionFormValues) => {
    if (!token) return;

    const url = editingQuestion
      ? `${CORE_BACKEND_URL}/api/v1/questions/${editingQuestion.id}`
      : `${CORE_BACKEND_URL}/api/v1/questions/`;
    
    const method = editingQuestion ? 'PUT' : 'POST';

    const body: any = { ...values, form_id: parseInt(formId, 10) };
    if (!['multiple-choice', 'checkbox', 'dropdown'].includes(values.question_type)) {
        body.options = null;
    }

    try {
        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || `Failed to ${editingQuestion ? 'update' : 'create'} question.`);
        }

        toast({ title: 'Success', description: `Question ${editingQuestion ? 'updated' : 'created'} successfully.` });
        setIsQuestionDialogOpen(false);
        fetchFormData();
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        toast({ variant: 'destructive', title: 'Error', description: errorMessage });
    }
  };

  const handleDeleteQuestion = async (questionId: number) => {
    if (!token) return;
    try {
        const response = await fetch(`${CORE_BACKEND_URL}/api/v1/questions/${questionId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` },
        });

        if (response.status !== 204) {
            const errorData = await response.json().catch(() => ({ detail: 'Failed to delete question.'}));
            throw new Error(errorData.detail);
        }
        toast({ title: 'Success', description: 'Question deleted successfully.' });
        fetchFormData(); // Refresh
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        toast({ variant: 'destructive', title: 'Error', description: errorMessage });
    }
  };


  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader><CardTitle>Error</CardTitle></CardHeader>
        <CardContent className="flex flex-col justify-center items-center h-64 text-destructive">
          <AlertCircle className="h-8 w-8 mb-2" />
          <p className="mb-4">{error}</p>
          <Button onClick={fetchFormData}><RefreshCw className="mr-2 h-4 w-4" />Try Again</Button>
        </CardContent>
      </Card>
    );
  }

  if (!formDetails) {
    return <Card><CardHeader><CardTitle>Form not found.</CardTitle></CardHeader></Card>;
  }

  const questionType = questionForm.watch('question_type');

  return (
    <div className="space-y-6">
        <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild>
                <Link href={`/dashboard/studies/${studyId}`}>
                    <ArrowLeft className="h-4 w-4" />
                </Link>
            </Button>
            <div>
                <h1 className="text-2xl font-bold tracking-tight">{formDetails.title}</h1>
                <p className="text-muted-foreground">{formDetails.description}</p>
            </div>
        </div>

      <Card>
        <CardHeader>
            <div className="flex justify-between items-center">
                <div>
                    <CardTitle>Questions</CardTitle>
                    <CardDescription>Manage the questions for this form.</CardDescription>
                </div>
                 <Button onClick={() => handleOpenQuestionDialog(null)}>
                    <PlusCircle className="mr-2 h-4 w-4"/>
                    Add Question
                </Button>
            </div>
        </CardHeader>
        <CardContent>
            {questions.length === 0 ? (
                 <p className="text-muted-foreground text-sm py-4">This form has no questions yet. Click "Add Question" to start building it.</p>
            ) : (
                <div className="space-y-2">
                    {questions.map((q, index) => (
                        <Card key={q.id}>
                            <CardContent className="p-3 flex items-center gap-4">
                                <GripVertical className="h-5 w-5 text-muted-foreground" />
                                <div className="flex-1">
                                    <p className="font-medium">{index + 1}. {q.question_text}{q.is_required && <span className="text-destructive">*</span>}</p>
                                    <div className="flex gap-2 items-center">
                                       <Badge variant="secondary">{q.question_type}</Badge>
                                       {q.options && <p className="text-xs text-muted-foreground truncate">Options: {q.options}</p>}
                                    </div>
                                </div>
                                <div className="flex gap-1">
                                    <Button variant="ghost" size="icon" onClick={() => handleOpenQuestionDialog(q)}>
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive"/></Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This will permanently delete the question.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDeleteQuestion(q.id)}>Delete</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </CardContent>
      </Card>
      
       {/* Question Dialog */}
        <Dialog open={isQuestionDialogOpen} onOpenChange={setIsQuestionDialogOpen}>
            <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                    <DialogTitle>{editingQuestion ? 'Edit Question' : 'Add New Question'}</DialogTitle>
                </DialogHeader>
                 <Form {...questionForm}>
                    <form onSubmit={questionForm.handleSubmit(handleQuestionSubmit)} className="space-y-4 pt-4">
                        <FormField
                            control={questionForm.control}
                            name="question_text"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Question Text</FormLabel>
                                    <FormControl>
                                        <Textarea {...field} placeholder="e.g., What is your primary symptom?" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={questionForm.control}
                            name="question_type"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Question Type</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a question type" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="text">Text</SelectItem>
                                        <SelectItem value="textarea">Textarea</SelectItem>
                                        <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
                                        <SelectItem value="checkbox">Checkboxes</SelectItem>
                                        <SelectItem value="dropdown">Dropdown</SelectItem>
                                    </SelectContent>
                                    </Select>
                                    <FormMessage />
                                 </FormItem>
                            )}
                        />
                        {['multiple-choice', 'checkbox', 'dropdown'].includes(questionType) && (
                            <FormField
                                control={questionForm.control}
                                name="options"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Options</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="e.g., Option 1, Option 2, Option 3" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}
                         <FormField
                            control={questionForm.control}
                            name="is_required"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                    <FormControl>
                                        <Checkbox
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel>
                                        Is this question required?
                                        </FormLabel>
                                    </div>
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setIsQuestionDialogOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={questionForm.formState.isSubmitting}>
                                {questionForm.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                {editingQuestion ? 'Save Changes' : 'Add Question'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    </div>
  );
}
