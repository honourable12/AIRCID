"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, Sparkles } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

const LLM_SERVICE_URL = process.env.NEXT_PUBLIC_LLM_SERVICE_URL || "http://127.0.0.1:8001";

const askSchema = z.object({
  question: z.string().min(10, { message: "Please enter a detailed question." }),
  num_context_chunks: z.coerce.number().int().min(1, "Must be at least 1").max(5, "Must be 5 or less"),
});

type AskFormValues = z.infer<typeof askSchema>;

export default function AskPage() {
  const { llmToken, userEmail } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const form = useForm<AskFormValues>({
    resolver: zodResolver(askSchema),
    defaultValues: {
      question: '',
      num_context_chunks: 2,
    },
  });

  const onSubmit = async (data: AskFormValues) => {
    if (!llmToken || !userEmail) {
      toast({ variant: 'destructive', title: 'Authentication Error', description: 'User not authenticated or LLM token missing.' });
      return;
    }
    
    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch(`${LLM_SERVICE_URL}/qna/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${llmToken}`,
        },
        body: JSON.stringify({ ...data, email: userEmail }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'An unknown error occurred.' }));
        throw new Error(errorData.detail || 'Failed to get answer from LLM.');
      }

      const responseData = await response.json();
      setResult(responseData.answer);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      toast({ variant: 'destructive', title: 'Error', description: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>AI Chat</CardTitle>
          <CardDescription>Get answers from the LLM based on the uploaded documents.</CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="question"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Question</FormLabel>
                    <FormControl>
                      <Textarea placeholder="e.g., What are the primary eligibility criteria for the study?" {...field} rows={4}/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="num_context_chunks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Context Chunks</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                     <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                Get Answer
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Answer</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none text-foreground">
            <p>{result}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
