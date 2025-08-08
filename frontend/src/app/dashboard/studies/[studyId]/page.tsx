

"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, RefreshCw, Users, File as FileIcon, FileText, BarChart2, Edit, Trash2, PlusCircle, ArrowRight, Link as LinkIcon, Clipboard, Send, Download, Wand2, BarChartHorizontal, LineChart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig, BarChart, Bar, XAxis, YAxis, CartesianGrid } from '@/components/ui/chart';


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

interface FormType {
  id: number;
  title: string;
  description: string;
  study_id: number;
  creator_id: number;
}
interface Participant {
  id: number;
  user_id: number | null;
  study_id: number;
  created_at: string;
}

interface Response {
    id: number;
    form_id: number;
    question_id: number;
    participant_id: number;
    answer_text: string | null;
    answer_options: string | null;
    submitted_at: string;
}

const studySchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters." }),
  description: z.string().min(10, { message: "Description must be at least 10 characters." }),
  status: z.enum(['pending', 'active', 'completed', 'cancelled']),
});

type StudyFormValues = z.infer<typeof studySchema>;


const formSchema = z.object({
    title: z.string().min(3, { message: "Title must be at least 3 characters." }),
    description: z.string().min(10, { message: "Description must be at least 10 characters." }),
});
type FormFormValues = z.infer<typeof formSchema>;

const generateFormSchema = z.object({
  prompt: z.string().min(20, { message: "Please provide a detailed description of the form's purpose." }),
});
type GenerateFormValues = z.infer<typeof generateFormSchema>;


const GenerateFormDialog = ({ studyId, onFormGenerated }: { studyId: string, onFormGenerated: () => void }) => {
    const { token } = useAuth();
    const { toast } = useToast();
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const form = useForm<GenerateFormValues>({
        resolver: zodResolver(generateFormSchema),
        defaultValues: {
            prompt: '',
        },
    });

    const {formState: { isSubmitting }, handleSubmit, reset} = form;

    const onSubmit = async (data: GenerateFormValues) => {
        if (!token) {
            toast({ variant: 'destructive', title: 'Authentication Error', description: 'User not authenticated.' });
            return;
        }

        try {
            const response = await fetch(`${CORE_BACKEND_URL}/api/v1/forms/from-llm`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    prompt: data.prompt,
                    study_id: parseInt(studyId, 10),
                }),
            });


            if (!response.ok) {
                 const errorData = await response.json().catch(() => ({ detail: 'Failed to generate form.' }));
                 throw new Error(errorData.detail);
            }
            
            toast({ title: 'Success!', description: 'AI-generated form has been created.' });
            onFormGenerated();
            setIsDialogOpen(false);
            reset();

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
            toast({ variant: 'destructive', title: 'Error', description: errorMessage });
        }
    };

    return (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <Wand2 className="mr-2 h-4 w-4"/>
                    Generate with AI
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Generate Form with AI</DialogTitle>
                    <DialogDescription>
                        Describe the purpose of your form, and the AI will generate the questions for you.
                    </DialogDescription>
                </DialogHeader>
                 <Form {...form}>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
                       <FormField
                            control={form.control}
                            name="prompt"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Form Description</FormLabel>
                                <FormControl>
                                    <Textarea
                                        {...field}
                                        rows={5}
                                        placeholder="e.g., A patient intake form for a clinical trial on a new hypertension medication. It should collect demographics, medical history, current medications, and baseline vitals like blood pressure and heart rate."
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                Generate Form
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}


const FormsTab = ({ studyId, token, user }: { studyId: string, token: string | null, user: any }) => {
    const [forms, setForms] = useState<FormType[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();
    const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
    const [editingForm, setEditingForm] = useState<FormType | null>(null);

    const formForm = useForm<FormFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: "",
            description: "",
        },
    });

    const fetchForms = useCallback(async () => {
        if (!token) return;
        setIsLoading(true);
        try {
            const response = await fetch(`${CORE_BACKEND_URL}/api/v1/forms/by_study/${studyId}`, { headers: { 'Authorization': `Bearer ${token}` } });
             if (!response.ok) {
                const errorData = await response.json().catch(() => ({ detail: 'Failed to fetch forms.' }));
                throw new Error(errorData.detail);
            }
            const data = await response.json();
            setForms(data);
        } catch (error) {
             const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
             toast({ variant: 'destructive', title: 'Error', description: errorMessage });
        } finally {
             setIsLoading(false);
        }
    }, [studyId, token, toast]);

    useEffect(() => {
        fetchForms();
    }, [fetchForms]);

    const handleOpenFormDialog = (form: FormType | null) => {
        setEditingForm(form);
        if (form) {
            formForm.reset({ title: form.title, description: form.description });
        } else {
            formForm.reset({ title: '', description: '' });
        }
        setIsFormDialogOpen(true);
    }
    
    const handleFormSubmit = async (values: FormFormValues) => {
        if(!token || !user) return;

        const url = editingForm
            ? `${CORE_BACKEND_URL}/api/v1/forms/${editingForm.id}`
            : `${CORE_BACKEND_URL}/api/v1/forms/`;

        const method = editingForm ? 'PUT' : 'POST';
        
        const body = editingForm 
            ? JSON.stringify(values)
            : JSON.stringify({ ...values, study_id: parseInt(studyId, 10), creator_id: user.id });

        try {
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || `Failed to ${editingForm ? 'update' : 'create'} form.`);
            }

            toast({ title: 'Success', description: `Form ${editingForm ? 'updated' : 'created'} successfully.` });
            setIsFormDialogOpen(false);
            fetchForms(); // Refresh the list
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
            toast({ variant: 'destructive', title: 'Error', description: errorMessage });
        }
    };

    const handleDeleteForm = async (formId: number) => {
        if(!token) return;
        try {
            const response = await fetch(`${CORE_BACKEND_URL}/api/v1/forms/${formId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (response.status !== 204) {
                 const errorData = await response.json().catch(()=>({detail: 'Failed to delete form.'}));
                 throw new Error(errorData.detail);
            }
            toast({ title: 'Success', description: 'Form deleted successfully.'});
            fetchForms();
        } catch(error) {
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
            toast({ variant: 'destructive', title: 'Error', description: errorMessage });
        }
    }


    return <Card>
         <CardHeader>
            <div className="flex justify-between items-center">
                <div>
                    <CardTitle>Forms</CardTitle>
                    <CardDescription>Forms used to collect data in this study.</CardDescription>
                </div>
                <div className="flex gap-2">
                    <GenerateFormDialog studyId={studyId} onFormGenerated={fetchForms} />
                    <Button onClick={() => handleOpenFormDialog(null)}>
                        <PlusCircle className="mr-2 h-4 w-4"/>
                        Create Form
                    </Button>
                </div>
            </div>
        </CardHeader>
        <CardContent>
            {isLoading && <div className="flex justify-center items-center py-8"><Loader2 className="h-6 w-6 animate-spin"/></div>}
            {!isLoading && forms.length === 0 && <p className="text-muted-foreground text-sm py-4">No forms found. Create one to get started.</p>}
            {!isLoading && forms.length > 0 &&
                <div className="space-y-2">
                    {forms.map(form => (
                        <Card key={form.id}>
                            <CardContent className="p-3 flex items-center gap-4">
                                <FileText className="h-5 w-5 text-muted-foreground"/>
                                <div className="flex-1">
                                    <p className="font-medium">{form.title}</p>
                                    <p className="text-sm text-muted-foreground">{form.description}</p>
                                </div>
                                <div className="flex items-center gap-1">
                                     <Button variant="outline" size="sm" asChild>
                                        <Link href={`/dashboard/studies/${studyId}/forms/${form.id}`}>
                                            Manage Questions
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        </Link>
                                     </Button>
                                     <Button variant="secondary" size="sm" asChild>
                                        <Link href={`/survey/${form.id}`} target="_blank">
                                            <Send className="mr-2 h-4 w-4" />
                                            Respond
                                        </Link>
                                    </Button>
                                     <Button variant="ghost" size="icon" onClick={() => handleOpenFormDialog(form)}>
                                        <Edit className="h-4 w-4"/>
                                     </Button>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="icon">
                                                <Trash2 className="h-4 w-4 text-destructive"/>
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This will permanently delete the form. This action cannot be undone.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDeleteForm(form.id)}>Delete</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            }
        </CardContent>

        {/* Form Dialog */}
        <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{editingForm ? 'Edit Form' : 'Create New Form'}</DialogTitle>
                    <DialogDescription>
                        {editingForm ? 'Update the details of your form.' : 'Fill in the details for the new form.'}
                    </DialogDescription>
                </DialogHeader>
                <Form {...formForm}>
                    <form onSubmit={formForm.handleSubmit(handleFormSubmit)} className="space-y-4 pt-4">
                        <FormField
                            control={formForm.control}
                            name="title"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Title</FormLabel>
                                <FormControl>
                                    <Input {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={formForm.control}
                            name="description"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Description</FormLabel>
                                <FormControl>
                                    <Textarea {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setIsFormDialogOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={formForm.formState.isSubmitting}>
                                {formForm.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                {editingForm ? 'Save Changes' : 'Create Form'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    </Card>;
}

const ParticipantsTab = ({ studyId, token }: { studyId: string, token: string | null }) => {
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [forms, setForms] = useState<FormType[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
    const [selectedParticipantId, setSelectedParticipantId] = useState<number | null>(null);
    const [selectedFormId, setSelectedFormId] = useState<string>("");
    
    const fetchParticipantsAndForms = useCallback(async () => {
        if (!token) return;
        setIsLoading(true);
        try {
            const [participantsRes, formsRes] = await Promise.all([
                fetch(`${CORE_BACKEND_URL}/api/v1/participants/?study_id=${studyId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch(`${CORE_BACKEND_URL}/api/v1/forms/by_study/${studyId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ]);
            
            if (!participantsRes.ok) throw new Error('Failed to fetch participants.');
            if (!formsRes.ok) throw new Error('Failed to fetch forms.');

            const participantsData = await participantsRes.json();
            const formsData = await formsRes.json();

            setParticipants(participantsData.filter((p: Participant) => p.study_id === parseInt(studyId, 10)) || []);
            setForms(formsData || []);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
            toast({ variant: 'destructive', title: 'Error', description: errorMessage });
        } finally {
            setIsLoading(false);
        }
    }, [studyId, token, toast]);

    useEffect(() => {
        fetchParticipantsAndForms();
    }, [fetchParticipantsAndForms]);

    const handleAddParticipant = async () => {
        if (!token) return;
        setIsSubmitting(true);
        try {
            const response = await fetch(`${CORE_BACKEND_URL}/api/v1/participants/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ study_id: parseInt(studyId, 10), user_id: null })
            });
            if (!response.ok) throw new Error('Failed to create participant.');
            toast({ title: "Success", description: "New anonymous participant added." });
            fetchParticipantsAndForms();
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
            toast({ variant: 'destructive', title: 'Error', description: errorMessage });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const openLinkDialog = (participantId: number | null = null) => {
        setSelectedParticipantId(participantId);
        setSelectedFormId("");
        setIsLinkDialogOpen(true);
    };

    const getSurveyLink = () => {
        if(!selectedFormId) return "";
        const baseLink = `${window.location.origin}/survey/${selectedFormId}`;
        if(selectedParticipantId) {
             return `${baseLink}?participantId=${selectedParticipantId}`;
        }
        return baseLink;
    }

    const copyLinkToClipboard = () => {
        const link = getSurveyLink();
        if(link) {
            navigator.clipboard.writeText(link);
            toast({title: "Copied!", description: "Survey link copied to clipboard."});
        }
    }


    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle>Participants</CardTitle>
                        <CardDescription>Manage study participants and survey links.</CardDescription>
                    </div>
                     <div className="flex gap-2">
                        <Button onClick={handleAddParticipant} disabled={isSubmitting}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            {isSubmitting ? 'Adding...' : 'Add Anonymous Participant'}
                            {isSubmitting && <Loader2 className="ml-2 h-4 w-4 animate-spin"/>}
                        </Button>
                         <Button variant="secondary" onClick={() => openLinkDialog()} disabled={forms.length === 0}>
                            <LinkIcon className="mr-2 h-4 w-4"/>
                            Get Generic Link
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex justify-center items-center py-8"><Loader2 className="h-6 w-6 animate-spin"/></div>
                ) : participants.length === 0 ? (
                    <p className="text-muted-foreground text-sm py-4">No participants found for this study.</p>
                ) : (
                    <div className="space-y-2">
                        {participants.map(p => (
                            <Card key={p.id}>
                                <CardContent className="p-3 flex items-center gap-4">
                                     <div className="flex-1">
                                        <p className="font-medium">Participant ID: {p.id}</p>
                                        <p className="text-xs text-muted-foreground">
                                            User: {p.user_id ? p.user_id : 'Anonymous'} | Joined: {new Date(p.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <Button variant="outline" size="sm" onClick={() => openLinkDialog(p.id)} disabled={forms.length === 0}>
                                        <LinkIcon className="mr-2 h-4 w-4"/>
                                        Get Survey Link
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </CardContent>
             {/* Get Link Dialog */}
            <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Get Survey Link</DialogTitle>
                        <DialogDescription>
                           {selectedParticipantId
                                ? "Select a form to generate a unique survey link for this participant."
                                : "Select a form to generate a generic survey link. A new participant will be created on submission."
                            }
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <Select onValueChange={setSelectedFormId} value={selectedFormId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a form..." />
                            </SelectTrigger>
                            <SelectContent>
                                {forms.map(form => (
                                    <SelectItem key={form.id} value={String(form.id)}>
                                        {form.title}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        
                        {selectedFormId && (
                           <div className="space-y-2">
                                <Label htmlFor="survey-link">Generated Link</Label>
                                <div className="flex gap-2">
                                    <Input id="survey-link" readOnly value={getSurveyLink()} />
                                    <Button size="icon" onClick={copyLinkToClipboard}><Clipboard className="h-4 w-4"/></Button>
                                </div>
                           </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </Card>
    );
};

const ResponsesTab = ({ studyId, token, user }: { studyId: string, token: string | null, user: any }) => {
    const [responses, setResponses] = useState<Response[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isExporting, setIsExporting] = useState(false);
    const { toast } = useToast();

     const fetchResponses = useCallback(async () => {
        if (!token) return;
        setIsLoading(true);
        try {
            const participantsResponse = await fetch(`${CORE_BACKEND_URL}/api/v1/participants/?study_id=${studyId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!participantsResponse.ok) {
                throw new Error('Failed to fetch participants for the study.');
            }
            const participants: Participant[] = await participantsResponse.json();
            const participantIds = participants
                .filter(p => p.study_id === parseInt(studyId, 10))
                .map(p => p.id);

            if (participantIds.length === 0) {
                setResponses([]);
                setIsLoading(false);
                return;
            }

            const responsePromises = participantIds.map(pid => 
                fetch(`${CORE_BACKEND_URL}/api/v1/responses/?participant_id=${pid}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }).then(res => {
                    if (!res.ok) {
                         console.error(`Failed to fetch responses for participant ${pid}`);
                         return [];
                    }
                    return res.json();
                })
            );

            const responsesByParticipant = await Promise.all(responsePromises);
            const allResponses = responsesByParticipant.flat();
            
            setResponses(allResponses);

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
            toast({ variant: 'destructive', title: 'Error', description: errorMessage });
        } finally {
             setIsLoading(false);
        }
    }, [studyId, token, toast]);

    useEffect(() => {
        if (token) {
            fetchResponses();
        }
    }, [fetchResponses, token]);

    const handleExport = async (format: 'csv' | 'parquet') => {
        if (!token) {
            toast({ title: "Authentication Error", description: "You are not logged in.", variant: "destructive" });
            return;
        }
        setIsExporting(true);
        try {
            const response = await fetch(`${CORE_BACKEND_URL}/api/v1/export/responses/${format}?study_id=${studyId}`, {
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
            a.download = `responses_${studyId}.${format}`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);

            toast({ title: "Export successful", description: `Responses data has been downloaded as ${format.toUpperCase()}.` });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
            toast({ title: 'Export Failed', description: errorMessage, variant: 'destructive' });
        } finally {
            setIsExporting(false);
        }
    };
    
    const canExport = user?.role?.name === 'administrator' || user?.role?.name === 'researcher';

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle>Responses</CardTitle>
                        <CardDescription>Data collected from participants in this study.</CardDescription>
                    </div>
                    {canExport && (
                        <div className="flex gap-2">
                             <Button variant="outline" onClick={() => handleExport('csv')} disabled={isExporting}>
                                <Download className="mr-2 h-4 w-4" />
                                {isExporting ? 'Exporting...' : 'Export CSV'}
                            </Button>
                            <Button variant="outline" onClick={() => handleExport('parquet')} disabled={isExporting}>
                                <Download className="mr-2 h-4 w-4" />
                                {isExporting ? 'Exporting...' : 'Export Parquet'}
                            </Button>
                        </div>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                     <div className="flex justify-center items-center py-8"><Loader2 className="h-6 w-6 animate-spin"/></div>
                ) : responses.length === 0 ? (
                    <p className="text-muted-foreground text-sm py-4">No responses found for this study.</p>
                ) : (
                     <div className="space-y-2">
                        {responses.map(r => <Card key={r.id}><CardContent className="p-3">
                            <p className="font-mono text-sm">Response ID: {r.id}</p>
                            <p className="text-xs text-muted-foreground">Participant: {r.participant_id} | Form: {r.form_id} | Question: {r.question_id}</p>
                            {r.answer_text && <pre className="mt-2 text-xs bg-muted p-2 rounded-md"><code>{r.answer_text}</code></pre>}
                            {r.answer_options && <pre className="mt-2 text-xs bg-muted p-2 rounded-md"><code>Options: {r.answer_options}</code></pre>}
                        </CardContent></Card>)}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

const AnalyticsTab = ({ studyId, token }: { studyId: string, token: string | null }) => {
    const [stats, setStats] = useState<{
        participants: number;
        responses: number;
        responsesPerForm: { form_id: number; title: string; count: number }[];
    } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    const fetchAnalyticsData = useCallback(async () => {
        if (!token) return;
        setIsLoading(true);

        try {
            const [participantsRes, formsRes] = await Promise.all([
                fetch(`${CORE_BACKEND_URL}/api/v1/participants/?study_id=${studyId}`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`${CORE_BACKEND_URL}/api/v1/forms/by_study/${studyId}`, { headers: { 'Authorization': `Bearer ${token}` } })
            ]);

            if (!participantsRes.ok) throw new Error('Failed to fetch participants.');
            if (!formsRes.ok) throw new Error('Failed to fetch forms.');

            const participants: Participant[] = await participantsRes.json();
            const forms: FormType[] = await formsRes.json();
            
            const participantIds = participants.filter(p => p.study_id === parseInt(studyId, 10)).map(p => p.id);

            let allResponses: Response[] = [];
            if (participantIds.length > 0) {
                 const responsePromises = participantIds.map(pid => 
                    fetch(`${CORE_BACKEND_URL}/api/v1/responses/?participant_id=${pid}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    }).then(res => res.ok ? res.json() : [])
                );
                const responsesByParticipant = await Promise.all(responsePromises);
                allResponses = responsesByParticipant.flat();
            }

            const responsesPerForm = forms.map(form => {
                const count = allResponses.filter(r => r.form_id === form.id).length;
                return { form_id: form.id, title: form.title, count };
            });


            setStats({
                participants: participantIds.length,
                responses: allResponses.length,
                responsesPerForm: responsesPerForm,
            });

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
            toast({ variant: 'destructive', title: 'Error loading analytics', description: errorMessage });
        } finally {
            setIsLoading(false);
        }
    }, [studyId, token, toast]);

    useEffect(() => {
        fetchAnalyticsData();
    }, [fetchAnalyticsData]);

    if (isLoading) {
        return <div className="flex justify-center items-center py-8"><Loader2 className="h-6 w-6 animate-spin"/></div>;
    }

    if (!stats) {
        return <p className="text-muted-foreground text-sm py-4">Could not load analytics data.</p>;
    }
    
    const chartConfig: ChartConfig = {};
    stats.responsesPerForm.forEach((form, index) => {
        chartConfig[form.title] = {
            label: form.title,
            color: `hsl(var(--chart-${(index % 5) + 1}))`,
        };
    });

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Participants</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.participants}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Responses</CardTitle>
                        <BarChart2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.responses}</div>
                    </CardContent>
                </Card>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Responses per Form</CardTitle>
                    <CardDescription>A breakdown of total responses collected for each form in this study.</CardDescription>
                </CardHeader>
                <CardContent>
                    {stats.responsesPerForm.length > 0 ? (
                        <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
                            <BarChart accessibilityLayer data={stats.responsesPerForm}>
                                <CartesianGrid vertical={false} />
                                <XAxis dataKey="title" tickLine={false} tickMargin={10} axisLine={false} />
                                <YAxis />
                                <ChartTooltip content={<ChartTooltipContent />} />
                                <Bar dataKey="count" fill="var(--color-count)" radius={4} />
                            </BarChart>
                        </ChartContainer>
                    ) : (
                        <p className="text-muted-foreground text-sm py-4">No responses have been collected yet.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};


export default function StudyDetailPage({ params }: { params: { studyId: string } }) {
  const { studyId } = params;
  const { token, user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [study, setStudy] = useState<Study | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const form = useForm<StudyFormValues>({
    resolver: zodResolver(studySchema),
    defaultValues: {
      title: "",
      description: "",
      status: 'pending',
    },
  });

  const fetchStudy = useCallback(async () => {
    if (!token || !studyId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${CORE_BACKEND_URL}/api/v1/studies/${studyId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Failed to fetch study details.' }));
        if (response.status === 403) {
            throw new Error("You are not authorized to view this study.");
        }
        throw new Error(errorData.detail);
      }
      
      const data = await response.json();
      setStudy(data);
       // Reset form with fetched data
      form.reset({ title: data.title, description: data.description, status: data.status });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(errorMessage);
      if (errorMessage !== "You are not authorized to view this study.") {
        toast({ variant: 'destructive', title: 'Error', description: errorMessage });
      }
    } finally {
      setIsLoading(false);
    }
  }, [token, studyId, toast, form]);

  useEffect(() => {
    fetchStudy();
  }, [fetchStudy]);

  const handleUpdateStudy = async (data: StudyFormValues) => {
      if (!token || !studyId) return;

      try {
          const response = await fetch(`${CORE_BACKEND_URL}/api/v1/studies/${studyId}`, {
              method: 'PUT',
              headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`,
              },
              body: JSON.stringify(data),
          });

          if (!response.ok) {
               const errorData = await response.json();
               throw new Error(errorData.detail || 'Failed to update study.');
          }

          const updatedStudy = await response.json();
          setStudy(updatedStudy);
          toast({ title: 'Success', description: 'Study updated successfully.' });
          setIsEditDialogOpen(false);
      } catch (error) {
           const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
           toast({ variant: 'destructive', title: 'Error', description: errorMessage });
      }
  };

  const handleDeleteStudy = async () => {
      if (!token || !studyId) return;

      setIsDeleting(true);
      try {
          const response = await fetch(`${CORE_BACKEND_URL}/api/v1/studies/${studyId}`, {
              method: 'DELETE',
              headers: {
                  'Authorization': `Bearer ${token}`,
              },
          });

          if (response.status !== 204) {
               const errorData = await response.json().catch(() => ({ detail: 'Failed to delete study.' }));
               throw new Error(errorData.detail);
          }

          toast({ title: 'Success', description: 'Study deleted successfully.' });
          router.push('/dashboard/studies'); // Redirect to studies list after deletion
      } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
          toast({ variant: 'destructive', title: 'Error', description: errorMessage });
          setIsDeleting(false);
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

    const userIsCreator = user?.id === study?.creator_id;
    const userIsAdmin = user?.role?.name === 'administrator';
    const canEditDelete = userIsCreator || userIsAdmin;

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
        <CardHeader>
            <CardTitle>Error</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col justify-center items-center h-64 text-destructive">
          <AlertCircle className="h-8 w-8 mb-2" />
          <p className="mb-4">{error}</p>
          <Button onClick={fetchStudy}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!study) {
    return <Card><CardHeader><CardTitle>Study not found.</CardTitle></CardHeader></Card>;
  }

  return (
    <div className="space-y-6">
        <Card>
            <CardHeader>
                 <div className="flex items-start justify-between">
                    <div>
                        <CardTitle>{study.title}</CardTitle>
                        <CardDescription>{study.description}</CardDescription>
                    </div>
                     <Badge variant={getStatusBadgeVariant(study.status)}>
                        {study.status.charAt(0).toUpperCase() + study.status.slice(1)}
                    </Badge>
                </div>
                 {canEditDelete && <div className="flex gap-2 mt-4">
                    <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Study
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>Edit Study</DialogTitle>
                                <DialogDescription>
                                    Make changes to the study details here.
                                </DialogDescription>
                            </DialogHeader>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(handleUpdateStudy)} className="space-y-4 pt-4">
                                    <FormField
                                        control={form.control}
                                        name="title"
                                        render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Title</FormLabel>
                                            <FormControl>
                                                <Input {...field} />
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
                                                <Textarea {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                        )}
                                    />
                                     <FormField
                                        control={form.control}
                                        name="status"
                                        render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Status</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select a status" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="pending">Pending</SelectItem>
                                                        <SelectItem value="active">Active</SelectItem>
                                                        <SelectItem value="completed">Completed</SelectItem>
                                                        <SelectItem value="cancelled">Cancelled</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            <FormMessage />
                                        </FormItem>
                                        )}
                                    />
                                    <DialogFooter>
                                        <Button type="button" variant="ghost" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                                        <Button type="submit" disabled={form.formState.isSubmitting}>
                                            {form.formState.isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                                            Save Changes
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </Form>
                        </DialogContent>
                    </Dialog>

                     <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm" disabled={isDeleting}>
                                {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Trash2 className="mr-2 h-4 w-4"/>}
                                Delete Study
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete the study
                                    and remove all associated data.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDeleteStudy} disabled={isDeleting}>
                                     {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                                    Continue
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>}
            </CardHeader>
        </Card>

        <Tabs defaultValue="forms" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="forms"><FileIcon className="mr-2 h-4 w-4"/>Forms</TabsTrigger>
                <TabsTrigger value="participants"><Users className="mr-2 h-4 w-4"/>Participants</TabsTrigger>
                <TabsTrigger value="responses"><BarChart2 className="mr-2 h-4 w-4"/>Responses</TabsTrigger>
                <TabsTrigger value="analytics"><LineChart className="mr-2 h-4 w-4"/>Analytics</TabsTrigger>
            </TabsList>
            <TabsContent value="forms">
                <FormsTab studyId={studyId} token={token} user={user} />
            </TabsContent>
            <TabsContent value="participants">
                <ParticipantsTab studyId={studyId} token={token} />
            </TabsContent>
            <TabsContent value="responses">
                <ResponsesTab studyId={studyId} token={token} user={user} />
            </TabsContent>
             <TabsContent value="analytics">
                <AnalyticsTab studyId={studyId} token={token} />
            </TabsContent>
        </Tabs>
    </div>
  );
}
