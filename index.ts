import mariadb from "mariadb";
import { serve } from "bun";

// สร้าง connection pool
const pool = mariadb.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT || 3306),
  waitForConnections: true,
  connectionLimit: 10,        // จำนวน connection สูงสุด
  queueLimit: 0,
  acquireTimeout: 60000,      // timeout การขอ connection
  timeout: 60000,             // query timeout
  reconnect: true             // auto reconnect
});

serve({
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url);

    if (req.method === "GET" && url.pathname === "/") {
      return new Response(JSON.stringify({ message: "Hello World from Bun (MariaDB)" }), {
        headers: { "Content-Type": "application/json" },
      });

    } else if (req.method === "POST" && url.pathname === "/users") {
      try {
        const { username, email } = await req.json();
        if (!username || !email) {
          return new Response(JSON.stringify({ error: "username and email are required" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        const conn = await pool.getConnection();
        try {
          const result = await conn.query("INSERT INTO users (username, email) VALUES (?, ?)", [username, email]);
          return new Response(JSON.stringify({ message: "User created successfully", user_id: Number(result.insertId) }), {
            status: 201,
            headers: { "Content-Type": "application/json" },
          });
        } finally {
          conn.release();
        }

      } catch (error) {
        return new Response(JSON.stringify({ error: "Database error", detail: error.message }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }

    } else if (req.method === "GET" && url.pathname.startsWith("/users/")) {
      const parts = url.pathname.split("/");
      const intUserId = parts[2];
      if (intUserId && !isNaN(Number(intUserId))) {
        try {
          const conn = await pool.getConnection();
          try {
            const rows = await conn.query("SELECT user_id, username, email FROM users WHERE user_id = ?", [intUserId]);
            if (rows.length === 0) {
              return new Response(JSON.stringify({ error: "User not found" }), {
                status: 404,
                headers: { "Content-Type": "application/json" },
              });
            }
            const user = rows[0];
            return new Response(JSON.stringify(user), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            });
          } finally {
            conn.release();
          }
        } catch (error) {
          return new Response(JSON.stringify({ error: "Database error", detail: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      } else {
        return new Response(JSON.stringify({ error: "Invalid user_id" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

    } else {
      return new Response(JSON.stringify({ error: "Not Found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
});
