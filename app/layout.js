import './globals.css';
import { AuthProvider } from '@/lib/auth';

export const metadata = {
  title: 'GUD RMIS',
  description: 'GUD Road Management Information System',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
