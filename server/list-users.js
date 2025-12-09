/**
 * List all users in the database
 */

const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/user.model');

async function listUsers() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        const users = await User.find({}).select('name email role');

        if (users.length === 0) {
            console.log('❌ No users found in database');
        } else {
            console.log(`Found ${users.length} user(s):\n`);
            users.forEach((user, index) => {
                console.log(`${index + 1}. ${user.name}`);
                console.log(`   Email: ${user.email}`);
                console.log(`   Role: ${user.role || 'user'}`);
                console.log(`   ID: ${user._id}\n`);
            });
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

listUsers();
