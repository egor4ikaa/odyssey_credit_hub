import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Odyssey Кредит Хаб — умный кредитный кабинет',
  description: 'Цифровой кредитный конвейер для малого и микробизнеса'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Unbounded:wght@400;500;600;700;800;900&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <div className="orb orb-1" aria-hidden />
        <div className="orb orb-2" aria-hidden />
        <div className="orb orb-3" aria-hidden />
        <main className="relative z-10 min-h-screen">{children}</main>
      </body>
    </html>
  );
}
