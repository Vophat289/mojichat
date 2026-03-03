import jwt from 'jsonwebtoken';
import User from '../models/user.js'

export const protectedRoute = (req, res, next) => {
    try{
        // lấy token từ header
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(" ")[1]; //Bearer <token>


    }catch(error){
        console.error('Lỗi khi xác minh JWT trong authMiddleware', error);
        return res.sendStatus(500).json({message: "Lỗi hệ thống"});
    }
}