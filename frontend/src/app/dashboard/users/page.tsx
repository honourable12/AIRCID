
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertCircle, RefreshCw, PlusCircle, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';

const CORE_BACKEND_URL = process.env.NEXT_PUBLIC_CORE_BACKEND_URL || "http://127.0.0.1:8000";

interface Role {
    id: number;
    name: string;
}

interface User {
  id: number;
  email: string;
  full_name: string | null;
  is_active: boolean;
  role: Role | null;
}

const userFormSchema = z.object({
  full_name: z.string().min(1, "Full name is required."),
  email: z.string().email("Invalid email address."),
  password: z.string().min(8, "Password must be at least 8 characters.").optional(),
  role_id: z.coerce.number().int().positive("Role is required."),
});

type UserFormValues = z.infer<typeof userFormSchema>;

export default function UsersPage() {
  const { toast } = useToast();
  const { user: currentUser, token } = useAuth();
  const router = useRouter();
  
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
  });

  const fetchUsersAndRoles = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const [usersRes, rolesRes] = await Promise.all([
        fetch(`${CORE_BACKEND_URL}/api/v1/users/`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${CORE_BACKEND_URL}/api/v1/roles/`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      if (!usersRes.ok) throw new Error('Failed to fetch users.');
      if (!rolesRes.ok) throw new Error('Failed to fetch roles.');

      const usersData = await usersRes.json();
      const rolesData = await rolesRes.json();
      setUsers(usersData);
      setRoles(rolesData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(errorMessage);
      toast({ variant: 'destructive', title: 'Error', description: errorMessage });
    } finally {
      setIsLoading(false);
    }
  }, [token, toast]);

  useEffect(() => {
    if (currentUser?.role?.name !== 'administrator') {
        toast({variant: 'destructive', title: 'Unauthorized', description: 'You do not have permission to view this page.'})
        router.push('/dashboard/studies');
    } else {
        fetchUsersAndRoles();
    }
  }, [currentUser, router, fetchUsersAndRoles, toast]);

  const handleOpenUserDialog = (user: User | null) => {
    setEditingUser(user);
    if (user) {
      form.reset({
        full_name: user.full_name || '',
        email: user.email,
        role_id: user.role?.id,
      });
      form.clearErrors('password');
    } else {
      form.reset({
        full_name: '',
        email: '',
        password: '',
        role_id: roles.find(r => r.name === 'participant')?.id,
      });
    }
    setIsUserDialogOpen(true);
  };

  const handleUserSubmit = async (values: UserFormValues) => {
    if (!token) return;
    
    const url = editingUser
      ? `${CORE_BACKEND_URL}/api/v1/users/${editingUser.id}`
      : `${CORE_BACKEND_URL}/api/v1/auth/register`; // Use register endpoint for creation

    const method = editingUser ? 'PUT' : 'POST';
    
    // For editing, if password is not provided, don't include it in the payload
    const payload: any = {...values};
    if (editingUser && !values.password) {
        delete payload.password;
    }
    
    // The register endpoint expects a plain password, the PUT user endpoint expects a plain password
    const body = JSON.stringify(payload);

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: body,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Failed to ${editingUser ? 'update' : 'create'} user.`);
      }

      toast({ title: 'Success', description: `User ${editingUser ? 'updated' : 'created'} successfully.` });
      setIsUserDialogOpen(false);
      fetchUsersAndRoles();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      toast({ variant: 'destructive', title: 'Error', description: errorMessage });
    }
  };
  
  const handleDeleteUser = async (userId: number) => {
    if (!token) return;
    try {
      const response = await fetch(`${CORE_BACKEND_URL}/api/v1/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.status !== 204) {
        const errorData = await response.json().catch(() => ({ detail: 'Failed to delete user.'}));
        throw new Error(errorData.detail);
      }
      toast({ title: 'Success', description: 'User deleted successfully.' });
      fetchUsersAndRoles(); // Refresh the list
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      toast({ variant: 'destructive', title: 'Error', description: errorMessage });
    }
  };


  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center p-8">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center text-destructive">
          <AlertCircle className="h-12 w-12 mb-4" />
          <p className="text-xl">{error}</p>
          <Button onClick={fetchUsersAndRoles} className="mt-4" variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" /> Retry
          </Button>
        </div>
      );
    }
    
    return (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Full Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.full_name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell><Badge variant="secondary">{user.role?.name || 'N/A'}</Badge></TableCell>
                <TableCell>
                  <Badge variant={user.is_active ? 'default' : 'outline'}>
                    {user.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => handleOpenUserDialog(user)}>
                      <Edit className="h-4 w-4"/>
                  </Button>
                  <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" disabled={user.id === currentUser?.id}>
                                <Trash2 className="h-4 w-4 text-destructive"/>
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This will permanently delete the user {user.full_name}.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteUser(user.id)}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
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
                <CardTitle>User Management</CardTitle>
                <CardDescription>Create, view, and manage user accounts and roles.</CardDescription>
            </div>
            <Button onClick={() => handleOpenUserDialog(null)}>
                <PlusCircle className="mr-2 h-4 w-4"/>
                Add User
            </Button>
        </div>
      </CardHeader>
      <CardContent>
        {renderContent()}
      </CardContent>

       {/* User Dialog */}
        <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{editingUser ? 'Edit User' : 'Add New User'}</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleUserSubmit)} className="space-y-4 pt-4">
                        <FormField control={form.control} name="full_name" render={({ field }) => (
                            <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                        <FormField control={form.control} name="email" render={({ field }) => (
                            <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                        <FormField control={form.control} name="password" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Password</FormLabel>
                                <FormControl><Input type="password" {...field} placeholder={editingUser ? "Leave blank to keep current password" : ""}/></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}/>
                        <FormField control={form.control} name="role_id" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Role</FormLabel>
                                <Select onValueChange={(value) => field.onChange(parseInt(value, 10))} value={String(field.value || '')}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Select a role" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        {roles.map(role => (
                                            <SelectItem key={role.id} value={String(role.id)}>{role.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}/>
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setIsUserDialogOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={form.formState.isSubmitting}>
                                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                {editingUser ? 'Save Changes' : 'Create User'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    </Card>
  );
}
