import { Button, Divider, Typography } from 'antd'
import { map, values } from 'lodash'
import { BuiltInProviderType } from 'next-auth/providers'
import { ClientSafeProvider, LiteralUnion, signIn, SignInOptions } from 'next-auth/react'
import { useRouter } from 'next/router'
import React, { useMemo } from 'react'
import { LOGIN_GLOBAL, LOGIN_WORLD_MAP, LOGO_BLACK_LONG } from '@public'

type Props = {
  providers: Record<LiteralUnion<BuiltInProviderType, string>, ClientSafeProvider>
}

export const Login: React.FC<Props> = ({ providers }) => {
  const router = useRouter()
  const signInOpts: SignInOptions = useMemo(() => {
    return {
      callbackUrl: (router.query.callbackUrl as string) || '/',
    }
  }, [router])
  return (
    <div className="min-h-screen flex items-center justify-center relative">
      <div className="flex flex-col bg-transparent lg:bg-white lg:flex-row items-center justify-center lg:rounded-xl lg:shadow-lg px-6 z-50">
        <div className="my-8 px-4">
          <img src={LOGO_BLACK_LONG} alt="" className="w-[200px]" />
          <Divider />
          <Typography.Title className="mt-4" level={4}>
            Sign in
          </Typography.Title>
          <Typography.Paragraph>Sign in using any of the following services</Typography.Paragraph>
          {map(values(providers), (provider) => (
            <Button
              key={provider?.id}
              size="large"
              block
              type="primary"
              ghost
              onClick={() => {
                signIn(provider?.id, signInOpts)
              }}
              className="mb-2"
            >
              Sign In with {provider?.name}
            </Button>
          ))}
        </div>
        <img src={LOGIN_GLOBAL} alt="" className="w-full lg:w-[600px]" />
      </div>
      <img
        src={LOGIN_WORLD_MAP}
        alt=""
        className="absolute top-0 left-0 w-full h-full object-contain z-10 hidden lg:block"
      />
    </div>
  )
}
