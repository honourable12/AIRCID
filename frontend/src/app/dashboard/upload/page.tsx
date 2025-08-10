"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, UploadCloud } from 'lucide-react';

const MAX_FILE_SIZE = 10 * 2048 *2048;
const ACCEPTED_FILE_TYPES = ['application/pdf'];
const LLM_SERVICE_URL = process.env.NEXT_PUBLIC_LLM_SERVICE_URL || "http://127.0.0.1:8001";

const uploadSchema = z.object({
  file: z
    .any()
    .refine((files) => files?.length == 1, "File is required.")
    .refine((files) => files?.[0]?.size <= MAX_FILE_SIZE, `Max file size is 5MB.`)
    .refine(
      (files) => ACCEPTED_FILE_TYPES.includes(files?.[0]?.type),
      ".pdf files are accepted."
    ),
});

type UploadFormValues = z.infer<typeof uploadSchema>;

export default function UploadPage() {
  const { llmToken } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<UploadFormValues>({
    resolver: zodResolver(uploadSchema),
  });

  const onSubmit = async (data: UploadFormValues) => {
    if (!llmToken) {
      toast({ variant: 'destructive', title: 'Authentication Error', description: 'LLM service token is missing.' });
      return;
    }

    setIsLoading(true);
    const formData = new FormData();
    formData.append('file', data.file[0]);

    try {
      const response = await fetch(`${LLM_SERVICE_URL}/documents/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${llmToken}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'An unknown error occurred during upload.' }));
        throw new Error(errorData.detail);
      }
      
      toast({ title: 'Success', description: 'File uploaded successfully.' });
      form.reset();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      toast({ variant: 'destructive', title: 'Upload Failed', description: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Document</CardTitle>
        <CardDescription>Upload a PDF document to be processed by the LLM.</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent>
            <FormField
              control={form.control}
              name="file"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>PDF Document</FormLabel>
                  <FormControl>
                    <Input 
                      type="file" 
                      accept=".pdf"
                      onChange={(e) => field.onChange(e.target.files)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
              Upload File
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
