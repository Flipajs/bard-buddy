import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'bard-buddy',
  description: 'Czech poetry & lyrics writing assistant',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="cs">
      <body className="antialiased">{children}</body>
    </html>
  );
}
