import {create} from 'zustand';
import { toast } from 'sonner';
import { authService } from '@/services/authService';
import type { AuthState } from '@/types/store';

export const useAuthStore = create<AuthState>((set, get) =>({
    accessToken: null,
    user: null,
    loading: false,

    clearState: () => {
        set({ accessToken: null, user: null, loading: false})
    },

    signUp: async(username, password, email, firstName, lastName) => {
        try{
            set({loading: true});

            //gọi api
            await authService.signUp(username, password, email, firstName, lastName);

            toast.success('Đăng kí thành công, bạn sẽ được chuyển sang trang đăng nhập !')
        }catch(error){
            console.error(error);
            toast.error('Đăng kí không thành công');
        }finally{
            set({loading: false});
        }
    },

    signIn: async(username, password) => {
        try{
            set({loading: true});

            const {accessToken} = await authService.signIn(username, password);
            set({accessToken});

            toast.success('Chào mừng quay lại với Moji !');
            return true;
        }catch(error){
            console.error(error);
            toast.error('Đăng nhập không thành công');
            return false;
        }finally{
            set({loading: false});
        }
    },

    signOut: async() => {
        try {
            get().clearState();
            await authService.signOut();
            toast.success('Đăng xuất thành công');
            
        } catch (error) {
            console.error(error);
            toast.error('Đăng xuất không thành công');
        }
    }


}));
