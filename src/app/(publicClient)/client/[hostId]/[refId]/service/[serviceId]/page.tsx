
"use client";

import React, { useEffect, useState, useRef } from 'react'; // Added useRef
import { useParams, useRouter, usePathname } from 'next/navigation';
import { getServiceById, getFormById, getFormFields, addOrder, getHostById, getRoomOrTableById } from '@/lib/data';
import type { Service, CustomForm, FormField as FormFieldType, Host, RoomOrTable } from '@/lib/types';
import { DynamicFormRenderer, type DynamicFormRendererRef } from '@/components/shared/DynamicFormRenderer'; // Import ref type
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, CheckCircle, Utensils, BedDouble, LogIn, Lock } from 'lucide-react'; // Added Lock
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function PublicClientOrderServicePage() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const { user, isLoading: authIsLoading } = useAuth();
  const formRef = useRef<DynamicFormRendererRef>(null); // Ref for DynamicFormRenderer

  const hostId = params.hostId as string;
  const refId = params.refId as string; // RoomOrTable ID
  const serviceId = params.serviceId as string;

  const [service, setService] = useState<Service | null>(null);
  const [customForm, setCustomForm] = useState<CustomForm | null>(null);
  const [formFields, setFormFields] = useState<FormFieldType[]>([]);
  const [hostInfo, setHostInfo] = useState<Host | null>(null);
  const [locationInfo, setLocationInfo] = useState<RoomOrTable | null>(null);

  const [isLoadingPage, setIsLoadingPage] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderSuccess, setOrderSuccess] = useState(false);

  useEffect(() => {
    console.log(`PublicClientOrderServicePage: Effect triggered. hostId: ${hostId}, refId: ${refId}, serviceId: ${serviceId}, authIsLoading: ${authIsLoading}`);
    if (authIsLoading) {
      console.log("PublicClientOrderServicePage: Auth is still loading, deferring data fetch.");
      return;
    }

    if (hostId && refId && serviceId) {
      const fetchData = async () => {
        setIsLoadingPage(true);
        setError(null);
        setOrderSuccess(false);
        console.log("PublicClientOrderServicePage: Starting data fetch...");
        try {
          const [serviceData, hostData, locationData] = await Promise.all([
            getServiceById(serviceId),
            getHostById(hostId),
            getRoomOrTableById(refId),
          ]);
          console.log("PublicClientOrderServicePage: Fetched core data", { serviceData, hostData, locationData });

          if (!serviceData) {
            setError("Service not found.");
            setIsLoadingPage(false); return;
          }
          if (serviceData.hostId !== hostId) {
            setError("Service not available for this establishment.");
            setIsLoadingPage(false); return;
          }
          if (!hostData) {
            setError(`Establishment with ID ${hostId} not found.`);
            setIsLoadingPage(false); return;
          }
          if (!locationData || locationData.hostId !== hostId || locationData.id !== refId) {
            setError(`Location with ID ${refId} not found or invalid for this establishment.`);
            setIsLoadingPage(false); return;
          }

          setService(serviceData);
          setHostInfo(hostData);
          setLocationInfo(locationData);

          if (serviceData.formulaireId) {
            console.log(`PublicClientOrderServicePage: Service has formId: ${serviceData.formulaireId}. Fetching form details.`);
            const formDetails = await getFormById(serviceData.formulaireId);
            console.log("PublicClientOrderServicePage: Fetched form details", { formDetails });
            if (formDetails && formDetails.hostId === hostId) {
              setCustomForm(formDetails);
              const fields = await getFormFields(formDetails.id);
              console.log("PublicClientOrderServicePage: Fetched form fields", { fields });
              setFormFields(fields);
            } else {
              console.warn(`Form ${serviceData.formulaireId} (for service ${serviceData.id}) not found or invalid for host ${hostId}`);
              setError(`The information form required for this service is currently unavailable. Please check service configuration.`);
              setCustomForm(null);
              setFormFields([]);
              // No return here, will fall through to show an error state based on 'error' state variable
            }
          } else {
             console.log("PublicClientOrderServicePage: Service does not have a formId.");
             setCustomForm(null); setFormFields([]);
          }
          console.log("PublicClientOrderServicePage: Data fetch complete.");
        } catch (e: any) {
          console.error("PublicClientOrderServicePage: Failed to fetch service/form data:", e);
          setError(`Failed to load service details. Please try again later or contact support. (Details: ${e.message})`);
        }
        setIsLoadingPage(false);
      };
      fetchData();
    } else {
        console.warn("PublicClientOrderServicePage: hostId, refId, or serviceId is missing.");
        setError("Required information (host, location, or service ID) is missing from the URL.");
        setIsLoadingPage(false);
    }
  }, [hostId, refId, serviceId, authIsLoading]);

  // This is the function called by DynamicFormRenderer's onSubmit
  const handleActualFormSubmit = async (formData: Record<string, any>) => {
    if (!service || !hostId || !refId) return;
    if (service.loginRequired && !user) {
      toast({ title: "Login Required", description: "Please log in to order this service.", variant: "destructive"});
      return;
    }

    setIsSubmitting(true);
    try {
      await addOrder({
        serviceId: service.id,
        hostId: hostId,
        chambreTableId: refId,
        clientNom: user?.nom,
        userId: user?.id,
        donneesFormulaire: JSON.stringify(formData),
        prix: service.prix
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
  
  // This function is for services without a custom form
  const handleDirectOrder = async () => {
    if (!service || !hostId || !refId) return;
     if (service.loginRequired && !user) {
      toast({ title: "Login Required", description: "Please log in to order this service.", variant: "destructive"});
      return;
    }
    setIsSubmitting(true);
    try {
      await addOrder({
        serviceId: service.id,
        hostId: hostId,
        chambreTableId: refId,
        clientNom: user?.nom,
        userId: user?.id,
        donneesFormulaire: JSON.stringify({ directOrder: true }), // Indicate no specific form data
        prix: service.prix
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

  const triggerFormSubmission = () => {
    formRef.current?.submit();
  };


  if (isLoadingPage || authIsLoading) {
    return (
      <div className="space-y-6 max-w-3xl mx-auto p-4">
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-64 w-full rounded-lg" />
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10 max-w-3xl mx-auto p-4">
        <AlertTriangle className="mx-auto h-16 w-16 text-destructive mb-4" />
        <h1 className="text-2xl font-semibold text-destructive mb-2">Error</h1>
        <p className="text-muted-foreground">{error}</p>
        <Button onClick={() => router.back()} className="mt-6">Go Back</Button>
      </div>
    );
  }

  if (orderSuccess) {
    return (
      <div className="text-center py-16 max-w-3xl mx-auto p-4">
        <CheckCircle className="mx-auto h-20 w-20 text-green-500 mb-6" />
        <h1 className="text-3xl font-bold text-foreground mb-3">Order Successful!</h1>
        <p className="text-lg text-muted-foreground mb-6">
          Your request for <span className="font-semibold text-primary">{service?.titre}</span> has been submitted.
        </p>
        <p className="text-sm text-muted-foreground mb-8">You will be contacted shortly if confirmation is needed. Thank you!</p>
        <Button onClick={() => router.push(`/client/${hostId}/${refId}`)} size="lg" className="bg-primary hover:bg-primary/90">
          Back to Services
        </Button>
      </div>
    );
  }

  if (!service || !hostInfo || !locationInfo) { // Added hostInfo and locationInfo checks for safety
    return (
      <div className="text-center py-10 max-w-3xl mx-auto p-4">
        <AlertTriangle className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Service, establishment, or location details could not be loaded.</p>
         <Button onClick={() => router.back()} className="mt-4">Go Back</Button>
      </div>
    );
  }
  
  // Login Gate for specific services
  if (service.loginRequired && !user) {
    return (
      <div className="text-center py-10 bg-card p-8 rounded-xl shadow-xl max-w-md mx-auto">
        <Lock className="mx-auto h-16 w-16 text-primary mb-6" />
        <h1 className="text-2xl font-semibold text-foreground mb-3">Login Required</h1>
        <p className="text-muted-foreground mb-6">
          The service <span className="font-semibold text-primary">&quot;{service.titre}&quot;</span> requires you to be logged in to proceed.
        </p>
        <Link href={`/login?redirect_url=${encodeURIComponent(pathname)}`}>
          <Button size="lg" className="w-full bg-primary hover:bg-primary/90">
            <LogIn className="mr-2 h-5 w-5" />
            Login to Continue
          </Button>
        </Link>
         <Button variant="outline" onClick={() => router.back()} className="mt-4 w-full">
          Go Back to Services
        </Button>
      </div>
    );
  }

  const LocationIcon = locationInfo.type === 'Chambre' ? BedDouble : Utensils;
  const serviceImageAiHint = service.titre ? service.titre.toLowerCase().split(' ').slice(0,2).join(' ') : 'service detail';

  return (
    <div className="max-w-3xl mx-auto">
      <Card className="shadow-xl overflow-hidden bg-card">
        <CardHeader className="p-0">
          {service.image && (
            <div className="relative w-full h-56 sm:h-72 md:h-80">
              <Image src={service.image} alt={service.titre} layout="fill" objectFit="cover" data-ai-hint={serviceImageAiHint} priority/>
            </div>
          )}
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex items-center mb-3 text-sm text-muted-foreground">
              <LocationIcon className="h-5 w-5 mr-2 text-primary"/>
              <span>{hostInfo.nom} - {locationInfo.type} {locationInfo.nom}</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">{service.titre}</h1>
          <p className="text-muted-foreground mb-4 text-base leading-relaxed">{service.description}</p>
          {service.prix !== undefined && ( // Check for undefined as well as null
            <p className="text-3xl font-semibold text-primary mb-6">Price: ${service.prix.toFixed(2)}</p>
          )}

          {(customForm && formFields.length > 0) ? (
            <>
              <DynamicFormRenderer
                ref={formRef}
                formName={`Order Details: ${service.titre}`}
                formDescription={customForm.nom || "Please provide the following details:"}
                fields={formFields}
                onSubmit={handleActualFormSubmit}
              />
              <Button onClick={triggerFormSubmission} disabled={isSubmitting} size="lg" className="mt-6 w-full max-w-xs mx-auto block bg-primary hover:bg-primary/90">
                {isSubmitting ? 'Submitting...' : (service.prix !== undefined ? `Order for $${service.prix.toFixed(2)}` : "Submit Request")}
              </Button>
            </>
          ) : (
            <div className="text-center p-4 bg-secondary/50 rounded-lg mt-6">
              <p className="text-muted-foreground mb-4">This service does not require additional information.</p>
              <Button onClick={handleDirectOrder} disabled={isSubmitting} size="lg" className="w-full max-w-xs mx-auto bg-primary hover:bg-primary/90">
                {isSubmitting ? 'Processing...' : (service.prix !== undefined ? `Confirm Order for $${service.prix.toFixed(2)}` : "Confirm Request")}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      <Button variant="outline" onClick={() => router.back()} className="mt-8 w-full max-w-lg mx-auto block text-base py-3 h-auto">
        Cancel & Go Back to Services
      </Button>
    </div>
  );
}
