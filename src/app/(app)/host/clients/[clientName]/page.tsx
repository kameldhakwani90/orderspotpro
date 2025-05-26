
// This page is deprecated in favor of /host/clients/file/[clientId]/page.tsx
// It should no longer be directly accessed.
// You can eventually delete this file and its directory.

"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DeprecatedClientFileByNamePage() {
  const router = useRouter();
  useEffect(() => {
    console.warn("Attempted to access deprecated client file page (by name). Redirecting to client list.");
    router.replace('/host/clients');
  }, [router]);

  return (
    <div className="container mx-auto py-8 px-4 text-center">
      <p>This page is deprecated. Redirecting to the client list...</p>
    </div>
  );
}
