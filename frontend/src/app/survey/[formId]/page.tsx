

"use client";

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useParams } from 'next/navigation';
import { useForm, FormProvider, Controller } from 'react-hook-form';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, Send, CheckCircle } from 'lucide-react';
import { Form, FormItem, FormControl, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';

const CORE_BACKEND_URL = process.env.NEXT_PUBLIC_CORE_BACKEND_URL || "http://127.0.0.1:8000";

interface FormDetails {
  id: number;
  title: string;
  description: string;
  study_id: number; // Added study_id to associate participant
}

interface Question {
  id: number;
  form_id: number;
  question_text: string;
  question_type: 'text' | 'textarea' | 'multiple-choice' | 'checkbox' | 'dropdown';
  options: string | null;
  is_required: boolean;
}

function SurveyPageContent() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const params = useParams();
  const formId = params.formId as string;
  const participantIdFromUrl = searchParams.get('participantId');
  const { user, token } = useAuth(); // Get the logged-in user and token
  
  const [formDetails, setFormDetails] = useState<FormDetails | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const methods = useForm<{ responses: { answer?: string | string[] }[] }>({
    defaultValues: {
      responses: []
    }
  });
  
  const { control, handleSubmit, reset } = methods;

  const fetchFormData = useCallback(async () => {
    if (!formId) {
        setError("Form ID is missing from the URL.");
        setIsLoading(false);
        return;
    }
    if (!token) {
        setError("Authentication token is missing. Please log in to take the survey.");
        setIsLoading(false);
        return;
    }
    
    setIsLoading(true);
    setError(null);
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      const [formRes, questionsRes] = await Promise.all([
        fetch(`${CORE_BACKEND_URL}/api/v1/forms/${formId}`, { headers }),
        fetch(`${CORE_BACKEND_URL}/api/v1/questions/?form_id=${formId}`, { headers })
      ]);

      if (!formRes.ok) throw new Error('Failed to fetch form details.');
      if (!questionsRes.ok) throw new Error('Failed to fetch questions.');
      
      const formData = await formRes.json();
      const questionsData = await questionsRes.json();
      
      setFormDetails(formData);
      setQuestions(questionsData);
      reset({ responses: questionsData.map(() => ({ answer: undefined })) });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [formId, reset, token]);

  useEffect(() => {
    if(token) { // Only fetch if token is available
      fetchFormData();
    }
  }, [fetchFormData, token]);

  const getOrCreateParticipantId = async (): Promise<number> => {
    if (participantIdFromUrl) {
      return parseInt(participantIdFromUrl, 10);
    }
    
    if (!formDetails) {
        throw new Error("Form details not loaded, cannot create participant.");
    }

    // Always create a new participant if no ID is in the URL, allowing multiple submissions for logged-in users.
    const response = await fetch(`${CORE_BACKEND_URL}/api/v1/participants/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ study_id: formDetails.study_id, user_id: user ? user.id : null }), // Use logged-in user ID if available
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Could not create participant.");
    }
    const participant = await response.json();
    return participant.id;
  };

  const onSubmit = async (data: { responses: { answer?: string | string[] }[] }) => {
    if (!formDetails || questions.length === 0) return;

    setIsSubmitting(true);
    try {
        const participantId = await getOrCreateParticipantId();

        const responsePromises = data.responses.map((response, index) => {
            const question = questions[index];
            if (!response.answer || (Array.isArray(response.answer) && response.answer.length === 0)) {
                return null; // Skip if no answer is provided
            }
            
            const payload: any = {
                form_id: parseInt(formId, 10),
                question_id: question.id,
                participant_id: participantId,
            };

            if (Array.isArray(response.answer)) {
                payload.answer_options = JSON.stringify(response.answer);
            } else {
                payload.answer_text = response.answer;
            }

            return fetch(`${CORE_BACKEND_URL}/api/v1/responses/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(payload),
            }).then(res => {
                if(!res.ok) return res.json().then(err => Promise.reject(err));
                return res.json();
            });
        }).filter(Boolean); // Filter out null promises

        if (responsePromises.length > 0) {
            await Promise.all(responsePromises);
        }
        
        setIsSubmitted(true);
        toast({
            title: "Survey Submitted!",
            description: "Thank you for your participation.",
        });

    } catch (error: any) {
        const errorMessage = error?.detail || "An unexpected error occurred while submitting.";
        toast({ variant: 'destructive', title: 'Submission Error', description: errorMessage });
    } finally {
        setIsSubmitting(false);
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
      <Card className="max-w-3xl mx-auto">
        <CardHeader><CardTitle>Error</CardTitle></CardHeader>
        <CardContent className="flex flex-col justify-center items-center h-64 text-destructive">
          <AlertCircle className="h-8 w-8 mb-2" />
          <p>{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (isSubmitted) {
     return (
       <Card className="max-w-3xl mx-auto">
        <CardHeader className="items-center text-center">
            <CheckCircle className="h-16 w-16 text-green-500"/>
            <CardTitle className="text-2xl">Submission Successful</CardTitle>
            <CardDescription>Your responses have been recorded. Thank you for your time!</CardDescription>
        </CardHeader>
      </Card>
     )
  }

  if (!formDetails) {
    return null;
  }

  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>{formDetails.title}</CardTitle>
        <CardDescription>{formDetails.description}</CardDescription>
      </CardHeader>
      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            {questions.map((q, index) => (
               <Controller
                key={q.id}
                control={control}
                name={`responses.${index}.answer`}
                rules={{ required: q.is_required ? 'This field is required.' : false }}
                render={({ field, fieldState }) => (
                  <FormItem className="p-4 border rounded-md">
                    <FormLabel className="font-bold text-base">{index + 1}. {q.question_text}{q.is_required && <span className="text-destructive">*</span>}</FormLabel>
                    <FormControl>
                        <QuestionInput question={q} field={field} />
                    </FormControl>
                    <FormMessage>{fieldState.error?.message}</FormMessage>
                  </FormItem>
                )}
              />
            ))}
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4"/>}
              Submit Responses
            </Button>
          </CardFooter>
        </form>
      </FormProvider>
    </Card>
  );
}

const QuestionInput = ({ question, field }: { question: Question; field: any }) => {
    const options = question.options?.split(',').map(opt => opt.trim()) || [];

    switch (question.question_type) {
        case 'text':
            return <Input {...field} value={field.value || ''} />;
        case 'textarea':
            return <Textarea {...field} value={field.value || ''} />;
        case 'dropdown':
            return (
                 <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Select an option" />
                        </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        {options.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                    </SelectContent>
                </Select>
            );
        case 'multiple-choice':
            return (
                <RadioGroup onValueChange={field.onChange} value={field.value} className="space-y-2">
                    {options.map(opt => (
                        <FormItem key={opt} className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                                <RadioGroupItem value={opt} />
                            </FormControl>
                            <FormLabel className="font-normal">{opt}</FormLabel>
                        </FormItem>
                    ))}
                </RadioGroup>
            );
        case 'checkbox':
            return (
                 <div className="space-y-2">
                    {options.map(opt => (
                        <FormItem key={opt} className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                                <Checkbox
                                    checked={Array.isArray(field.value) && field.value.includes(opt)}
                                    onCheckedChange={(checked) => {
                                        const currentValue = Array.isArray(field.value) ? field.value : [];
                                        return checked
                                            ? field.onChange([...currentValue, opt])
                                            : field.onChange(currentValue.filter((v: string) => v !== opt));
                                    }}
                                />
                            </FormControl>
                            <FormLabel className="font-normal">{opt}</FormLabel>
                        </FormItem>
                    ))}
                </div>
            );
        default:
            return <Input {...field} placeholder="Unsupported question type" disabled />;
    }
};


export default function SurveyPage() {
    return (
      <Suspense fallback={<div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
        <SurveyPageContent />
      </Suspense>
    );
}
