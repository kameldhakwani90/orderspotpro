
// This page is deprecated and has been moved to the (publicClient) route group.
// This placeholder is to prevent routing conflicts.
// Please delete this file (/src/app/(app)/client/[hostId]/[refId]/service/[serviceId]/page.tsx) if no longer needed.

export default function DeprecatedClientOrderServicePage() {
  if (typeof window !== 'undefined') {
    console.warn(`WARNING: Deprecated page at ${window.location.pathname} is being rendered. This file should be deleted as its functionality has moved to the (publicClient) route group.`);
  }
  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', backgroundColor: '#ffeeee', border: '2px solid red', color: '#333' }}>
      <h1>Deprecated Client Order Service Page</h1>
      <p>This page component (<code>/src/app/(app)/client/[hostId]/[refId]/service/[serviceId]/page.tsx</code>) is deprecated. Its functionality has moved.</p>
      <p>This file should be deleted to resolve routing conflicts. If you see this, please clear your <code>.next</code> folder and restart the server.</p>
    </div>
  );
}
