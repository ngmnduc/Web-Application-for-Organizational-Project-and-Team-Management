/**
 * Script: Fix Subscription Expired At
 * Chạy: node scripts/fix-expired-at.js
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Stripe from 'stripe';

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const organizationSchema = new mongoose.Schema({}, { strict: false });
const Organization = mongoose.model('Organization', organizationSchema);

async function fixExpiredAt() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // 1. Fix orgs có subscriptionId nhưng expiredAt = null
        const orgsWithSubId = await Organization.find({ 
            plan: 'PREMIUM',
            subscriptionExpiredAt: null,
            subscriptionId: { $exists: true, $ne: null }
        });
        
        console.log(`📦 Found ${orgsWithSubId.length} Premium orgs with null expiredAt (has subscriptionId)`);

        for (const org of orgsWithSubId) {
            try {
                const sub = await stripe.subscriptions.retrieve(org.subscriptionId);
                const expiredAt = new Date(sub.current_period_end * 1000);
                await Organization.findByIdAndUpdate(org._id, { subscriptionExpiredAt: expiredAt });
                console.log(`✅ Fixed ${org.name} → ${expiredAt.toISOString()}`);
            } catch (e) {
                const defaultExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
                await Organization.findByIdAndUpdate(org._id, { subscriptionExpiredAt: defaultExpiry });
                console.log(`⚠️ ${org.name}: Stripe error, set default → ${defaultExpiry.toISOString()}`);
            }
        }

        // 2. Fix orgs không có subscriptionId (cũ, hoặc lỗi)
        const orgsNoSubId = await Organization.find({ 
            plan: 'PREMIUM',
            subscriptionExpiredAt: null
        });
        
        console.log(`📦 Found ${orgsNoSubId.length} Premium orgs with null expiredAt (no subscriptionId)`);

        for (const org of orgsNoSubId) {
            const defaultExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
            await Organization.findByIdAndUpdate(org._id, { subscriptionExpiredAt: defaultExpiry });
            console.log(`✅ Default set for ${org.name} → ${defaultExpiry.toISOString()}`);
        }

        console.log('\n🎉 Done!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

fixExpiredAt();
