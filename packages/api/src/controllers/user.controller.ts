import { Hono } from "hono";
import { createDb } from "@repo/db";
import { user } from "@repo/db";
import { eq } from "drizzle-orm";
import type { Bindings, Variables } from "../types";

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

export const userRoute = app
  // GET /profile - Get current user profile
  .get("/profile", async (c) => {
    const currentUser = c.get("user");
    if (!currentUser) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    return c.json({
      success: true,
      user: {
        id: currentUser.id,
        email: currentUser.email,
        emailVerified: currentUser.emailVerified,
        name: currentUser.name,
        image: currentUser.image,
        createdAt: currentUser.createdAt,
        updatedAt: currentUser.updatedAt,
      },
    });
  })

  // PATCH /profile - Update user profile
  .patch("/profile", async (c) => {
    const currentUser = c.get("user");
    if (!currentUser) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const body = await c.req.json();
    const { name, image } = body;

    // Validate input
    if (!name && !image) {
      return c.json({ error: "At least one field (name or image) is required" }, 400);
    }

    const db = createDb(c.env.DATABASE_URL);

    // Build update object
    const updates: { name?: string; image?: string; updatedAt: Date } = {
      updatedAt: new Date(),
    };

    if (name) updates.name = name;
    if (image) updates.image = image;

    // Update user
    const [updatedUser] = await db
      .update(user)
      .set(updates)
      .where(eq(user.id, currentUser.id))
      .returning();

    if (!updatedUser) {
      return c.json({ error: "Failed to update profile" }, 500);
    }

    return c.json({
      success: true,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        emailVerified: updatedUser.emailVerified,
        name: updatedUser.name,
        image: updatedUser.image,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
      },
    });
  });
