// =====================================================
// WithVoice - Root Layout
// PWA 메타 태그 + 전역 설정
// =====================================================

import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { AuthProvider } from '@/components/auth-provider'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

// =====================================================
// Metadata (SEO + PWA)
// =====================================================

export const metadata: Metadata = {
  title: {
    default: 'WithVoice - 사랑하는 사람의 목소리',
    template: '%s | WithVoice',
  },
  description: '사랑하는 사람의 실제 목소리로 나를 변화시키는 앱. 매일 아침 엄마의 목소리로 일어나고, 멀리 있는 연인의 목소리로 하루를 마무리하세요.',
  keywords: ['알람', '목소리', '습관', '동기부여', '가족', '연인', '녹음', 'PWA'],
  authors: [{ name: 'WithVoice Team' }],
  creator: 'WithVoice',
  publisher: 'WithVoice',

  // PWA 관련
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'WithVoice',
  },
  formatDetection: {
    telephone: false,
  },

  // Open Graph
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    url: 'https://withvoice.app',
    siteName: 'WithVoice',
    title: 'WithVoice - 사랑하는 사람의 목소리',
    description: '사랑하는 사람의 실제 목소리로 나를 변화시키는 앱',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'WithVoice',
      },
    ],
  },

  // Twitter
  twitter: {
    card: 'summary_large_image',
    title: 'WithVoice - 사랑하는 사람의 목소리',
    description: '사랑하는 사람의 실제 목소리로 나를 변화시키는 앱',
    images: ['/og-image.png'],
  },

  // 기타
  robots: {
    index: true,
    follow: true,
  },
}

// =====================================================
// Viewport (PWA 테마 색상 등)
// =====================================================

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#1f2937' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // PWA에서 확대 방지
  viewportFit: 'cover', // 노치 대응
}

// =====================================================
// Root Layout
// =====================================================

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <head>
        {/* PWA 아이콘 */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icons/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />

        {/* iOS PWA 설정 */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="WithVoice" />

        {/* iOS Splash Screen */}
        <link
          rel="apple-touch-startup-image"
          href="/splash/apple-splash-2048-2732.jpg"
          media="(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/splash/apple-splash-1170-2532.jpg"
          media="(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/splash/apple-splash-1125-2436.jpg"
          media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
        />

        {/* Microsoft Tile */}
        <meta name="msapplication-TileColor" content="#6366f1" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
      </head>
      <body className={`${inter.className} antialiased`}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
