import NextAuth, { NextAuthOptions } from 'next-auth'
import { Provider } from 'next-auth/providers'
import AppleProvider from 'next-auth/providers/apple'
import GitHubProvider from 'next-auth/providers/github'
import GitlabProvider from 'next-auth/providers/gitlab'
import GoogleProvider from 'next-auth/providers/google'
import SlackProvider from 'next-auth/providers/slack'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { PrismaClient } from '@prisma/client'
import { env } from '@/constants/env'
import { getPrisma } from '@/lib/database'

const providers: Provider[] = []

if (env.GITHUB_ID) {
  providers.push(
    GitHubProvider({
      clientId: env.GITHUB_ID,
      clientSecret: env.GITHUB_SECRET,
    })
  )
}

if (env.GOOGLE_ID) {
  providers.push(
    GoogleProvider({
      clientId: env.GOOGLE_ID,
      clientSecret: env.GOOGLE_SECRET,
    })
  )
}

if (env.APPLE_ID) {
  providers.push(
    AppleProvider({
      clientId: env.APPLE_ID,
      clientSecret: env.APPLE_SECRET,
    })
  )
}

if (env.GITLAB_ID) {
  providers.push(
    GitlabProvider({
      clientId: env.GITLAB_ID,
      clientSecret: env.GITLAB_SECRET,
    })
  )
}

if (env.SLACK_ID) {
  providers.push(
    SlackProvider({
      clientId: env.SLACK_ID,
      clientSecret: env.SLACK_SECRET,
    })
  )
}

export const authOptions: NextAuthOptions = {
  providers,
}

export default NextAuth({
  secret: env.NEXTAUTH_SECRET,
  adapter: PrismaAdapter(new PrismaClient()),
  providers,
  session: {
    strategy: 'jwt', // See https://next-auth.js.org/configuration/nextjs#caveats, middleware (currently) doesn't support the "database" strategy which is used by default when using an adapter (https://next-auth.js.org/configuration/options#session)
  },
  pages: {
    signIn: '/auth/login',
  },
  callbacks: {
    session: async (data: any) => {
      const user = await getPrisma().user.findUnique({ where: { id: data.token.sub } })
      if (user) {
        data.session.user.role = user.role
        data.session.user.status = user.status
      }
      return data.session
    },
  },
})
