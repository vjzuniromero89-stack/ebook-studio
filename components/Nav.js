'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Nav() {
  const path = usePathname();
  if (path === '/login') return null;
  const items = [
    ['/', 'Mis ebooks'],
    ['/ideas', 'Ideas IA'],
    ['/nuevo', 'Nuevo'],
    ['/ajustes', 'Ajustes'],
  ];
  return (
    <header className="topbar">
      <div className="wrap">
        <Link href="/" className="logo"><i />Ebook Studio</Link>
        <nav className="nav">
          {items.map(([href, label]) => (
            <Link key={href} href={href} className={(href === '/' ? path === '/' : path.startsWith(href)) ? 'on' : ''}>{label}</Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
