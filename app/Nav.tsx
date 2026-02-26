'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Nav() {
  const pathname = usePathname();

  return (
    <nav className="nav">
      <div className="nav-inner">
        <Link href="/" className="nav-logo">
          Pinguipongui
        </Link>
        <ul className="nav-links">
          <li>
            <Link
              href="/match/new"
              className={`nav-link${pathname === '/match/new' ? ' active' : ''}`}
            >
              + Match
            </Link>
          </li>
          <li>
            <Link
              href="/players"
              className={`nav-link${pathname === '/players' ? ' active' : ''}`}
            >
              Players
            </Link>
          </li>
          <li>
            <Link
              href="/ranking"
              className={`nav-link${pathname === '/ranking' ? ' active' : ''}`}
            >
              Info
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
}
