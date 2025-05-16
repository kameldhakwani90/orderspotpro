
import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  // Initialize with a boolean value directly.
  // On the server or before first client-side effect, it will default to false.
  const [isMobile, setIsMobile] = React.useState<boolean>(false);

  React.useEffect(() => {
    // This function will only run on the client side.
    const updateMobileState = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };

    // Set the initial state based on the window size.
    updateMobileState();

    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    
    // Listen for changes in screen size.
    mql.addEventListener("change", updateMobileState);
    
    // Clean up the event listener when the component unmounts.
    return () => mql.removeEventListener("change", updateMobileState);
  }, []); // Empty dependency array ensures this effect runs only once on mount and cleans up on unmount.

  return isMobile;
}
