import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { uploadActivity } from '@/lib/api';
import { BrandedLoader } from '@/components/BrandedLoader';

/**
 * Full-screen branded loader shown whenever one or more file uploads are in
 * flight (anything sent as FormData through the API client). Mounted once at the
 * app root, so every upload — documents, loan files, etc. — shows the logo
 * loader without each screen wiring it up.
 */
export function UploadingOverlay() {
  const [active, setActive] = useState(0);
  useEffect(() => uploadActivity.subscribe(setActive), []);

  if (active === 0 || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-background/75 backdrop-blur-sm">
      <BrandedLoader label="Uploading…" logoClassName="h-16" />
    </div>,
    document.body,
  );
}
