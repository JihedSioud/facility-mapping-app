/* eslint-env node */
/* global process */
import { Client, Databases, Query } from "node-appwrite";

export default async ({ req, res, log, error }) => {
  // Validate facility edit before persisting
  
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(req.headers["x-appwrite-key"]);

  const databases = new Databases(client);

  try {
    const {
      facilityId,
      facilityName,
      longitude,
      latitude,
      governorate,
    } = JSON.parse(req.body ?? "{}");

    // Validate coordinates
    if (longitude < -180 || longitude > 180) {
      throw new Error("Invalid longitude; must be between -180 and 180");
    }
    if (latitude < -90 || latitude > 90) {
      throw new Error("Invalid latitude; must be between -90 and 90");
    }

    // Validate name is not empty
    if (!facilityName || facilityName.trim().length === 0) {
      throw new Error("Facility name cannot be empty");
    }

    // Check for duplicate by name and governorate (optional)
    const existing = await databases.listDocuments(
      process.env.APPWRITE_DATABASE_ID,
      "facilities",
      [
        Query.equal("facilityName", facilityName),
        Query.equal("governorate", governorate),
      ],
    );

    if (existing.documents.length > 0 && existing.documents[0].$id !== facilityId) {
      // Duplicate found (and it's not the same document being updated)
      throw new Error(
        `Facility "${facilityName}" already exists in ${governorate}`,
      );
    }

    log("Validation passed for facility");
    return res.json({ success: true, message: "Validation successful" });

  } catch (err) {
    error(`Validation error: ${err.message}`);
    return res.json({ success: false, error: err.message }, 400);
  }
};
