"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, FileWarning, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Document {
  doc_id: string;
  doc_name: string;
  // Add other properties if available from the API
}

const LLM_SERVICE_URL = process.env.NEXT_PUBLIC_LLM_SERVICE_URL || "http://127.0.0.1:8001";

export default function DocumentsPage() {
  const { llmToken } = useAuth();
  const { toast } = useToast();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = useCallback(async () => {
    if (!llmToken) {
        setError("LLM service token is missing. Please log in again.");
        setIsLoading(false);
        return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${LLM_SERVICE_URL}/documents/list`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${llmToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Failed to fetch documents.' }));
        throw new Error(errorData.detail);
      }
      
      const data = await response.json();
      setDocuments(data.documents || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(errorMessage);
      toast({ variant: 'destructive', title: 'Error', description: errorMessage });
    } finally {
      setIsLoading(false);
    }
  }, [llmToken, toast]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col justify-center items-center h-64 text-destructive">
          <FileWarning className="h-8 w-8 mb-2" />
          <p className="mb-4">{error}</p>
          <Button onClick={fetchDocuments}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </div>
      );
    }

    if (documents.length === 0) {
      return (
        <div className="text-center h-64 flex justify-center items-center">
          <p className="text-muted-foreground">No documents found. Upload one to get started.</p>
        </div>
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Document Name</TableHead>
            <TableHead>Document ID</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {documents.map((doc) => (
            <TableRow key={doc.doc_id}>
              <TableCell className="font-medium">{doc.doc_name}</TableCell>
              <TableCell>
                <Badge variant="secondary" className="font-mono">{doc.doc_id}</Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
            <div>
                <CardTitle>Uploaded Documents</CardTitle>
                <CardDescription>A list of all documents available to the LLM.</CardDescription>
            </div>
            <Button variant="outline" size="icon" onClick={fetchDocuments} disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
        </div>
      </CardHeader>
      <CardContent>
        {renderContent()}
      </CardContent>
    </Card>
  );
}
