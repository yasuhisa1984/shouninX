// src/app/layout.js

import { Inter } from 'next/font/google'
import './globals.css'
import MainLayout from '@/components/layout-1' // 👈 "use client" はこの中で定義しておく

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'shouninX',
  description: '',
}

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <body className={inter.className}>
        <MainLayout>
          {children}
        </MainLayout>
      </body>
    </html>
  )
}
