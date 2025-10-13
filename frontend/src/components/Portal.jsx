import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * A reusable Portal component.
 * It renders its children into a new DOM node that is a direct child of `document.body`.
 * This is the standard, professional way to handle modals, tooltips, and other overlays
 * to avoid CSS stacking context issues.
 */
const Portal = ({ children }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // When the modal is open, prevent the background page from scrolling
    document.body.style.overflow = 'hidden';

    // This is a cleanup function that runs when the component is unmounted (modal closes)
    return () => {
      setMounted(false);
      document.body.style.overflow = 'auto'; // Re-enable scrolling
    };
  }, []);

  // `createPortal` takes two arguments: the JSX to render, and the DOM node to render it into.
  // We only render the portal if the component is mounted on the client side.
  return mounted ? createPortal(children, document.body) : null;
};

export default Portal;

