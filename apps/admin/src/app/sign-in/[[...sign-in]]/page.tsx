import { SignIn } from '@clerk/nextjs'

export default function SignInPage(): JSX.Element {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">CasaLux Admin</h1>
          <p className="mt-2 text-gray-600">Sign in to access the admin panel</p>
        </div>
        <SignIn
          appearance={{
            elements: {
              formButtonPrimary: 'bg-gray-900 hover:bg-gray-700 text-sm',
            },
          }}
        />
      </div>
    </div>
  )
}
