
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase } from "lucide-react";
import { useRouter } from "next/navigation";

export default function HostEmployeesPage() {
  const router = useRouter();

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground flex items-center">
            <Briefcase className="mr-3 h-8 w-8 text-primary" />
            Manage Employees
          </h1>
          <p className="text-lg text-muted-foreground">
            Create and manage employee accounts for your establishment.
          </p>
        </div>
        {/* Placeholder for Add Employee Button */}
        {/* <Button onClick={() => {}} disabled>Add New Employee (Coming Soon)</Button> */}
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Employee Management</CardTitle>
          <CardDescription>
            This section will allow hosts to manage their staff, assign roles within the establishment, and set specific menu access permissions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-10">
            <p className="text-xl text-muted-foreground">
              Employee management functionality is currently under development.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Soon, you'll be able to add chefs, servers, receptionists, etc., and control what they can see and do in the app.
            </p>
            <Button variant="outline" onClick={() => router.back()} className="mt-6">
                Go Back
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

    