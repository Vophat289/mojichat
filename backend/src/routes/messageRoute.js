import express from "express";
import {
  getConversations,
  getOrCreateDirect,
  getMessages,
  sendMessage,
  markAsRead,
  createGroupChat,
  addToGroup,
  leaveGroup
} from "../controllers/messageController.js";

const router = express.Router();

// Conversations
router.get('/conversations', getConversations);
router.post('/conversations/direct', getOrCreateDirect);
router.post('/conversations/group', createGroupChat);

// Messages trong conversation
router.get('/:conversationId', getMessages);
router.post('/:conversationId', sendMessage);
router.patch('/:conversationId/read', markAsRead);

// Group management
router.put('/conversations/:conversationId/members', addToGroup);
router.delete('/conversations/:conversationId/leave', leaveGroup);

export default router;
