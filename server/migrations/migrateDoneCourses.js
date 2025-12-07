require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/user.model");
const Course = require("../models/course.model");

/**
 * Migration script to convert legacy doneCourses (course names) 
 * to new courseProgress structure (course IDs with completion data)
 */

async function migrateDoneCourses() {
    try {
        // Connect to MongoDB
        const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/coficab_elearning";
        await mongoose.connect(mongoUri);
        console.log("✅ Connected to MongoDB");

        // Find all users with doneCourses
        const users = await User.find({ doneCourses: { $exists: true, $ne: [] } });
        console.log(`📊 Found ${users.length} users with doneCourses to migrate`);

        let migratedCount = 0;
        let errorCount = 0;

        for (const user of users) {
            try {
                console.log(`\n🔄 Migrating user: ${user.name} (${user.email})`);

                for (const courseName of user.doneCourses) {
                    // Find course by title (case-insensitive)
                    const course = await Course.findOne({
                        title: { $regex: new RegExp(`^${courseName}$`, 'i') }
                    });

                    if (!course) {
                        console.log(`  ⚠️  Course not found: "${courseName}" - skipping`);
                        continue;
                    }

                    // Check if already migrated
                    const existingProgress = user.courseProgress.find(
                        cp => cp.courseId.toString() === course._id.toString()
                    );

                    if (existingProgress) {
                        console.log(`  ℹ️  Already migrated: "${courseName}"`);
                        continue;
                    }

                    // Create new course progress entry
                    const newProgress = {
                        courseId: course._id,
                        videoProgress: [],
                        quizAttempts: [],
                        completed: true, // They completed it in the old system
                        completedAt: user.createdAt || new Date(), // Use user creation date as fallback
                        certificateGenerated: false
                    };

                    user.courseProgress.push(newProgress);
                    console.log(`  ✅ Migrated: "${courseName}" -> ${course._id}`);
                }

                // Save the updated user
                await user.save();
                migratedCount++;
                console.log(`✅ User migration complete: ${user.name}`);

            } catch (userError) {
                errorCount++;
                console.error(`❌ Error migrating user ${user.email}:`, userError.message);
            }
        }

        console.log("\n" + "=".repeat(50));
        console.log("📊 Migration Summary:");
        console.log(`   ✅ Successfully migrated: ${migratedCount} users`);
        console.log(`   ❌ Errors: ${errorCount} users`);
        console.log("=".repeat(50));

        // Close connection
        await mongoose.connection.close();
        console.log("\n✅ Migration complete. Database connection closed.");

    } catch (error) {
        console.error("❌ Migration failed:", error);
        process.exit(1);
    }
}

// Run migration
migrateDoneCourses();
