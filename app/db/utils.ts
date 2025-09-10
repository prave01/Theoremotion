import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL || "no url";

const pg = neon(url);

export { pg };
