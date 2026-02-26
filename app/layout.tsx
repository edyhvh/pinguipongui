import type { Metadata } from 'next';
import './globals.css';
import Nav from './Nav';

export const metadata: Metadata = {
  title: 'Pinguipongui — Table Tennis Tracker',
  description: 'Track ping pong matches, players, and standings.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Nav />
        {children}
      </body>
    </html>
  );
}
