import { createDb, user } from "@repo/db";

// Use environment variable for DB URL or fallback (bun reads .env automatically)
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
    console.error("❌ DATABASE_URL not found in environment");
    process.exit(1);
}

const db = createDb(DATABASE_URL);

const BASE_URL = "http://localhost:8787/api/posts";

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

console.log("Starting CRUD verification...");

// 0. Get Real User
console.log("\n0. fetching User...");
const users = await db.select().from(user).limit(1);
if (users.length === 0) {
    console.error("❌ No users found in database. Please create a user first.");
    process.exit(1);
}
const TEST_USER_ID = users[0].id;
console.log(`✅ Using User ID: ${TEST_USER_ID}`);

// 0.1 Check Server Health
console.log("\n0.1 Checking Server Health...");
const healthRes = await request("/limits", {});
console.log("Limits Check:", JSON.stringify(healthRes, null, 2));

const helloRes = await fetch("http://localhost:8787/dev-worker/hello");
const helloText = await helloRes.text();
console.log("Hello Check:", helloRes.status, helloText);

const now = new Date();
const tomorrow = new Date(now);
tomorrow.setDate(now.getDate() + 1);
const dayAfter = new Date(now);
dayAfter.setDate(now.getDate() + 2);

let createdPostId: string;

// 1. Create Post
console.log("\n1. Testing Create Post...");
const createRes = await request("", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
        userId: TEST_USER_ID,
        content: "Hello CRUD World",
        scheduledAt: tomorrow.toISOString(),
    }),
});
console.log("Create Response:", JSON.stringify(createRes, null, 2));

if (createRes.status === 200 && createRes.data.success) {
    createdPostId = createRes.data.post.id;
    console.log("✅ Post created successfully:", createdPostId);
} else {
    console.error("❌ Failed to create post");
    process.exit(1);
}

// 2. List Posts
console.log("\n2. Testing List Posts...");
const listRes = await request(`?userId=${TEST_USER_ID}`);
console.log("List Response:", JSON.stringify(listRes, null, 2));

if (listRes.status === 200 && listRes.data.success && listRes.data.posts.length > 0) {
    console.log("✅ Posts listed successfully");
    const found = listRes.data.posts.find((p: any) => p.id === createdPostId);
    if (found) {
        console.log("✅ Created post found in list");
    } else {
        console.error("❌ Created post NOT found in list");
    }
} else {
    console.error("❌ Failed to list posts");
}

// 3. Get Post
console.log("\n3. Testing Get Post...");
const getRes = await request(`/${createdPostId}`);
console.log("Get Response:", JSON.stringify(getRes, null, 2));

if (getRes.status === 200 && getRes.data.success && getRes.data.post.id === createdPostId) {
    console.log("✅ Post retrieved successfully");
} else {
    console.error("❌ Failed to get post");
}

// 4. Update Post
console.log("\n4. Testing Update Post...");
const updateRes = await request(`/${createdPostId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
        content: "Updated Content!",
        scheduledAt: dayAfter.toISOString(),
    }),
});
console.log("Update Response:", JSON.stringify(updateRes, null, 2));

if (updateRes.status === 200 && updateRes.data.success) {
    console.log("✅ Post updated successfully");
    if (updateRes.data.post.content === "Updated Content!") {
        console.log("✅ Content updated verified");
    }
} else {
    console.error("❌ Failed to update post");
}

// 5. Delete Post
console.log("\n5. Testing Delete Post...");
const deleteRes = await request(`/${createdPostId}`, {
    method: "DELETE",
});
console.log("Delete Response:", JSON.stringify(deleteRes, null, 2));

if (deleteRes.status === 200 && deleteRes.data.success) {
    console.log("✅ Post deleted successfully");
} else {
    console.error("❌ Failed to delete post");
}

// 6. Verify Deletion
console.log("\n6. Verifying Deletion...");
const verifyRes = await request(`/${createdPostId}`);
console.log("Verify Response:", JSON.stringify(verifyRes, null, 2));

if (verifyRes.status === 404) {
    console.log("✅ Post correctly not found (404)");
} else {
    console.error("❌ Post still exists or wrong status code");
}

console.log("\n🎉 CRUD Verification Complete!");
