import { createDb } from ".";

const db = createDb(process.env.DATABASE_URL!);

const alluserdata = await db.query.user.findMany({
    with: {
        accounts: true,
        sessions: true,
    },
});
console.dir(alluserdata, { depth: Infinity }); s