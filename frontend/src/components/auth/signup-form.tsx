import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "../ui/label";

import { z } from "zod";
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import { useAuthStore } from "@/stores/useAuthStore";
import { useNavigate } from "react-router";

const signUpSchema = z.object({
  firstname: z.string().min(1, "Tên bắt buộc phải"),
  lastname: z.string().min(1, "Họ bắt buộc phải có"),
  username: z.string().min(3, "Tên đăng nhập phải có ít nhất 3 kí tự"),
  email: z.email("Email không hợp lệ"),
  password: z.string().min(6, "Mật khẩu ít nhất 6 kí tự"),
});

type SignUpFormValues = z.infer<typeof signUpSchema>;

export function SignupForm({className,...props}: React.ComponentProps<"div">) {
  const {signUp} = useAuthStore();
  const navigate = useNavigate();
  const {register, handleSubmit, formState: {errors, isSubmitting}} = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema)
  }); 

  const onSubmit = async (data: SignUpFormValues) => {
    
    const {firstname, lastname, username, email, password} = data;

    //gọi backend về signup

    await signUp(username, password, email, firstname, lastname);

    navigate("/signin");
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0 border-none shadow-xl">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-6 md:p-10 flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
            <div className="flex flex-col gap-6">
              {/* header logo */}
              <div className="flex flex-col items-center text-center gap-2">
                <a href="/" className="mx-auto block w-fit text-center">
                  <img src="/logo.svg" alt="logo" />
                </a>

                <h1 className="text-2xl font-bold">Tạo tài khoản Moji</h1>
                <p className="text-muted-foreground text-balance">
                  Chào mừng bạn! Hãy đăng kí để bắt đầu
                </p>
              </div>
              {/* họ và tên */}
              <div className="space-y-2">
                <Label htmlFor="lastname" className="block text-sm">
                  Họ
                </Label>
                <Input 
                  type="text" 
                  id="lastname" 
                  {...register("lastname")}
                  />

                {errors.lastname && (
                  <p className="text-destructive text-sm">
                    {errors.lastname.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="firstname" className="block text-sm">
                  Tên
                </Label>
                <Input 
                  type="text" 
                  id="firstname" 
                  {...register("firstname")}
                  />
                {errors.firstname && (
                  <p className="text-destructive text-sm">
                    {errors.firstname.message}
                  </p>
                )}
              </div>

              {/* username */}
              <div className="flex flex-col gap-3">
                <Label htmlFor="username" className="block text-sm">
                  Tên đăng nhập
                </Label>
                <Input 
                  type="text" 
                  id="username" 
                  placeholder="moji" 
                  {...register("username")}
                  />
                 {errors.username && (
                  <p className="text-destructive text-sm">
                    {errors.username.message}
                  </p>
                )}
              </div>

              {/* email */}
              <div className="flex flex-col gap-3">
                <Label htmlFor="email" className="block text-sm">
                  Email
                </Label>
                <Input 
                type="text" 
                id="email" 
                placeholder="abc@gmail.com" 
                {...register("email")}
                />
                {errors.email && (
                  <p className="text-destructive text-sm">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* password */}
              <div className="flex flex-col gap-3">
                <Label htmlFor="password" className="block text-sm">
                  Mật khẩu
                </Label>
                <Input 
                  type="password" 
                  id="password" 
                  {...register("password")}
                  />
                {errors.password && (
                  <p className="text-destructive text-sm">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* nút ddki */}
              <Button 
                type="submit" 
                className="w-full"
                disabled= {isSubmitting}
                >
                Tạo tài khoản
              </Button>

              <div className="text-center text-sm">
                Đã có tài khoản ?{" "}
                <a href="/signin" className="underline underline-offset-4">
                  Đăng nhập
                </a>
              </div>
            </div>
          </form>
          <div className="relative hidden bg-[#f0f0f5] md:flex items-center justify-center p-12">
            <img
              src="/placeholderSignUp.png"
              alt="Illustration"
              className="w-full max-w-[280px] h-auto object-contain"
            />
          </div>
        </CardContent>
      </Card>
      <div className="text-center text-xs text-muted-foreground px-6">
        Bằng cách tiếp tục, bạn đồng ý với{" "}
        <a href="#" className="underline hover:text-primary">
          Điều khoản dịch vụ
        </a>{" "}
        và{" "}
        <a href="#" className="underline hover:text-primary">
          Chính sách bảo mật
        </a>{" "}
        của chúng tôi.
      </div>
    </div>
  );
}
