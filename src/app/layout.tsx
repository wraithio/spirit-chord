import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Spirit Chord — Music Theory Card Game',
  description: 'Build chords. Create progressions. Defeat your opponent.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased staff-bg min-h-screen">
        {children}
      </body>
    </html>
  );
}
