import {create} from 'zustand';
import { toast } from 'sonner';
import { authService } from '@/services/authService';

export const useAuthStore = create ((set, get) =>{
    accessToken: null,
    user: null,
    loading: false

    signUp: async(username, password, email, firstName, lastName) => {
        try{
            set({loading: true})

            //gọi api
            await authService.signUp(username, password, email, firstName, lastName);

            toast.success('Đăng kí thành công, bạn sẽ được chuyển sang trang đăng nhập !')
        }catch(error){
            console.error(error);
            toast.error('Đăng kí không thành công');
        }finally{
            set({loading: false});
        }
    }
})
