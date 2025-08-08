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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Pilcrow } from 'lucide-react';

const LLM_SERVICE_URL = process.env.NEXT_PUBLIC_LLM_SERVICE_URL || "http://127.0.0.1:8001";

const summarizeSchema = z.object({
  text_content: z.string().min(50, { message: "Please provide at least 50 characters of text to summarize." }),
  summary_context: z.string().min(3, { message: "Context is required." }),
  target_length: z.enum(['short', 'medium', 'long']),
});

type SummarizeFormValues = z.infer<typeof summarizeSchema>;

export default function SummarizePage() {
  const { llmToken } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const form = useForm<SummarizeFormValues>({
    resolver: zodResolver(summarizeSchema),
    defaultValues: {
      text_content: '',
      summary_context: 'clinical note',
      target_length: 'short',
    },
  });

  const onSubmit = async (data: SummarizeFormValues) => {
    if (!llmToken) {
      toast({ variant: 'destructive', title: 'Authentication Error', description: 'User not authenticated.' });
      return;
    }
    
    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch(`${LLM_SERVICE_URL}/text/summarize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${llmToken}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'An unknown error occurred.' }));
        throw new Error(errorData.detail || 'Failed to summarize text.');
      }

      const responseData = await response.json();
      setResult(responseData.summary);
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
          <CardTitle>Summarize Text</CardTitle>
          <CardDescription>Paste text into the field below to receive a concise summary from the AI.</CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="text_content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Text to Summarize</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Patient is a 58-year-old male with a history of hypertension and type 2 diabetes, presenting with chest pain..." 
                        {...field} 
                        rows={8}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="summary_context"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Summary Context</FormLabel>
                        <FormControl>
                        <Input placeholder="e.g., clinical note" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="target_length"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Target Length</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                            <SelectTrigger>
                            <SelectValue placeholder="Select a length" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="short">Short</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="long">Long</SelectItem>
                        </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Pilcrow className="mr-2 h-4 w-4" />}
                Summarize
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none text-foreground">
            <p>{result}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
