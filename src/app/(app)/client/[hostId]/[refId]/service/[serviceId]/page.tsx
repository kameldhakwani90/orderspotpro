
"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getServiceById, getFormById, getFormFields, addOrder, getHostById, getRoomOrTableById } from '@/lib/data';
import type { Service, CustomForm, FormField as FormFieldType, Host, RoomOrTable } from '@/lib/types';
import { DynamicFormRenderer } from '@/components/shared/DynamicFormRenderer';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, CheckCircle, Utensils, BedDouble } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

export default function ClientOrderServicePage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();

  const hostId = params.hostId as string;
  const refId = params.refId as string; // RoomOrTable ID
  const serviceId = params.serviceId as string;

  const [service, setService] = useState<Service | null>(null);
  const [customForm, setCustomForm] = useState<CustomForm | null>(null);
  const [formFields, setFormFields] = useState<FormFieldType[]>([]);
  const [hostInfo, setHostInfo] = useState<Host | null>(null);
  const [locationInfo, setLocationInfo] = useState<RoomOrTable | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderSuccess, setOrderSuccess] = useState(false);

  useEffect(() => {
    if (hostId && refId && serviceId) {
      const fetchData = async () => {
        setIsLoading(true);
        setError(null);
        setOrderSuccess(false);
        try {
          const [serviceData, hostData, locationData] = await Promise.all([
            getServiceById(serviceId),
            getHostById(hostId),
            getRoomOrTableById(refId),
          ]);

          if (!serviceData) {
            setError("Service not found.");
            setIsLoading(false);
            return;
          }
          if (serviceData.hostId !== hostId) {
            setError("Service not available for this establishment.");
            setIsLoading(false);
            return;
          }
          if (!hostData) {
            setError(`Establishment with ID ${hostId} not found.`);
            setIsLoading(false);
            return;
          }
          if (!locationData || locationData.hostId !== hostId || locationData.id !== refId) {
            setError(`Location with ID ${refId} not found or invalid for this establishment.`);
            setIsLoading(false);
            return;
          }

          setService(serviceData);
          setHostInfo(hostData);
          setLocationInfo(locationData);

          if (serviceData.formulaireId) {
            const formDetails = await getFormById(serviceData.formulaireId);
            if (formDetails && formDetails.hostId === hostId) {
              setCustomForm(formDetails);
              try {
                const fields = await getFormFields(formDetails.id);
                setFormFields(fields);
              } catch (fieldsError) {
                 console.error(`Failed to load fields for form ${formDetails.id}:`, fieldsError);
                 setError(`Error loading form fields for this service. Please try again.`);
                 setIsLoading(false);
                 return;
              }
            } else {
              console.warn(`Form ${serviceData.formulaireId} (for service ${serviceData.id}) not found or invalid for host ${hostId}`);
              setError(`The information form required for this service is currently unavailable. Please contact support.`);
              setIsLoading(false);
              return;
            }
          } else {
             setCustomForm(null); // No form associated, proceed
             setFormFields([]);
          }
        } catch (e) {
          console.error("Failed to fetch service/form data:", e);
          setError("Failed to load service details. Please try again later.");
        }
        setIsLoading(false);
      };
      fetchData();
    }
  }, [hostId, refId, serviceId]);

  const handleFormSubmit = async (formData: Record<string, any>) => {
    if (!service || !hostId || !refId) return;

    setIsSubmitting(true);
    try {
      await addOrder({
        serviceId: service.id,
        hostId: hostId,
        chambreTableId: refId,
        donneesFormulaire: JSON.stringify(formData),
        // clientNom can be added if there's a client login system
      });
      setOrderSuccess(true);
      toast({
        title: "Order Submitted!",
        description: `Your request for ${service.titre} has been sent.`,
      });
    } catch (e) {
      console.error("Failed to submit order:", e);
      toast({
        title: "Order Submission Failed",
        description: "There was an error submitting your order. Please try again.",
        variant: "destructive",
      });
    }
    setIsSubmitting(false);
  };
  
  const handleDirectOrder = async () => {
    if (!service || !hostId || !refId) return;
    setIsSubmitting(true);
    try {
      await addOrder({
        serviceId: service.id,
        hostId: hostId,
        chambreTableId: refId,
        donneesFormulaire: JSON.stringify({ directOrder: true }),
      });
      setOrderSuccess(true);
      toast({
        title: "Order Submitted!",
        description: `Your request for ${service.titre} has been sent.`,
      });
    } catch (e) {
      console.error("Failed to submit direct order:", e);
       toast({
        title: "Order Submission Failed",
        description: "There was an error submitting your order. Please try again.",
        variant: "destructive",
      });
    }
    setIsSubmitting(false);
  };


  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Skeleton className="h-8 w-3/4 mb-2" />
        <Skeleton className="h-4 w-1/2 mb-6" />
        <Skeleton className="h-48 w-full md:w-1/2 mb-4" />
        <Skeleton className="h-64 w-full md:w-1/2" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <AlertTriangle className="mx-auto h-16 w-16 text-destructive mb-4" />
        <h1 className="text-2xl font-semibold text-destructive mb-2">Error</h1>
        <p className="text-muted-foreground">{error}</p>
        <Button onClick={() => router.back()} className="mt-4">Go Back</Button>
      </div>
    );
  }

  if (orderSuccess) {
    return (
      <div className="container mx-auto py-16 px-4 text-center">
        <CheckCircle className="mx-auto h-20 w-20 text-green-500 mb-6" />
        <h1 className="text-3xl font-bold text-foreground mb-3">Order Successful!</h1>
        <p className="text-lg text-muted-foreground mb-6">
          Your request for <span className="font-semibold text-primary">{service?.titre}</span> has been submitted.
        </p>
        <p className="text-sm text-muted-foreground mb-8">You will be contacted shortly if confirmation is needed. Thank you!</p>
        <Button onClick={() => router.push(`/client/${hostId}/${refId}`)} size="lg">
          Back to Services
        </Button>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <p className="text-muted-foreground">Service details not found.</p>
      </div>
    );
  }
  
  const LocationIcon = locationInfo?.type === 'Chambre' ? BedDouble : Utensils;
  const serviceImageAiHint = (service as any)['data-ai-hint'] || service.titre.toLowerCase().split(' ').slice(0,2).join(' ') || 'service detail';

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8 p-6 bg-card rounded-lg shadow-md">
            <div className="flex items-center mb-2 text-sm text-muted-foreground">
                <LocationIcon className="h-5 w-5 mr-2 text-primary"/>
                <span>{hostInfo?.nom} - {locationInfo?.type} {locationInfo?.nom}</span>
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">{service.titre}</h1>
            {service.image && (
              <div className="relative w-full h-64 rounded-md overflow-hidden my-4">
                <Image src={service.image} alt={service.titre} layout="fill" objectFit="cover" data-ai-hint={serviceImageAiHint} />
              </div>
            )}
            <p className="text-muted-foreground mb-4">{service.description}</p>
            {service.prix && (
              <p className="text-2xl font-semibold text-primary mb-6">Price: ${service.prix.toFixed(2)}</p>
            )}
        </div>

        {(customForm && formFields.length > 0) ? (
          <DynamicFormRenderer
            formName={`Order: ${service.titre}`}
            formDescription={customForm.nom}
            fields={formFields}
            onSubmit={handleFormSubmit}
            isLoading={isSubmitting}
            submitButtonText={service.prix ? `Order for $${service.prix.toFixed(2)}` : "Submit Request"}
          />
        ) : (
          // If no form, provide a direct order button or a message
          <div className="text-center p-6 bg-card rounded-lg shadow-md">
            <p className="text-muted-foreground mb-4">This service does not require additional information.</p>
            <Button onClick={handleDirectOrder} disabled={isSubmitting} size="lg">
              {isSubmitting ? 'Processing...' : (service.prix ? `Confirm Order for $${service.prix.toFixed(2)}` : "Confirm Request")}
            </Button>
          </div>
        )}
         <Button variant="outline" onClick={() => router.back()} className="mt-8 w-full max-w-lg mx-auto block">
          Cancel & Go Back
        </Button>
      </div>
    </div>
  );
}
