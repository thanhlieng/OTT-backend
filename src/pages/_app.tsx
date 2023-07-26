import { SessionProvider } from 'next-auth/react'
import type { AppProps } from 'next/app'
import Head from 'next/head'
import { AppProvider } from '@/providers'
import '@/styles/globals.scss'

export default function App({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  return (
    <>
      <Head>
        <title>Bluesea Call Console</title>
        <meta
          name="viewport"
          content="minimum-scale=1, initial-scale=1, width=device-width, shrink-to-fit=no, user-scalable=no, viewport-fit=cover"
        />
      </Head>
      <SessionProvider session={session}>
        <AppProvider>
          <Component {...pageProps} />
        </AppProvider>
      </SessionProvider>
    </>
  )
}
