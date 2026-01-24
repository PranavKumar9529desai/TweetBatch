import { createDb, user } from "@repo/db";
import { NotificationService } from "../packages/api/src/services/notification";

// Use environment variable for DB URL or fallback (bun reads .env automatically)
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
    console.error("❌ DATABASE_URL not found in environment");
    process.exit(1);
}

const db = createDb(DATABASE_URL);
const BASE_URL = "http://localhost:8787/api/notifications";

async function request(path: string, options: RequestInit = {}) {
    const url = `${BASE_URL}${path}`;
    const response = await fetch(url, options);
    const text = await response.text();
    try {
        const data = JSON.parse(text);
        return { status: response.status, data };
    } catch (e) {
        console.error(`Failed to parse JSON. Status: ${response.status}`);
        console.error("Response body:", text);
        return { status: response.status, data: null, error: "Invalid JSON" };
    }
}

console.log("Starting Notification Verification...");

// 0. Get Real User
console.log("\n0. fetching User...");
const users = await db.select().from(user).limit(1);
if (users.length === 0) {
    console.error("❌ No users found in database.");
    process.exit(1);
}
const TEST_USER_ID = users[0].id;
console.log(`✅ Using User ID: ${TEST_USER_ID}`);

// 1. Create Notification (via Service)
console.log("\n1. creating Test Notification...");
const service = new NotificationService(db);
const notification = await service.createNotification({
    userId: TEST_USER_ID,
    type: "system",
    message: "Test notification",
    data: { foo: "bar" },
});
const notificationId = notification.id;
console.log(`✅ Created notification: ${notificationId}`);

// 2. List Notifications (via API)
console.log("\n2. Testing List Notifications...");
const listRes = await request(`/?userId=${TEST_USER_ID}`);
console.log("List Response:", JSON.stringify(listRes, null, 2));

if (listRes.status === 200 && listRes.data.success && listRes.data.notifications.length > 0) {
    const found = listRes.data.notifications.find((n: any) => n.id === notificationId);
    if (found) {
        console.log("✅ Created notification found in list");
        if (found.isRead === false) {
            console.log("✅ isRead is correctly false");
        } else {
            console.error("❌ isRead should be false");
        }
    } else {
        console.error("❌ Created notification NOT found in list");
    }
} else {
    console.error("❌ Failed to list notifications");
}

// 3. Mark as Read (via API)
console.log("\n3. Testing Mark as Read...");
const readRes = await request(`/${notificationId}/read?userId=${TEST_USER_ID}`, {
    method: "PATCH",
});
console.log("Read Response:", JSON.stringify(readRes, null, 2));

if (readRes.status === 200 && readRes.data.success && readRes.data.notification.isRead === true) {
    console.log("✅ Notification marked as read");
} else {
    console.error("❌ Failed to mark notification as read");
}

// 4. Verify Read Status (via API)
console.log("\n4. Verifying Read Status...");
const verifyRes = await request(`/?userId=${TEST_USER_ID}`);
const verifiedInit = verifyRes.data.notifications.find((n: any) => n.id === notificationId);

if (verifiedInit && verifiedInit.isRead === true) {
    console.log("✅ Notification validated as read in list");
} else {
    console.error("❌ Notification still unread or not found");
}

console.log("\n🎉 Notification Verification Complete!");
export { };
