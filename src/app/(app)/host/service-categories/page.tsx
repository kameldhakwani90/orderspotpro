
"use client";

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import {
  getServiceCategories,
  addServiceCategory,
  updateServiceCategory,
  deleteServiceCategory
} from '@/lib/data';
import type { ServiceCategory } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Edit2, Trash2, ListChecks, Image as ImageIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';

export default function HostServiceCategoriesPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Partial<ServiceCategory> | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [currentCategoryData, setCurrentCategoryData] = useState<{ nom: string; image?: string }>({
    nom: '',
    image: '',
  });

  const fetchData = useCallback(async (hostId: string) => {
    setIsLoading(true);
    try {
      const categoriesData = await getServiceCategories(hostId);
      setCategories(categoriesData);
    } catch (error) {
      console.error("Failed to load service categories:", error);
      toast({ title: "Error", description: "Could not load service categories. Please try again.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (!authLoading) {
      if (user?.role !== 'host' || !user.hostId) {
        router.replace('/dashboard');
      } else {
        fetchData(user.hostId);
      }
    }
  }, [user, authLoading, router, fetchData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCurrentCategoryData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmitCategory = async () => {
    if (!user?.hostId) return;
    if (!currentCategoryData.nom.trim()) {
      toast({ title: "Validation Error", description: "Category name cannot be empty.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);

    const dataToSubmit: Partial<Omit<ServiceCategory, 'id' | 'hostId' | 'data-ai-hint'>> = {
        nom: currentCategoryData.nom.trim(),
        image: currentCategoryData.image?.trim() || undefined,
    };


    try {
      if (editingCategory && editingCategory.id) {
        await updateServiceCategory(editingCategory.id, dataToSubmit);
        toast({ title: "Category Updated", description: `Category "${dataToSubmit.nom}" has been updated.` });
      } else {
        await addServiceCategory({ ...dataToSubmit, hostId: user.hostId } as Omit<ServiceCategory, 'id' | 'data-ai-hint'>);
        toast({ title: "Category Created", description: `Category "${dataToSubmit.nom}" has been added.` });
      }
      fetchData(user.hostId);
    } catch (error) {
      console.error("Failed to save category:", error);
      toast({ title: "Error", description: `Could not save category. ${error instanceof Error ? error.message : ''}`, variant: "destructive" });
    } finally {
      setIsDialogOpen(false);
      setCurrentCategoryData({ nom: '', image: '' });
      setEditingCategory(null);
      setIsSubmitting(false);
    }
  };

  const openAddDialog = () => {
    setEditingCategory(null);
    setCurrentCategoryData({ nom: '', image: '' });
    setIsDialogOpen(true);
  };

  const openEditDialog = (categoryToEdit: ServiceCategory) => {
    setEditingCategory({ ...categoryToEdit });
    setCurrentCategoryData({ nom: categoryToEdit.nom, image: categoryToEdit.image || '' });
    setIsDialogOpen(true);
  };

  const handleDeleteCategory = async (categoryId: string, categoryName: string) => {
    if (!user?.hostId) return;
    if (!window.confirm(`Are you sure you want to delete category "${categoryName}"? Services using this category will be unassigned.`)) {
        return;
    }
    setIsSubmitting(true);
    try {
        await deleteServiceCategory(categoryId);
        toast({ title: "Category Deleted", description: `Category "${categoryName}" has been deleted.`, variant: "destructive" });
        fetchData(user.hostId);
    } catch (error) {
        console.error("Failed to delete category:", error);
        toast({ title: "Error", description: `Could not delete category. ${error instanceof Error ? error.message : ''}`, variant: "destructive" });
    } finally {
        setIsSubmitting(false);
    }
  };

  if (isLoading || authLoading) {
    return (
        <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8">
            <div className="flex justify-between items-center mb-8">
                <div><Skeleton className="h-10 w-72 mb-2" /><Skeleton className="h-6 w-96" /></div>
                <Skeleton className="h-10 w-48" />
            </div>
            <Card className="shadow-lg">
                <CardHeader><Skeleton className="h-8 w-48 mb-2" /><Skeleton className="h-5 w-64" /></CardHeader>
                <CardContent><div className="space-y-4">{[...Array(3)].map((_, i) => (<div key={i} className="grid grid-cols-4 gap-4 items-center"><Skeleton className="h-10 w-10" /><Skeleton className="h-6 w-full" /><Skeleton className="h-6 w-full" /><Skeleton className="h-8 w-full" /></div>))}</div></CardContent>
            </Card>
        </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground">Service Categories</h1>
          <p className="text-lg text-muted-foreground">Organize your services by creating and managing categories.</p>
        </div>
        <Button onClick={openAddDialog} disabled={isSubmitting}>
          <PlusCircle className="mr-2 h-5 w-5" /> Add New Category
        </Button>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>All Categories</CardTitle>
          <CardDescription>List of all your service categories. Current count: {categories.length}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Image</TableHead>
                <TableHead>Category Name</TableHead>
                <TableHead>Category ID</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell>
                    {category.image ? (
                      <Image src={category.image} alt={category.nom} width={50} height={50} className="rounded-md object-cover aspect-square" data-ai-hint={category['data-ai-hint'] || 'category icon'} />
                    ) : (
                      <div className="w-[50px] h-[50px] bg-muted rounded-md flex items-center justify-center">
                        <ImageIcon className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium flex items-center">
                    <ListChecks className="mr-2 h-5 w-5 text-primary invisible md:visible" />
                    {category.nom}
                  </TableCell>
                  <TableCell>{category.id}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="icon" onClick={() => openEditDialog(category)} title="Edit Category" disabled={isSubmitting}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="destructive" size="icon" onClick={() => handleDeleteCategory(category.id, category.nom)} title="Delete Category" disabled={isSubmitting}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
           {categories.length === 0 && <p className="p-4 text-center text-muted-foreground">No service categories added yet.</p>}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={(open) => {if(!isSubmitting) setIsDialogOpen(open)}}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingCategory ? 'Edit Category' : 'Add New Category'}</DialogTitle>
            <DialogDescription>
              {editingCategory ? 'Modify the details for this category.' : 'Enter details for the new service category.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="nom" className="text-right">Name</Label>
              <Input
                id="nom"
                name="nom"
                value={currentCategoryData.nom}
                onChange={handleInputChange}
                className="col-span-3"
                placeholder="e.g., Food Menu, Spa Services"
                disabled={isSubmitting}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="image" className="text-right">Image URL</Label>
              <Input
                id="image"
                name="image"
                value={currentCategoryData.image || ''}
                onChange={handleInputChange}
                className="col-span-3"
                placeholder="https://placehold.co/300x200.png"
                disabled={isSubmitting}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>Cancel</Button>
            <Button onClick={handleSubmitCategory} disabled={isSubmitting}>
                {isSubmitting ? (editingCategory ? 'Saving...' : 'Creating...') : (editingCategory ? 'Save Changes' : 'Create Category')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
