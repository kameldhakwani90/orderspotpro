
"use client";

import React from 'react';
import type { FormField, FormFieldType } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

interface DynamicFormRendererProps {
  formName: string;
  formDescription?: string;
  fields: FormField[];
  onSubmit: (data: Record<string, any>) => void;
  isLoading?: boolean;
  submitButtonText?: string;
}

export function DynamicFormRenderer({
  formName,
  formDescription,
  fields,
  onSubmit,
  isLoading = false,
  submitButtonText = "Submit"
}: DynamicFormRendererProps) {

  const generateSchema = () => {
    const schemaFields: Record<string, z.ZodTypeAny> = {};
    fields.forEach(field => {
      let fieldSchema: z.ZodTypeAny;
      switch (field.type) {
        case 'text':
        case 'textarea':
          fieldSchema = z.string();
          if (field.obligatoire) fieldSchema = fieldSchema.min(1, `${field.label} is required`);
          else fieldSchema = fieldSchema.optional();
          break;
        case 'email':
          fieldSchema = z.string().email({ message: "Invalid email address" });
          if (field.obligatoire) fieldSchema = fieldSchema.min(1, `${field.label} is required`);
          else fieldSchema = fieldSchema.optional();
          break;
        case 'tel':
          fieldSchema = z.string().regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number");
           if (field.obligatoire) fieldSchema = fieldSchema.min(1, `${field.label} is required`);
          else fieldSchema = fieldSchema.optional();
          break;
        case 'number':
          fieldSchema = z.preprocess(
            (val) => (val === "" ? undefined : Number(val)),
            field.obligatoire ? z.number({ required_error: `${field.label} is required.` }).min(0) : z.number().min(0).optional()
          );
          break;
        case 'date':
        case 'time':
          fieldSchema = z.string();
          if (field.obligatoire) fieldSchema = fieldSchema.min(1, `${field.label} is required`);
          else fieldSchema = fieldSchema.optional();
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

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: fields.reduce((acc, field) => {
        acc[field.id] = ''; // Initialize with empty strings or appropriate defaults
        return acc;
    }, {} as Record<string, any>),
  });

  const processSubmit: SubmitHandler<FormData> = (data) => {
    onSubmit(data);
  };

  return (
    <Card className="w-full max-w-lg mx-auto shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl">{formName}</CardTitle>
        {formDescription && <CardDescription>{formDescription}</CardDescription>}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(processSubmit)} className="space-y-6">
          {fields.sort((a, b) => a.ordre - b.ordre).map((field) => (
            <div key={field.id} className="space-y-2">
              <Label htmlFor={field.id} className="font-medium">
                {field.label}
                {field.obligatoire && <span className="text-destructive ml-1">*</span>}
              </Label>
              <Controller
                name={field.id as keyof FormData}
                control={control}
                render={({ field: controllerField }) => {
                  switch (field.type) {
                    case 'textarea':
                      return <Textarea id={field.id} placeholder={field.placeholder} {...controllerField} />;
                    case 'number':
                      return <Input id={field.id} type="number" placeholder={field.placeholder} {...controllerField} value={controllerField.value === undefined ? '' : controllerField.value} />;
                    default: // text, email, date, time, tel
                      return <Input id={field.id} type={field.type} placeholder={field.placeholder} {...controllerField} />;
                  }
                }}
              />
              {errors[field.id] && (
                <p className="text-sm text-destructive mt-1">{errors[field.id]?.message as string}</p>
              )}
            </div>
          ))}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Submitting...' : submitButtonText}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
