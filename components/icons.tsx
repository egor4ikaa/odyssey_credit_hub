import type { ReactNode } from 'react';

/* Единая библиотека SVG-иконок (stroke = currentColor, сетка 24x24).
   Используем вместо эмодзи — серьёзный корпоративный стиль, без внешних зависимостей. */

function I({ className = 'h-4 w-4', children }: { className?: string; children: ReactNode }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export const IconCheck = ({ className }: { className?: string }) => (
  <I className={className}><path d="M20 6 9 17l-5-5" /></I>
);

export const IconX = ({ className }: { className?: string }) => (
  <I className={className}><path d="M18 6 6 18" /><path d="m6 6 12 12" /></I>
);

export const IconInfo = ({ className }: { className?: string }) => (
  <I className={className}><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></I>
);

export const IconAlertTriangle = ({ className }: { className?: string }) => (
  <I className={className}><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" /><path d="M12 9v4" /><path d="M12 17h.01" /></I>
);

export const IconSparkles = ({ className }: { className?: string }) => (
  <I className={className}><path d="M12 3l1.9 5.8a2 2 0 0 0 1.3 1.3L21 12l-5.8 1.9a2 2 0 0 0-1.3 1.3L12 21l-1.9-5.8a2 2 0 0 0-1.3-1.3L3 12l5.8-1.9a2 2 0 0 0 1.3-1.3L12 3z" /></I>
);

export const IconFileText = ({ className }: { className?: string }) => (
  <I className={className}><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z" /><path d="M14 2v4a2 2 0 0 0 2 2h4" /><path d="M10 9H8" /><path d="M16 13H8" /><path d="M16 17H8" /></I>
);

export const IconSend = ({ className }: { className?: string }) => (
  <I className={className}><path d="M22 2 11 13" /><path d="M22 2 15 22l-4-9-9-4 20-7z" /></I>
);

export const IconTrash = ({ className }: { className?: string }) => (
  <I className={className}><path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><path d="M10 11v6" /><path d="M14 11v6" /></I>
);

export const IconPencil = ({ className }: { className?: string }) => (
  <I className={className}><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /></I>
);

export const IconLogout = ({ className }: { className?: string }) => (
  <I className={className}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5" /><path d="M21 12H9" /></I>
);

export const IconBuilding = ({ className }: { className?: string }) => (
  <I className={className}><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" /><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" /><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" /><path d="M10 6h4" /><path d="M10 10h4" /><path d="M10 14h4" /><path d="M10 18h4" /></I>
);

export const IconUser = ({ className }: { className?: string }) => (
  <I className={className}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></I>
);

export const IconMail = ({ className }: { className?: string }) => (
  <I className={className}><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></I>
);

export const IconLock = ({ className }: { className?: string }) => (
  <I className={className}><rect width="18" height="11" x="3" y="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></I>
);

export const IconArrowRight = ({ className }: { className?: string }) => (
  <I className={className}><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></I>
);

export const IconShieldCheck = ({ className }: { className?: string }) => (
  <I className={className}><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" /><path d="m9 12 2 2 4-4" /></I>
);

export const IconClock = ({ className }: { className?: string }) => (
  <I className={className}><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></I>
);

export const IconStar = ({ className }: { className?: string }) => (
  <I className={className}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></I>
);

export const IconSearch = ({ className }: { className?: string }) => (
  <I className={className}><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></I>
);

export const IconLightbulb = ({ className }: { className?: string }) => (
  <I className={className}><path d="M15 14c.2-1 .7-1.7 1.5-2.5A5.88 5.88 0 0 0 18 8a6 6 0 0 0-12 0c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" /><path d="M9 18h6" /><path d="M10 22h4" /></I>
);

export const IconRocket = ({ className }: { className?: string }) => (
  <I className={className}><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" /><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" /><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" /><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" /></I>
);

export const IconSliders = ({ className }: { className?: string }) => (
  <I className={className}><path d="M4 21v-7" /><path d="M4 10V3" /><path d="M12 21v-9" /><path d="M12 8V3" /><path d="M20 21v-5" /><path d="M20 12V3" /><path d="M1 14h6" /><path d="M9 8h6" /><path d="M17 16h6" /></I>
);

export const IconBriefcase = ({ className }: { className?: string }) => (
  <I className={className}><rect width="20" height="14" x="2" y="7" rx="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></I>
);

export const IconWallet = ({ className }: { className?: string }) => (
  <I className={className}><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" /><path d="M3 5v14a2 2 0 0 0 2 2h16v-5" /><path d="M18 12a2 2 0 0 0 0 4h4v-4Z" /></I>
);

export const IconChartBar = ({ className }: { className?: string }) => (
  <I className={className}><path d="M3 3v16a2 2 0 0 0 2 2h16" /><path d="M18 17V9" /><path d="M13 17V5" /><path d="M8 17v-3" /></I>
);

export const IconBot = ({ className }: { className?: string }) => (
  <I className={className}><path d="M12 8V4h-2" /><rect width="16" height="12" x="4" y="8" rx="2" /><path d="M2 14h2" /><path d="M20 14h2" /><path d="M15 13v2" /><path d="M9 13v2" /></I>
);

export const IconCheckCircle = ({ className }: { className?: string }) => (
  <I className={className}><circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" /></I>
);

export const IconXCircle = ({ className }: { className?: string }) => (
  <I className={className}><circle cx="12" cy="12" r="10" /><path d="m15 9-6 6" /><path d="m9 9 6 6" /></I>
);

export const IconRefreshCw = ({ className }: { className?: string }) => (
  <I className={className}><path d="M3 12a9 9 0 0 1 15-6.7L21 8" /><path d="M21 12a9 9 0 0 1-15 6.7L3 16" /><path d="M21 3v5h-5" /><path d="M3 21v-5h5" /></I>
);

export const IconSettings = ({ className }: { className?: string }) => (
  <I className={className}><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></I>
);

export const IconLandmark = ({ className }: { className?: string }) => (
  <I className={className}><path d="M3 22h18" /><path d="M6 18v-7" /><path d="M10 18v-7" /><path d="M14 18v-7" /><path d="M18 18v-7" /><path d="m12 2 9 5H3l9-5z" /></I>
);
