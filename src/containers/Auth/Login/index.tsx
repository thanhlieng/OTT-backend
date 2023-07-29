import { Button, Divider, Input, Typography } from 'antd'
import { map, values } from 'lodash'
import { BuiltInProviderType } from 'next-auth/providers'
import { ClientSafeProvider, LiteralUnion, signIn, SignInOptions } from 'next-auth/react'
import { useRouter } from 'next/router'
import React, { useMemo, useState } from 'react'
import { LOGIN_GLOBAL, LOGIN_WORLD_MAP, LOGO_BLACK_LONG } from '@public'

type Props = {
  providers: Record<LiteralUnion<BuiltInProviderType, string>, ClientSafeProvider>
}

export const Login: React.FC<Props> = ({ providers }) => {
  const router = useRouter()
  const [username, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
const [isCreden, setIsCreden] = useState<boolean>(false);

  const signInPress = (a: any, b:any) => {
    if(a == "credentials"){
      setIsCreden(true)
      return;
    }
    signIn(a, b)
  }

  const signInCreden = async () => {
    await signIn('credentials', {
      redirect: true,
      username,
      password,
      callbackUrl:'http://localhost:3000/'
    })
      .then((response) => {
        console.log(response);
        // router.replace('/profile');
      })
      .catch((error) => {
        console.log(error);
      });
  }

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
          {!isCreden ? (map(values(providers), (provider) => {
            console.log("provider", provider);
       
            return (
            <Button
              key={provider?.id}
              size="large"
              block
              type="primary"
              ghost
              onClick={() => {
                signInPress(provider.id, signInOpts)
              }}
              className="mb-2"
            >
              Sign In with {provider?.name}
            </Button>
            )}
          )) : (<div style={{maxWidth: '500px'}}>
             <Input
                  type={'Username'}
                  placeholder={'Username'}
                  size={'large'}
                  name="username"
                  value={username}
                  style={{marginBottom: '10px'}}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Input
                  type={'password'}
                  size={'large'}
                  placeholder="Password"
                  style={{marginBottom: '10px'}}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <Button
              size='middle'
              block
              type="primary"
              ghost
              onClick={() => {
                signInCreden()
              }}
              className="mb-2"
            >
              Sign In
            </Button>
            <Button
              size='middle'
              block
              type="primary"
              ghost
              onClick={() => {
                setIsCreden(false)
              }}
              className="mb-2"
            >
              Sign In with other options
            </Button>
          </div>)}
          
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
