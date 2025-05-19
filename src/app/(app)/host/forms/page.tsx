
"use client";

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import {
  getCustomForms, addCustomForm, updateCustomForm, deleteCustomForm,
  getFormFields, addFormField, updateFormField, deleteFormField
} from '@/lib/data';
import type { CustomForm, FormField, FormFieldTypeOption } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { PlusCircle, Edit2, Trash2, FileText, ListOrdered, Type, ToggleLeft, MessageSquare } from 'lucide-react';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

const formFieldTypes: FormFieldTypeOption[] = ["text", "textarea", "number", "email", "tel", "date", "time"];

export default function HostFormsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [forms, setForms] = useState<CustomForm[]>([]);
  const [selectedForm, setSelectedForm] = useState<CustomForm | null>(null);
  const [fieldsForSelectedForm, setFieldsForSelectedForm] = useState<FormField[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [isFieldDialogOpen, setIsFieldDialogOpen] = useState(false);

  const [editingForm, setEditingForm] = useState<Partial<CustomForm> | null>(null);
  const [currentFormName, setCurrentFormName] = useState('');

  const [editingField, setEditingField] = useState<Partial<FormField> | null>(null);
  const [currentFieldData, setCurrentFieldData] = useState<Partial<FormField>>({
    label: '', type: 'text', obligatoire: false, ordre: 1, placeholder: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);


  const fetchData = useCallback(async (hostId: string) => {
    setIsLoading(true);
    try {
      const formsData = await getCustomForms(hostId);
      setForms(formsData);
      if (formsData.length > 0 && !selectedForm) {
        // No, don't auto-select. Let user click.
      } else if (formsData.length === 0) {
        setSelectedForm(null);
        setFieldsForSelectedForm([]);
      }
    } catch (error) {
      console.error("Failed to load forms:", error);
      toast({ title: "Error", description: "Could not load forms. Please try again.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast, selectedForm]);

  const fetchFieldsForForm = useCallback(async (formId: string) => {
    setIsLoading(true); // Or a separate loading state for fields
    try {
      const fieldsData = await getFormFields(formId);
      setFieldsForSelectedForm(fieldsData);
    } catch (error) {
      console.error(`Failed to load fields for form ${formId}:`, error);
      toast({ title: "Error", description: `Could not load fields. Please try again.`, variant: "destructive" });
      setFieldsForSelectedForm([]);
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

  useEffect(() => {
    if (selectedForm?.id) {
      fetchFieldsForForm(selectedForm.id);
    } else {
      setFieldsForSelectedForm([]);
    }
  }, [selectedForm, fetchFieldsForForm]);

  // Form CRUD
  const handleFormInputChange = (e: React.ChangeEvent<HTMLInputElement>) => setCurrentFormName(e.target.value);

  const handleSubmitForm = async () => {
    if (!user?.hostId || !currentFormName.trim()) {
      toast({ title: "Validation Error", description: "Form name cannot be empty.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      if (editingForm && editingForm.id) {
        await updateCustomForm(editingForm.id, { nom: currentFormName.trim() });
        toast({ title: "Form Updated" });
        if(selectedForm?.id === editingForm.id) {
            setSelectedForm(prev => prev ? {...prev, nom: currentFormName.trim()} : null);
        }
      } else {
        await addCustomForm({ nom: currentFormName.trim(), hostId: user.hostId });
        toast({ title: "Form Created" });
      }
      fetchData(user.hostId);
    } catch (error) {
      toast({ title: "Error", description: `Could not save form. ${error}`, variant: "destructive" });
    }
    setIsFormDialogOpen(false);
    setCurrentFormName('');
    setEditingForm(null);
    setIsSubmitting(false);
  };

  const openAddFormDialog = () => { setEditingForm(null); setCurrentFormName(''); setIsFormDialogOpen(true); };
  const openEditFormDialog = (form: CustomForm) => { setEditingForm(form); setCurrentFormName(form.nom); setIsFormDialogOpen(true); };

  const handleDeleteForm = async (form: CustomForm) => {
    if (!user?.hostId || !window.confirm(`Delete form "${form.nom}"? This will remove all its fields and unassign it from services.`)) return;
    setIsSubmitting(true);
    try {
      await deleteCustomForm(form.id);
      toast({ title: "Form Deleted", variant: "destructive" });
      fetchData(user.hostId);
      if (selectedForm?.id === form.id) setSelectedForm(null);
    } catch (error) {
      toast({ title: "Error", description: `Could not delete form. ${error}`, variant: "destructive" });
    }
    setIsSubmitting(false);
  };

  // Field CRUD
  const handleFieldInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentFieldData(prev => ({ ...prev, [name]: value }));
  };
  const handleFieldSelectChange = (name: string, value: string | boolean) => {
    setCurrentFieldData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmitField = async () => {
    if (!selectedForm?.id || !currentFieldData.label?.trim()) {
      toast({ title: "Validation Error", description: "Field label cannot be empty.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    const dataToSubmit: Partial<Omit<FormField, 'id'>> = {
      ...currentFieldData,
      formulaireId: selectedForm.id,
      ordre: Number(currentFieldData.ordre) || fieldsForSelectedForm.length + 1,
    };

    try {
      if (editingField && editingField.id) {
        await updateFormField(editingField.id, dataToSubmit);
        toast({ title: "Field Updated" });
      } else {
        await addFormField(dataToSubmit as Omit<FormField, 'id'>);
        toast({ title: "Field Added" });
      }
      fetchFieldsForForm(selectedForm.id);
    } catch (error) {
      toast({ title: "Error", description: `Could not save field. ${error}`, variant: "destructive" });
    }
    setIsFieldDialogOpen(false);
    setEditingField(null);
    setCurrentFieldData({ label: '', type: 'text', obligatoire: false, ordre: fieldsForSelectedForm.length + 2, placeholder: '' });
    setIsSubmitting(false);
  };

  const openAddFieldDialog = () => {
    if (!selectedForm) return;
    setEditingField(null);
    setCurrentFieldData({ label: '', type: 'text', obligatoire: false, ordre: fieldsForSelectedForm.length + 1, placeholder: '' });
    setIsFieldDialogOpen(true);
  };
  const openEditFieldDialog = (field: FormField) => {
    setEditingField(field);
    setCurrentFieldData({...field});
    setIsFieldDialogOpen(true);
  };
  const handleDeleteField = async (field: FormField) => {
    if (!selectedForm?.id || !window.confirm(`Delete field "${field.label}"?`)) return;
    setIsSubmitting(true);
    try {
      await deleteFormField(field.id);
      toast({ title: "Field Deleted", variant: "destructive" });
      fetchFieldsForForm(selectedForm.id);
    } catch (error) {
      toast({ title: "Error", description: `Could not delete field. ${error}`, variant: "destructive" });
    }
    setIsSubmitting(false);
  };


  if (isLoading || authLoading) {
    return (
      <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div><Skeleton className="h-10 w-72 mb-2" /><Skeleton className="h-6 w-96" /></div>
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="md:col-span-1"><CardHeader><Skeleton className="h-8 w-48 mb-2" /></CardHeader><CardContent><Skeleton className="h-32 w-full" /></CardContent></Card>
          <Card className="md:col-span-2"><CardHeader><Skeleton className="h-8 w-48 mb-2" /></CardHeader><CardContent><Skeleton className="h-64 w-full" /></CardContent></Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground">Custom Forms</h1>
          <p className="text-lg text-muted-foreground">Manage forms to collect specific information for your services.</p>
        </div>
        <Button onClick={openAddFormDialog} disabled={isSubmitting}><PlusCircle className="mr-2 h-5 w-5" /> Add New Form</Button>
      </div>

      <div className="grid md:grid-cols-3 gap-6 items-start">
        <Card className="md:col-span-1 shadow-lg sticky top-20">
          <CardHeader>
            <CardTitle>All Forms</CardTitle>
            <CardDescription>Select a form to manage its fields. ({forms.length})</CardDescription>
          </CardHeader>
          <CardContent>
            {forms.length === 0 && <p className="text-muted-foreground text-center py-4">No forms created yet.</p>}
            <ul className="space-y-2">
              {forms.map(form => (
                <li key={form.id}>
                  <Button
                    variant={selectedForm?.id === form.id ? "secondary" : "ghost"}
                    className="w-full justify-start text-left h-auto py-2"
                    onClick={() => setSelectedForm(form)}
                    disabled={isSubmitting}
                  >
                    <div className="flex-1">
                      <p className="font-medium">{form.nom}</p>
                      <p className="text-xs text-muted-foreground">ID: {form.id}</p>
                    </div>
                    <div className="space-x-1">
                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); openEditFormDialog(form);}} title="Edit Form Name" disabled={isSubmitting}><Edit2 className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleDeleteForm(form);}} title="Delete Form" disabled={isSubmitting}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </Button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 shadow-lg">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>{selectedForm ? `Fields for: ${selectedForm.nom}` : "Select a Form"}</CardTitle>
                <CardDescription>{selectedForm ? "Manage fields for the selected form." : "Choose a form from the list to see its fields."}</CardDescription>
              </div>
              {selectedForm && <Button onClick={openAddFieldDialog} disabled={!selectedForm || isSubmitting}><PlusCircle className="mr-2 h-5 w-5" /> Add Field</Button>}
            </div>
          </CardHeader>
          <CardContent>
            {!selectedForm && <p className="text-muted-foreground text-center py-10">No form selected.</p>}
            {selectedForm && fieldsForSelectedForm.length === 0 && <p className="text-muted-foreground text-center py-10">This form has no fields yet. Click "Add Field" to start.</p>}
            {selectedForm && fieldsForSelectedForm.length > 0 && (
              <Table>
                <TableHeader><TableRow><TableHead>Order</TableHead><TableHead>Label</TableHead><TableHead>Type</TableHead><TableHead>Required</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                  {fieldsForSelectedForm.map(field => (
                    <TableRow key={field.id}>
                      <TableCell><Badge variant="outline">{field.ordre}</Badge></TableCell>
                      <TableCell className="font-medium">{field.label}</TableCell>
                      <TableCell><Badge>{field.type}</Badge></TableCell>
                      <TableCell>{field.obligatoire ? "Yes" : "No"}</TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button variant="outline" size="icon" onClick={() => openEditFieldDialog(field)} title="Edit Field" disabled={isSubmitting}><Edit2 className="h-4 w-4" /></Button>
                        <Button variant="destructive" size="icon" onClick={() => handleDeleteField(field)} title="Delete Field" disabled={isSubmitting}><Trash2 className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Form Dialog */}
      <Dialog open={isFormDialogOpen} onOpenChange={(open) => {if(!isSubmitting) setIsFormDialogOpen(open)}}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingForm ? 'Edit Form' : 'Add New Form'}</DialogTitle></DialogHeader>
          <div className="py-4">
            <Label htmlFor="formName">Form Name</Label>
            <Input id="formName" value={currentFormName} onChange={handleFormInputChange} placeholder="e.g., Booking Details" disabled={isSubmitting} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormDialogOpen(false)} disabled={isSubmitting}>Cancel</Button>
            <Button onClick={handleSubmitForm} disabled={isSubmitting}>{isSubmitting ? "Saving..." : (editingForm ? 'Save Changes' : 'Create Form')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Field Dialog */}
      <Dialog open={isFieldDialogOpen} onOpenChange={(open) => {if(!isSubmitting) setIsFieldDialogOpen(open)}}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>{editingField ? 'Edit Field' : 'Add New Field'}</DialogTitle><DialogDescription>For form: {selectedForm?.nom}</DialogDescription></DialogHeader>
          <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
            <div className="space-y-1.5">
              <Label htmlFor="fieldLabel"><FileText className="inline mr-1 h-4 w-4" />Label</Label>
              <Input id="fieldLabel" name="label" value={currentFieldData.label || ''} onChange={handleFieldInputChange} placeholder="e.g., Number of Guests" disabled={isSubmitting} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fieldType"><Type className="inline mr-1 h-4 w-4" />Type</Label>
              <Select value={currentFieldData.type || 'text'} onValueChange={(val) => handleFieldSelectChange('type', val as FormFieldTypeOption)} disabled={isSubmitting}>
                <SelectTrigger id="fieldType"><SelectValue /></SelectTrigger>
                <SelectContent>{formFieldTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fieldPlaceholder"><MessageSquare className="inline mr-1 h-4 w-4" />Placeholder (Optional)</Label>
              <Input id="fieldPlaceholder" name="placeholder" value={currentFieldData.placeholder || ''} onChange={handleFieldInputChange} placeholder="e.g., Enter your name" disabled={isSubmitting} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fieldOrder"><ListOrdered className="inline mr-1 h-4 w-4" />Order</Label>
              <Input id="fieldOrder" name="ordre" type="number" value={currentFieldData.ordre || ''} onChange={handleFieldInputChange} placeholder="e.g., 1" min="1" disabled={isSubmitting} />
            </div>
            <div className="flex items-center space-x-2 pt-2">
              <Checkbox id="fieldObligatoire" name="obligatoire" checked={currentFieldData.obligatoire || false} onCheckedChange={(checked) => handleFieldSelectChange('obligatoire', !!checked)} disabled={isSubmitting} />
              <Label htmlFor="fieldObligatoire" className="font-normal"><ToggleLeft className="inline mr-1 h-4 w-4" />Required Field</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFieldDialogOpen(false)} disabled={isSubmitting}>Cancel</Button>
            <Button onClick={handleSubmitField} disabled={isSubmitting}>{isSubmitting ? "Saving..." : (editingField ? 'Save Changes' : 'Add Field')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
