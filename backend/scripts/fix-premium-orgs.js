/**
 * Script: Fix Premium Organizations
 * Mục đích: Cập nhật subscriptionStatus = 'ACTIVE' cho tất cả organization có plan = 'PREMIUM'
 * và set subscriptionExpiredAt từ Stripe nếu có subscriptionId
 * 
 * Chạy: node scripts/fix-premium-orgs.js
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Stripe from 'stripe';

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Define Organization Schema (loose)
const organizationSchema = new mongoose.Schema({}, { strict: false });
const Organization = mongoose.model('Organization', organizationSchema);

async function fixPremiumOrganizations() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Lấy tất cả organization có plan PREMIUM
        const premiumOrgs = await Organization.find({ plan: 'PREMIUM' });
        console.log(`📦 Found ${premiumOrgs.length} Premium organizations`);

        for (const org of premiumOrgs) {
            const updates = {};
            
            // Fix 1: Set subscriptionStatus = ACTIVE nếu đang undefined/null
            if (!org.subscriptionStatus) {
                updates.subscriptionStatus = 'ACTIVE';
            }

            // Fix 2: Lấy subscriptionExpiredAt từ Stripe nếu có subscriptionId
            if (org.subscriptionId && !org.subscriptionExpiredAt) {
                try {
                    const subscription = await stripe.subscriptions.retrieve(org.subscriptionId);
                    if (subscription.current_period_end) {
                        updates.subscriptionExpiredAt = new Date(subscription.current_period_end * 1000);
                        console.log(`  📅 Got expiry date from Stripe for ${org.name}: ${updates.subscriptionExpiredAt}`);
                    }
                } catch (stripeErr) {
                    console.log(`  ⚠️ Stripe error for ${org.name}: ${stripeErr.message}`);
                    // Nếu không lấy được từ Stripe, set mặc định 30 ngày từ bây giờ
                    updates.subscriptionExpiredAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
                }
            }

            // Fix 3: Nếu không có subscriptionId, set expiredAt mặc định
            if (!org.subscriptionId && !org.subscriptionExpiredAt) {
                updates.subscriptionExpiredAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
            }

            // Apply updates
            if (Object.keys(updates).length > 0) {
                await Organization.findByIdAndUpdate(org._id, updates);
                console.log(`✅ Updated ${org.name}:`, updates);
            } else {
                console.log(`⏭️ Skipped ${org.name} (already up to date)`);
            }
        }

        console.log('\n🎉 Done! All Premium organizations have been fixed.');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

fixPremiumOrganizations();
