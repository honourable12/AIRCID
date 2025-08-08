
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertCircle, BookText, Users, FileText } from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig, BarChart, Bar, XAxis, YAxis, CartesianGrid } from '@/components/ui/chart';
import { Cell } from 'recharts';

const CORE_BACKEND_URL = process.env.NEXT_PUBLIC_CORE_BACKEND_URL || "http://127.0.0.1:8000";

interface Study {
  id: number;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  creator_id: number;
}
interface Participant {
    id: number;
}
interface Form {
    id: number;
}

interface AnalyticsData {
    totalStudies: number;
    totalParticipants: number;
    totalForms: number;
    studiesByStatus: { status: string; count: number }[];
}


export default function AnalyticsPage() {
    const { token } = useAuth();
    const { toast } = useToast();
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchAnalyticsData = useCallback(async () => {
        if (!token) {
            setError("Not authenticated.");
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        setError(null);

        try {
            const studiesRes = await fetch(`${CORE_BACKEND_URL}/api/v1/studies/`, { headers: { 'Authorization': `Bearer ${token}` } });
            
            if (!studiesRes.ok) throw new Error("Failed to fetch studies.");
            
            const studies: Study[] = await studiesRes.json();
            
            let totalParticipants = 0;
            let totalForms = 0;

            const participantsRes = await fetch(`${CORE_BACKEND_URL}/api/v1/participants/`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (participantsRes.ok) {
                 const participants: Participant[] = await participantsRes.json();
                 totalParticipants = participants.length;
            }
            
            const formsRes = await fetch(`${CORE_BACKEND_URL}/api/v1/forms/`, { headers: { 'Authorization': `Bearer ${token}` } });
             if (formsRes.ok) {
                 const forms: Form[] = await formsRes.json();
                 totalForms = forms.length;
            }

            const studiesByStatus = studies.reduce((acc, study) => {
                const status = study.status.charAt(0).toUpperCase() + study.status.slice(1);
                const existing = acc.find(item => item.status === status);
                if (existing) {
                    existing.count++;
                } else {
                    acc.push({ status: status, count: 1 });
                }
                return acc;
            }, [] as { status: string; count: number }[]);
            
            setData({
                totalStudies: studies.length,
                totalParticipants,
                totalForms,
                studiesByStatus,
            });

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
            setError(errorMessage);
            toast({ variant: 'destructive', title: 'Error fetching analytics', description: errorMessage });
        } finally {
            setIsLoading(false);
        }

    }, [token, toast]);

    useEffect(() => {
        fetchAnalyticsData();
    }, [fetchAnalyticsData]);


    if (isLoading) {
        return <div className="flex justify-center items-center h-full"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-destructive">
                <AlertCircle className="h-10 w-10 mb-2" />
                <p className="text-lg">{error}</p>
            </div>
        );
    }
    
    if (!data) {
        return <div className="text-center">No analytics data available.</div>;
    }

    const studyStatusChartConfig: ChartConfig = {};
    data.studiesByStatus.forEach((item, index) => {
        studyStatusChartConfig[item.status] = {
            label: item.status,
            color: `hsl(var(--chart-${(index % 5) + 1}))`,
        };
    });
    
    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Studies</CardTitle>
                        <BookText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.totalStudies}</div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Participants</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.totalParticipants}</div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Forms</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.totalForms}</div>
                    </CardContent>
                </Card>
            </div>
            
            <div className="grid gap-4">
                 <Card>
                    <CardHeader>
                        <CardTitle>Studies by Status</CardTitle>
                        <CardDescription>Distribution of studies across different statuses.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer config={studyStatusChartConfig} className="min-h-[300px] w-full">
                            <BarChart accessibilityLayer data={data.studiesByStatus} layout="vertical" margin={{ left: 20 }}>
                                <CartesianGrid horizontal={false} />
                                <YAxis dataKey="status" type="category" tickLine={false} axisLine={false} tickMargin={10} />
                                <XAxis dataKey="count" type="number" hide />
                                <ChartTooltip content={<ChartTooltipContent />} />
                                <Bar dataKey="count" radius={5}>
                                     {data.studiesByStatus.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={studyStatusChartConfig[entry.status]?.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
