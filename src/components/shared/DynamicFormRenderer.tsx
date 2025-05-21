
"use client";

import React, { useImperativeHandle } from 'react';
import type { FormField as FormFieldType } from '@/lib/types'; // Renamed FormField to FormFieldType
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
// Button is removed as it's no longer rendered here
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

interface DynamicFormRendererProps {
  formName: string;
  formDescription?: string;
  fields: FormFieldType[];
  onSubmit: (data: Record<string, any>) => void;
  // isLoading prop is no longer needed here as the button is external
  // submitButtonText prop is removed
  formId?: string; // Optional: if we need to link an external button via form attribute
}

// Define the type for the ref methods
export interface DynamicFormRendererRef {
  submit: () => void;
}

export const DynamicFormRenderer = React.forwardRef<DynamicFormRendererRef, DynamicFormRendererProps>(({
  formName,
  formDescription,
  fields,
  onSubmit,
  formId,
}, ref) => {

  const generateSchema = () => {
    const schemaFields: Record<string, z.ZodTypeAny> = {};
    fields.forEach(field => {
      let fieldSchema: z.ZodTypeAny;
      switch (field.type) {
        case 'text':
        case 'textarea':
          fieldSchema = z.string();
          if (field.obligatoire) fieldSchema = fieldSchema.min(1, `${field.label} is required`);
          else fieldSchema = fieldSchema.optional().or(z.literal('')); // Allow empty string if not required
          break;
        case 'email':
          fieldSchema = z.string().email({ message: "Invalid email address" });
          if (field.obligatoire) fieldSchema = fieldSchema.min(1, `${field.label} is required`);
          else fieldSchema = fieldSchema.optional().or(z.literal(''));
          break;
        case 'tel':
          // Relaxed regex for broader phone number compatibility
          fieldSchema = z.string().regex(/^[\d\s()+-]*$/, "Invalid phone number format");
           if (field.obligatoire) fieldSchema = fieldSchema.min(1, `${field.label} is required`);
          else fieldSchema = fieldSchema.optional().or(z.literal(''));
          break;
        case 'number':
          fieldSchema = z.preprocess(
            (val) => (val === "" || val === null || val === undefined ? undefined : Number(val)),
            field.obligatoire ? z.number({ required_error: `${field.label} is required.` }) : z.number().optional()
          );
          break;
        case 'date':
        case 'time':
          fieldSchema = z.string();
          if (field.obligatoire) fieldSchema = fieldSchema.min(1, `${field.label} is required`);
          else fieldSchema = fieldSchema.optional().or(z.literal(''));
          break;
        default:
          fieldSchema = z.any();
      }
      schemaFields[field.id] = fieldSchema;
    });
    return z.object(schemaFields);
  };

  const formSchema = generateSchema();
  type FormData = z.infer<typeof formSchema>;

  const { control, handleSubmit: RHFhandleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: fields.reduce((acc, field) => {
        acc[field.id] = ''; // Initialize with empty strings
        return acc;
    }, {} as Record<string, any>),
  });

  const processSubmit: SubmitHandler<FormData> = (data) => {
    onSubmit(data);
  };

  // Expose the submit function via ref
  useImperativeHandle(ref, () => ({
    submit: () => {
      RHFhandleSubmit(processSubmit)();
    }
  }));

  return (
    <Card className="w-full max-w-lg mx-auto shadow-md border-none">
      <CardHeader className="px-1 py-3">
        <CardTitle className="text-lg">{formName}</CardTitle>
        {formDescription && <CardDescription className="text-sm">{formDescription}</CardDescription>}
      </CardHeader>
      <CardContent className="px-1 pb-1">
        {/* The form tag is still necessary for react-hook-form to associate fields */}
        <form onSubmit={RHFhandleSubmit(processSubmit)} id={formId} className="space-y-4">
          {fields.sort((a, b) => a.ordre - b.ordre).map((field) => (
            <div key={field.id} className="space-y-1.5">
              <Label htmlFor={field.id} className="font-medium text-sm">
                {field.label}
                {field.obligatoire && <span className="text-destructive ml-1">*</span>}
              </Label>
              <Controller
                name={field.id as keyof FormData}
                control={control}
                render={({ field: controllerField }) => {
                  // Ensure value is never null/undefined for controlled inputs
                  const value = controllerField.value === null || controllerField.value === undefined ? '' : controllerField.value;
                  switch (field.type) {
                    case 'textarea':
                      return <Textarea id={field.id} placeholder={field.placeholder} {...controllerField} value={value} />;
                    case 'number':
                      return <Input id={field.id} type="number" placeholder={field.placeholder} {...controllerField} value={value} />;
                    default: // text, email, date, time, tel
                      return <Input id={field.id} type={field.type} placeholder={field.placeholder} {...controllerField} value={value} />;
                  }
                }}
              />
              {errors[field.id] && (
                <p className="text-xs text-destructive mt-1">{errors[field.id]?.message as string}</p>
              )}
            </div>
          ))}
          {/* Submit button is removed from here */}
        </form>
      </CardContent>
    </Card>
  );
});

DynamicFormRenderer.displayName = 'DynamicFormRenderer';
