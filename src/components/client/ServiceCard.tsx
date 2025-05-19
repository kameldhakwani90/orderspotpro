
"use client";

import type { Service } from "@/lib/types";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tag, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface ServiceCardProps {
  service: Service;
  hostId: string;
  refId: string; // RoomOrTable ID
  isUserLoggedIn: boolean; // New prop
}

export function ServiceCard({ service, hostId, refId, isUserLoggedIn }: ServiceCardProps) {
  const imageUrl = service.image || 'https://placehold.co/600x400.png';
  const imageAiHint = (service as any)['data-ai-hint'] || service.titre.toLowerCase().split(' ').slice(0,2).join(' ') || 'service item';
  
  const requiresLoginAndNotLoggedIn = service.loginRequired && !isUserLoggedIn;

  return (
    <Card className={cn(
      "flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 h-full",
      requiresLoginAndNotLoggedIn && "opacity-75 bg-muted/30"
    )}>
      <CardHeader className="p-0 relative">
        <div className="relative w-full h-48">
          <Image
            src={imageUrl}
            alt={service.titre}
            layout="fill"
            objectFit="cover"
            data-ai-hint={imageAiHint}
          />
        </div>
        {requiresLoginAndNotLoggedIn && (
          <div className="absolute top-2 right-2 bg-secondary text-secondary-foreground p-1.5 rounded-full shadow-md">
            <Lock className="h-4 w-4" title="Login required"/>
          </div>
        )}
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <CardTitle className="text-xl mb-1">{service.titre}</CardTitle>
        <CardDescription className="text-sm text-muted-foreground mb-2 h-16 overflow-hidden text-ellipsis">
          {service.description}
        </CardDescription>
        {service.prix && (
          <div className="flex items-center text-lg font-semibold text-primary mt-2">
            <Tag className="h-5 w-5 mr-2" />
            Price: ${service.prix.toFixed(2)}
          </div>
        )}
      </CardContent>
      <CardFooter className="p-4 border-t mt-auto">
        <Link href={`/client/${hostId}/${refId}/service/${service.id}`} className="w-full">
          <Button 
            className="w-full" 
            disabled={requiresLoginAndNotLoggedIn && !isUserLoggedIn} // Visually disable if login needed and not logged in
            variant={requiresLoginAndNotLoggedIn ? "secondary" : "default"}
          >
            {requiresLoginAndNotLoggedIn ? 'Login to Order' : (service.prix ? 'Order Now' : 'View Details')}
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
