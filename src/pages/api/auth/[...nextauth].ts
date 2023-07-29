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
import CredentialsProvider from "next-auth/providers/credentials";

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

providers.push(CredentialsProvider({
  // The name to display on the sign in form (e.g. "Sign in with...")
  name: "Credentials",
  // `credentials` is used to generate a form on the sign in page.
  // You can specify which fields should be submitted, by adding keys to the `credentials` object.
  // e.g. domain, username, password, 2FA token, etc.
  // You can pass any HTML attribute to the <input> tag through the object.
  credentials: {
    username: { label: "Username", type: "text", placeholder: "jsmith" },
    password: { label: "Password", type: "password" }
  },
  async authorize(credentials, req) {
    // Add logic here to look up the user from the credentials supplied
    console.log("12312321312", credentials);
    

    const userDB = await getPrisma().user.findFirst({where: {username : credentials?.username}})

    console.log("user", userDB);
    

    if(userDB){
      return userDB
    } else {
      return null
    }

    const user = { id: "1", name: "J Smith", email: "jsmith@example.com" }


    

    if (user) {
      // Any object returned will be saved in `user` property of the JWT
      return user
    } else {
      // If you return null then an error will be displayed advising the user to check their details.
      return null

      // You can also Reject this callback with an Error thus the user will be sent to the error page with the error message as a query parameter
    }
  }
}))

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
      console.log("đến sao đêi", data);
      
      const user = await getPrisma().user.findUnique({ where: { id: data.token.sub } })
      if (user) {
        data.session.user.role = user.role
        data.session.user.status = user.status
      }

      console.log("4545454545", data.session);
      
      return data.session
    },
  },
})
