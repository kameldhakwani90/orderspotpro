
"use client";

import type { Service } from "@/lib/types";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tag } from "lucide-react";

interface ServiceCardProps {
  service: Service;
  hostId: string;
  refId: string; // RoomOrTable ID
}

export function ServiceCard({ service, hostId, refId }: ServiceCardProps) {
  const imageUrl = (service.image || 'https://placehold.co/600x400.png') + `&data-ai-hint=${(service as any)['data-ai-hint'] || 'service item'}`;
  
  return (
    <Card className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 h-full">
      <CardHeader className="p-0">
        <div className="relative w-full h-48">
          <Image
            src={imageUrl}
            alt={service.titre}
            layout="fill"
            objectFit="cover"
            data-ai-hint={(service as any)['data-ai-hint'] || 'service item'}
          />
        </div>
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
      <CardFooter className="p-4 border-t">
        <Link href={`/client/${hostId}/${refId}/service/${service.id}`} className="w-full">
          <Button className="w-full">
            {service.prix ? 'Order Now' : 'View Details'}
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
