import React from "react"

import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { AuthProvider } from '@/lib/auth-context'
import { DataProvider } from '@/lib/data-store'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata = {
  title: 'SkillMatch',
  description: 'Plateforme RH intelligente pour la gestion des compétences et des recommandations.',
  generator: 'Next.js',
  icons: {
    icon: [
      {
        url: '/favicon.ico',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/favicon.ico',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/favicon.ico',
        type: 'image/x-icon',
      },
    ],
    apple: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children
}>) {
  return (
    <html lang="fr">
      <body className={`font-sans antialiased`}>
        <a href="#main-content" className="skip-link">
          Aller au contenu principal
        </a>
        <AuthProvider>
          <DataProvider>
            {children}
            <Toaster richColors position="top-right" />
          </DataProvider>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  )
}



