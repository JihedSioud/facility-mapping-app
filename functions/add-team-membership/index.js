import { Client, Teams, Users, Query } from "node-appwrite";

/**
 * Securely add a user to a team without email confirmation.
 *
 * Environment variables required on the Function:
 * - APPWRITE_API_KEY: server key with Teams scope
 *
 * Request body (JSON):
 * - teamId (string, required)
 * - userId (string) OR email (string) -- at least one is required
 * - roles (array of strings, optional, defaults to ["editor"])
 *
 * Security:
 * - This should only be callable by admins. Gate it by checking a shared secret
 *   header (e.g., X-ADMIN-TOKEN) or by restricting execution to admin users via
 *   Appwrite’s built-in authentication (APPWRITE_FUNCTION_USER_ID).
 */

export default async ({ req, res, log }) => {
  try {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
      return res.send(
        "",
        204,
        {
          "Access-Control-Allow-Origin": req.headers.origin || "*",
          "Access-Control-Allow-Methods": "POST,OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type,X-ADMIN-TOKEN",
        },
      );
    }

    // Appwrite may hand us a string or an object; normalize safely.
    const parsed =
      typeof req.body === "string"
        ? JSON.parse(req.body || "{}")
        : req.body || {};
    const body = parsed && typeof parsed === "object" ? parsed : {};
    const { teamId, userId: rawUserId, email: rawEmail, roles = ["editor"] } =
      body;

    if (!teamId || (!rawUserId && !rawEmail)) {
      return res.json({ error: "Missing teamId and userId/email" }, 400);
    }

    // Simple shared-secret guard (optional but recommended)
    const expectedSecret = process.env.ADMIN_FUNCTION_TOKEN;
    if (expectedSecret) {
      const provided = req.headers["x-admin-token"];
      if (provided !== expectedSecret) {
        return res.json({ error: "Unauthorized" }, 401);
      }
    }

    const endpoint =
      process.env.APPWRITE_FUNCTION_ENDPOINT || process.env.APPWRITE_ENDPOINT;
    const project =
      process.env.APPWRITE_FUNCTION_PROJECT_ID ||
      process.env.APPWRITE_PROJECT_ID;

    if (!endpoint || !project || !process.env.APPWRITE_API_KEY) {
      return res.json(
        { error: "Missing Appwrite endpoint/project/api key in env" },
        500,
      );
    }

    const client = new Client()
      .setEndpoint(endpoint)
      .setProject(project)
      .setKey(process.env.APPWRITE_API_KEY);

    const teams = new Teams(client);
    const users = new Users(client);

    let userId = (rawUserId || "").trim();
    let displayName = "";
    let membershipEmail = rawEmail?.toLowerCase().trim() || "";

    // If only email is provided, look up the user by email.
    if (!userId && rawEmail) {
      const email = rawEmail.toLowerCase().trim();
      const list = await users.list([
        Query.equal("email", email),
        Query.limit(5),
      ]);
      const match = list.users?.[0] ?? null;
      if (!match) {
        return res.json(
          { error: `No user found with email ${rawEmail}` },
          404,
        );
      }
      userId = match.$id || match.id;
      membershipEmail = match.email || membershipEmail || rawEmail;
      displayName = match.name || match.email || rawEmail;
    }

    // If we received only userId, fetch user to align email/name for Appwrite validation.
    if (userId && !membershipEmail) {
      try {
        const fetched = await users.get(userId);
        membershipEmail = fetched.email || membershipEmail;
        displayName = displayName || fetched.name || fetched.email;
      } catch (error) {
        // keep going; creation may still succeed if email is not strictly required
      }
    }

    if (!userId) {
      return res.json({ error: "Unable to resolve userId" }, 400);
    }

    if (!displayName) {
      displayName = rawEmail || rawUserId || "Member";
    }
    displayName = displayName.toString().trim() || "Member";
    // Appwrite name constraint: 1-128 chars.
    displayName = displayName.slice(0, 128);

    const redirectUrl =
      process.env.APPWRITE_INVITE_REDIRECT_URL ||
      req.headers.origin ||
      "https://appwrite.io";

    const membership = await teams.createMembership(
      teamId,
      roles,
      // Appwrite v14 requires email, and it must match the user when userId is supplied
      membershipEmail || "placeholder@example.com",
      userId,
      undefined,
      redirectUrl,
      displayName,
    );

    return res.json(
      { ok: true, membership },
      200,
      {
        "Access-Control-Allow-Origin": req.headers.origin || "*",
        "Access-Control-Allow-Methods": "POST,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type,X-ADMIN-TOKEN",
      },
    );
  } catch (err) {
    log(err);
    return res.json(
      { error: err.message ?? "Internal error" },
      500,
      {
        "Access-Control-Allow-Origin": req.headers.origin || "*",
        "Access-Control-Allow-Methods": "POST,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type,X-ADMIN-TOKEN",
      },
    );
  }
};
