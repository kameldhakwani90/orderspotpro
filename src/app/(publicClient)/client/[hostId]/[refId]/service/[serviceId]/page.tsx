
"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter, usePathname } from 'next/navigation'; // Added usePathname
import { getServiceById, getFormById, getFormFields, addOrder, getHostById, getRoomOrTableById } from '@/lib/data';
import type { Service, CustomForm, FormField as FormFieldType, Host, RoomOrTable } from '@/lib/types';
import { DynamicFormRenderer } from '@/components/shared/DynamicFormRenderer';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, CheckCircle, Utensils, BedDouble, LogIn } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext'; // To check login status
import Link from 'next/link'; // For login button redirect

export default function PublicClientOrderServicePage() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname(); // Get current path for redirect
  const { toast } = useToast();
  const { user, isLoading: authIsLoading } = useAuth(); // Get user status

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
    if (hostId && refId && serviceId) {
      const fetchData = async () => {
        setIsLoadingPage(true);
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
            const formDetails = await getFormById(serviceData.formulaireId);
            if (formDetails && formDetails.hostId === hostId) {
              setCustomForm(formDetails);
              const fields = await getFormFields(formDetails.id);
              setFormFields(fields);
            } else {
              console.warn(`Form ${serviceData.formulaireId} (for service ${serviceData.id}) not found or invalid for host ${hostId}`);
              setError(`The information form required for this service is currently unavailable. Please contact support.`);
              setIsLoadingPage(false); return;
            }
          } else {
             setCustomForm(null); setFormFields([]);
          }
        } catch (e) {
          console.error("Failed to fetch service/form data:", e);
          setError("Failed to load service details. Please try again later.");
        }
        setIsLoadingPage(false);
      };
      fetchData();
    }
  }, [hostId, refId, serviceId]);

  const handleFormSubmit = async (formData: Record<string, any>) => {
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
        clientNom: user?.nom, // Add client name if logged in
        donneesFormulaire: JSON.stringify(formData),
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
        clientNom: user?.nom, // Add client name if logged in
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


  if (isLoadingPage || authIsLoading) {
    return (
      <div className="space-y-6">
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
      <div className="text-center py-10">
        <AlertTriangle className="mx-auto h-16 w-16 text-destructive mb-4" />
        <h1 className="text-2xl font-semibold text-destructive mb-2">Error</h1>
        <p className="text-muted-foreground">{error}</p>
        <Button onClick={() => router.back()} className="mt-6">Go Back</Button>
      </div>
    );
  }

  if (orderSuccess) {
    return (
      <div className="text-center py-16">
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

  if (!service) {
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground">Service details not found.</p>
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

  const LocationIcon = locationInfo?.type === 'Chambre' ? BedDouble : Utensils;
  const serviceImageAiHint = (service as any)['data-ai-hint'] || service.titre.toLowerCase().split(' ').slice(0,2).join(' ') || 'service detail';

  return (
    <div className="max-w-3xl mx-auto">
      <Card className="shadow-xl overflow-hidden">
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
              <span>{hostInfo?.nom} - {locationInfo?.type} {locationInfo?.nom}</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">{service.titre}</h1>
          <p className="text-muted-foreground mb-4 text-base leading-relaxed">{service.description}</p>
          {service.prix && (
            <p className="text-3xl font-semibold text-primary mb-6">Price: ${service.prix.toFixed(2)}</p>
          )}

          {(customForm && formFields.length > 0) ? (
            <DynamicFormRenderer
              formName={`Order Details: ${service.titre}`}
              formDescription={customForm.nom}
              fields={formFields}
              onSubmit={handleFormSubmit}
              isLoading={isSubmitting}
              submitButtonText={service.prix ? `Order for $${service.prix.toFixed(2)}` : "Submit Request"}
            />
          ) : (
            <div className="text-center p-4 bg-secondary/50 rounded-lg mt-6">
              <p className="text-muted-foreground mb-4">This service does not require additional information.</p>
              <Button onClick={handleDirectOrder} disabled={isSubmitting} size="lg" className="w-full max-w-xs mx-auto bg-primary hover:bg-primary/90">
                {isSubmitting ? 'Processing...' : (service.prix ? `Confirm Order for $${service.prix.toFixed(2)}` : "Confirm Request")}
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
