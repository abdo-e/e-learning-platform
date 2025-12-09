/**
 * Setup script to create a test company and assign a user as corporate admin
 * Run this script with: node setup-corporate-admin.js <user-email>
 */

const mongoose = require('mongoose');
require('dotenv').config();

const Company = require('./models/company.model');
const User = require('./models/user.model');

async function setupCorporateAdmin() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Get user email from command line argument
        const userEmail = process.argv[2];

        if (!userEmail) {
            console.error('❌ Please provide a user email: node setup-corporate-admin.js <user-email>');
            process.exit(1);
        }

        // Find the user
        const user = await User.findOne({ email: userEmail });

        if (!user) {
            console.error(`❌ User not found with email: ${userEmail}`);
            process.exit(1);
        }

        console.log(`✅ Found user: ${user.name} (${user.email})`);

        // Check if company already exists
        let company = await Company.findOne({
            'admins.userId': user._id
        });

        if (company) {
            console.log(`✅ User is already a corporate admin of: ${company.name}`);

            // Ensure company is approved
            if (company.registrationStatus !== 'approved') {
                company.registrationStatus = 'approved';
                company.approvedAt = new Date();
                await company.save();
                console.log(`✅ Company "${company.name}" has been approved`);
            }
        } else {
            // Create a new test company
            company = new Company({
                name: 'Test Corporation',
                industry: 'Technology',
                size: '51-200',
                website: 'https://testcorp.example.com',
                description: 'Test company for development and testing purposes',
                contactPerson: {
                    name: user.name,
                    email: user.email,
                    phone: '+1234567890',
                    position: 'CEO'
                },
                billingAddress: {
                    street: '123 Test Street',
                    city: 'Test City',
                    state: 'Test State',
                    country: 'Test Country',
                    postalCode: '12345'
                },
                taxId: 'TEST-TAX-ID-123',
                registrationStatus: 'approved',
                approvedAt: new Date(),
                admins: [{
                    userId: user._id,
                    addedAt: new Date()
                }],
                subscriptionType: 'unlimited',
                maxUsers: 0,
                subscriptionStatus: 'active',
                subscriptionStartDate: new Date(),
                subscriptionEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year from now
            });

            await company.save();
            console.log(`✅ Created test company: ${company.name}`);
            console.log(`✅ Added ${user.name} as corporate admin`);
        }

        console.log('\n📊 Company Details:');
        console.log(`   ID: ${company._id}`);
        console.log(`   Name: ${company.name}`);
        console.log(`   Status: ${company.registrationStatus}`);
        console.log(`   Admins: ${company.admins.length}`);
        console.log(`   Employees: ${company.employees.length}`);

        console.log('\n✅ Setup complete! You can now access the corporate dashboard.');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

setupCorporateAdmin();
