import { authOptions } from '../api/auth/[...nextauth]'
import { BuiltInProviderType } from 'next-auth/providers'
import { ClientSafeProvider, LiteralUnion } from 'next-auth/react'
import { Login } from '@/containers'

type Props = {
  providers: Record<LiteralUnion<BuiltInProviderType, string>, ClientSafeProvider>
}

export default ({ providers }: Props) => <Login providers={providers} />

export async function getServerSideProps() {
  const providers = authOptions.providers
  return {
    props: { providers: JSON.parse(JSON.stringify(providers)) },
  }
}
