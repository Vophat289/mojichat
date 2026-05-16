import express from "express";
import {
  acceptFriendRequest,
  sendFriendRequest,
  declineFriendRequest,
  cancelFriendRequest,
  getAllFriends,
  getFriendRequests,
  getSentRequests,
  removeFriend,
  checkFriendship
} from "../controllers/friendController.js";

const router = express.Router();

// Lời mời kết bạn
router.post('/requests', sendFriendRequest);
router.get('/requests', getFriendRequests);
router.get('/requests/sent', getSentRequests);
router.post('/requests/:requestId/accept', acceptFriendRequest);
router.post('/requests/:requestId/decline', declineFriendRequest);
router.delete('/requests/:requestId', cancelFriendRequest);

// Bạn bè
router.get('/', getAllFriends);
router.delete('/:friendId', removeFriend);
router.get('/check/:userId', checkFriendship);

export default router;