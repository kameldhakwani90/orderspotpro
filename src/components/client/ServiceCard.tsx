
"use client";

import type { Service } from "@/lib/types";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tag, Lock, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";

interface ServiceCardProps {
  service: Service;
  hostId: string;
  refId: string; // RoomOrTable ID
  isUserLoggedIn: boolean;
}

export function ServiceCard({ service, hostId, refId, isUserLoggedIn }: ServiceCardProps) {
  const { t } = useLanguage();
  const imageUrl = service.image || 'https://placehold.co/600x400.png';
  const imageAiHint = (service as any)['data-ai-hint'] || service.titre.toLowerCase().split(' ').slice(0,2).join(' ') || 'service item';
  
  const requiresLoginAndNotLoggedIn = service.loginRequired && !isUserLoggedIn;

  return (
    <Card className={cn(
      "flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 h-full group",
      (requiresLoginAndNotLoggedIn) && "opacity-70 bg-muted/20"
    )}>
      <Link href={`/client/${hostId}/${refId}/service/${service.id}`} legacyBehavior passHref>
        <a className="flex flex-col h-full">
          <CardHeader className="p-0 relative">
            <div className="relative w-full h-48 group-hover:opacity-90 transition-opacity">
              <Image
                src={imageUrl}
                alt={service.titre}
                fill // Changed from layout="fill"
                style={{objectFit:"cover"}} // Added style for objectFit
                data-ai-hint={imageAiHint}
              />
            </div>
            {requiresLoginAndNotLoggedIn && (
              <div className="absolute top-2 right-2 bg-card text-foreground p-1.5 rounded-full shadow-md border">
                <Lock className="h-4 w-4" title={t('loginRequired') || "Login required"}/>
              </div>
            )}
          </CardHeader>
          <CardContent className="p-3 flex-grow">
            <CardTitle className="text-md sm:text-lg mb-1 line-clamp-2">{service.titre}</CardTitle>
            {service.description && (
              <CardDescription className="text-xs text-muted-foreground mb-2 line-clamp-2 h-8">
                {service.description}
              </CardDescription>
            )}
            {service.prix !== undefined && (
              <div className="flex items-center text-md font-semibold text-primary mt-1">
                <Tag className="h-4 w-4 mr-1.5" />
                {t('servicePrice') || "Price"}: {(service.currency || '$')}{service.prix.toFixed(2)}
              </div>
            )}
          </CardContent>
          <CardFooter className="p-3 border-t mt-auto">
            <Button 
              className="w-full" 
              variant={requiresLoginAndNotLoggedIn ? "secondary" : "default"}
              // The Link component handles navigation, this button is primarily for styling
              // For a real button, the onClick would use router.push
            >
              {requiresLoginAndNotLoggedIn ? t('loginToOrder') : (service.formulaireId ? t('viewDetails') : t('orderNow'))}
              {!requiresLoginAndNotLoggedIn && <ArrowRight className="ml-2 h-4 w-4"/>}
            </Button>
          </CardFooter>
        </a>
      </Link>
    </Card>
  );
}
