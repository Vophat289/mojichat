import mongoose from 'mongoose';
import User from './src/models/user.js';
import FriendRequest from './src/models/friendRequest.js';
import Friend from './src/models/friend.js';
import Conversation from './src/models/conversation.js';
import dotenv from 'dotenv';
dotenv.config();

async function test() {
  try {
    await mongoose.connect(process.env.MONGODB_CONNECTIONSTRING);
    console.log("Connected to DB");

    const users = await User.find().limit(2);
    if (users.length < 2) {
      console.log("Need at least 2 users");
      process.exit(0);
    }

    const user1 = users[0];
    const user2 = users[1];

    console.log(`Testing with ${user1.username} and ${user2.username}`);

    await FriendRequest.deleteMany({ $or: [{from: user1._id, to: user2._id}, {from: user2._id, to: user1._id}] });
    await Friend.deleteMany({ $or: [{userA: user1._id, userB: user2._id}, {userA: user2._id, userB: user1._id}] });

    const req = await FriendRequest.create({ from: user1._id, to: user2._id });
    console.log("Created request:", req._id);

    let userA = req.from.toString();
    let userB = req.to.toString();
    if (userA > userB) [userA, userB] = [userB, userA];

    console.log("Creating friend with", userA, userB);
    const friend = await Friend.create({ userA, userB });
    console.log("Friend created:", friend._id);

    const conv = await Conversation.findOneAndUpdate(
        {
          type: 'direct',
          'participants.userId': { $all: [req.from, req.to] }
        },
        {
          $setOnInsert: {
            type: 'direct',
            participants: [
              { userId: req.from },
              { userId: req.to }
            ]
          }
        },
        { upsert: true, new: true }
      );
    console.log("Conversation created:", conv._id);

    console.log("All good!");
    process.exit(0);
  } catch (e) {
    console.error("ERROR:", e);
    process.exit(1);
  }
}
test();
