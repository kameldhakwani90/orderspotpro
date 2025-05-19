// This route is deprecated and its functionality has moved to the (publicClient) route group.
// This file exists to prevent build errors if not deleted, but should not be routed to.
// Please delete this file and its parent directory src/app/(app)/client/ if no longer needed.
console.warn(`WARNING: Deprecated route module at /src/app/(app)/client/landing/page.tsx is being processed. This path should be served by /app/(publicClient)/client/landing/page.tsx`);
export const DEPRECATED_ROUTE_landing = true;

// By not exporting a default React component, Next.js should not treat this as a page.
// If errors persist, ensure this file and its directory are deleted and the .next folder is cleared.
