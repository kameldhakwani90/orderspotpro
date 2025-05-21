
"use client";

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { getTags, addTag, updateTag, deleteTag } from '@/lib/data';
import type { Tag } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Edit2, Trash2, Tag as TagIcon } from 'lucide-react';
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

export default function HostTagsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Partial<Tag> | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [currentTagName, setCurrentTagName] = useState<string>('');

  const fetchData = useCallback(async (hostId: string) => {
    setIsLoading(true);
    try {
      const tagsData = await getTags(hostId);
      setTags(tagsData);
    } catch (error) {
      console.error("Failed to load tags:", error);
      toast({ title: "Error", description: "Could not load tags. Please try again.", variant: "destructive" });
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
    setCurrentTagName(e.target.value);
  };

  const handleSubmitTag = async () => {
    if (!user?.hostId || !currentTagName.trim()) {
      toast({ title: "Validation Error", description: "Tag name cannot be empty.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);

    try {
      if (editingTag && editingTag.id) {
        await updateTag(editingTag.id, { name: currentTagName.trim() });
        toast({ title: "Tag Updated", description: `Tag "${currentTagName.trim()}" has been updated.` });
      } else {
        await addTag({ name: currentTagName.trim(), hostId: user.hostId });
        toast({ title: "Tag Created", description: `Tag "${currentTagName.trim()}" has been added.` });
      }
      fetchData(user.hostId);
    } catch (error) {
      console.error("Failed to save tag:", error);
      toast({ title: "Error", description: `Could not save tag. ${error instanceof Error ? error.message : ''}`, variant: "destructive" });
    } finally {
      setIsDialogOpen(false);
      setCurrentTagName('');
      setEditingTag(null);
      setIsSubmitting(false);
    }
  };

  const openAddDialog = () => {
    setEditingTag(null);
    setCurrentTagName('');
    setIsDialogOpen(true);
  };

  const openEditDialog = (tagToEdit: Tag) => {
    setEditingTag(tagToEdit);
    setCurrentTagName(tagToEdit.name);
    setIsDialogOpen(true);
  };

  const handleDeleteTag = async (tagId: string, tagName: string) => {
    if (!user?.hostId) return;
    if (!window.confirm(`Are you sure you want to delete tag "${tagName}"? It will be removed from all associated locations.`)) {
        return;
    }
    setIsSubmitting(true);
    try {
        await deleteTag(tagId);
        toast({ title: "Tag Deleted", description: `Tag "${tagName}" has been deleted.`, variant: "destructive" });
        fetchData(user.hostId); // Refresh tags list
        // Potentially refresh locations page if it's open and displayed, or rely on next visit
    } catch (error) {
        console.error("Failed to delete tag:", error);
        toast({ title: "Error", description: `Could not delete tag. ${error instanceof Error ? error.message : ''}`, variant: "destructive" });
    } finally {
        setIsSubmitting(false);
    }
  };

  if (isLoading || authLoading) {
    return (
        <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8">
            <div className="flex justify-between items-center mb-8">
                <div><Skeleton className="h-10 w-72 mb-2" /><Skeleton className="h-6 w-96" /></div>
                <Skeleton className="h-10 w-36" />
            </div>
            <Card className="shadow-lg">
                <CardHeader><Skeleton className="h-8 w-48 mb-2" /><Skeleton className="h-5 w-64" /></CardHeader>
                <CardContent><div className="space-y-4">{[...Array(3)].map((_, i) => (<div key={i} className="grid grid-cols-3 gap-4 items-center"><Skeleton className="h-6 w-full" /><Skeleton className="h-6 w-full" /><Skeleton className="h-8 w-full" /></div>))}</div></CardContent>
            </Card>
        </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground">Manage Tags</h1>
          <p className="text-lg text-muted-foreground">Create and manage tags to categorize your locations (rooms, tables, areas).</p>
        </div>
        <Button onClick={openAddDialog} disabled={isSubmitting}>
          <PlusCircle className="mr-2 h-5 w-5" /> Add New Tag
        </Button>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>All Tags</CardTitle>
          <CardDescription>List of all your tags. Current count: {tags.length}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tag Name</TableHead>
                <TableHead>Tag ID</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tags.map((tag) => (
                <TableRow key={tag.id}>
                  <TableCell className="font-medium flex items-center">
                    <TagIcon className="mr-2 h-5 w-5 text-primary" />
                    {tag.name}
                  </TableCell>
                  <TableCell>{tag.id}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="icon" onClick={() => openEditDialog(tag)} title="Edit Tag" disabled={isSubmitting}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="destructive" size="icon" onClick={() => handleDeleteTag(tag.id, tag.name)} title="Delete Tag" disabled={isSubmitting}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
           {tags.length === 0 && <p className="p-4 text-center text-muted-foreground">No tags created yet.</p>}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={(open) => {if(!isSubmitting) setIsDialogOpen(open)}}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingTag ? 'Edit Tag' : 'Add New Tag'}</DialogTitle>
            <DialogDescription>
              {editingTag ? 'Modify the name for this tag.' : 'Enter the name for the new tag.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="tagName" className="text-right">Tag Name</Label>
              <Input
                id="tagName"
                name="tagName"
                value={currentTagName}
                onChange={handleInputChange}
                className="col-span-3"
                placeholder="e.g., Vue Mer, VIP, Calme"
                disabled={isSubmitting}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>Cancel</Button>
            <Button onClick={handleSubmitTag} disabled={isSubmitting || !currentTagName.trim()}>
                {isSubmitting ? (editingTag ? 'Saving...' : 'Creating...') : (editingTag ? 'Save Changes' : 'Create Tag')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
