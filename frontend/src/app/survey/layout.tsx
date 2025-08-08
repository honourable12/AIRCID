
import type { Metadata } from 'next';
import { Toaster } from '@/components/ui/toaster';
import { Logo } from '@/components/logo';

export const metadata: Metadata = {
  title: 'Survey | AIRCID',
  description: 'Participate in a research study.',
};

export default function SurveyLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <header className="py-4 px-6 border-b">
        <div className="container mx-auto flex items-center gap-2">
            <Logo className="h-8 w-8 text-primary" />
            <span className="text-xl font-semibold font-headline">AIRCID</span>
        </div>
      </header>
      <main className="flex-1 p-4 md:p-6 lg:p-8">
        <div className="container mx-auto">
          {children}
        </div>
      </main>
      <Toaster />
    </>
  );
}

    
