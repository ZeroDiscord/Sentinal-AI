import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/useAuth";
import Header from "@/components/header";

export const metadata = {
  title: 'SentinelAI',
  description: 'AI-Powered Incident Management',
};

export default function RootLayout({
  children,
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <AuthProvider>
          <Header />
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
