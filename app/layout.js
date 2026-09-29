import './globals.css';
import Nav from '@/components/Nav';

export const metadata = { title: 'Ebook Studio', description: 'Crea ebooks profesionales con IA gratis' };
export const viewport = { width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>
        <Nav />
        <main className="wrap">{children}</main>
      </body>
    </html>
  );
}
