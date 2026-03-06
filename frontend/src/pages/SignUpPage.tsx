import { SignupForm } from "@/components/auth/signup-form"

const SignUpPage = () => {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-[radial-gradient(circle_at_50%_50%,_#f3e8ff_0%,_#e9d5ff_100%)] p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-4xl">
        <SignupForm />
      </div>
    </div>
  )
}

export default SignUpPage