import { ID, Query } from "appwrite";
import { client, databases, functions } from "../lib/appwrite";
import env, { isAppwriteConfigured } from "../utils/env";
import sampleFacilities from "../data/sampleFacilities";
import {
  CLASSIFICATION_OPTIONS,
  EDIT_STATUS_OPTIONS,
  OWNER_OPTIONS,
  TYPE_OPTIONS,
} from "../utils/constants";

const FALLBACK_GOVERNORATES = [
  ...new Set(sampleFacilities.map((facility) => facility.governorate)),
].map((name, index) => ({
  $id: `gov_${index}`,
  name,
}));

const FALLBACK_EDITS = sampleFacilities.map((facility) => ({
  $id: `edit_${facility.$id}`,
  facilityId: facility.$id,
  action: "seed",
  userId: "mock_user",
  changes: {
    facilityName: facility.facilityName,
    facilityStatus: facility.facilityStatus,
  },
  status: "approved",
  timestamp: facility.updatedAt,
}));

const facilitiesSubscriptionResource =
  env.databaseId && env.facilitiesCollectionId
    ? `databases.${env.databaseId}.collections.${env.facilitiesCollectionId}.documents`
    : null;

function normalizeNumber(value) {
  const parsed = typeof value === "number" ? value : parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function applyFiltersLocally(facilities, filters = {}) {
  const {
    governorate,
    statuses = [],
    facilityTypes = [],
    owners = [],
    classifications = [],
    searchTerm = "",
  } = filters;

  const loweredSearch = searchTerm.trim().toLowerCase();

  return facilities.filter((facility) => {
    if (governorate && facility.governorate !== governorate) {
      return false;
    }

    if (statuses.length > 0 && !statuses.includes(facility.facilityStatus)) {
      return false;
    }

    if (
      facilityTypes.length > 0 &&
      !facilityTypes.includes(facility.facilityTypeLabel)
    ) {
      return false;
    }

    if (owners.length > 0 && !owners.includes(facility.facilityOwner)) {
      return false;
    }

    if (
      classifications.length > 0 &&
      !classifications.includes(facility.facilityClassification)
    ) {
      return false;
    }

    if (loweredSearch.length > 1) {
      const nameMatch =
        facility.facilityName?.toLowerCase().includes(loweredSearch) ||
        facility.establishmentName?.toLowerCase().includes(loweredSearch);
      if (!nameMatch) {
        return false;
      }
    }

    return true;
  });
}

function buildFilterQueries(filters = {}) {
  const queries = [];
  if (filters.governorate) {
    queries.push(Query.equal("governorate", filters.governorate));
  }
  if (filters.statuses?.length) {
    queries.push(Query.equal("facilityStatus", filters.statuses));
  }
  if (filters.facilityTypes?.length) {
    queries.push(Query.equal("facilityTypeLabel", filters.facilityTypes));
  }
  if (filters.owners?.length) {
    queries.push(Query.equal("facilityOwner", filters.owners));
  }
  if (filters.classifications?.length) {
    queries.push(
      Query.equal("facilityClassification", filters.classifications),
    );
  }
  if (filters.searchTerm?.trim()?.length > 1) {
    const term = filters.searchTerm.trim();
    queries.push(Query.search("facilityName", term));
  }
  return queries;
}

export async function listFacilities(filters = {}) {
  if (!isAppwriteConfigured) {
    return {
      total: sampleFacilities.length,
      documents: applyFiltersLocally(sampleFacilities, filters),
      source: "mock",
    };
  }

  try {
    const queries = [
      Query.limit(env.listLimit),
      Query.orderDesc("updatedAt"),
      ...buildFilterQueries(filters),
    ];

    const response = await databases.listDocuments(
      env.databaseId,
      env.facilitiesCollectionId,
      queries,
    );

    return {
      ...response,
      source: "appwrite",
    };
  } catch (error) {
    console.warn(
      "[Facilities] Falling back to mock data because Appwrite request failed.",
      error,
    );
    return {
      total: sampleFacilities.length,
      documents: applyFiltersLocally(sampleFacilities, filters),
      source: "mock",
      error,
    };
  }
}

export async function listGovernorates() {
  if (!isAppwriteConfigured || !env.governoratesCollectionId) {
    return FALLBACK_GOVERNORATES;
  }

  try {
    const response = await databases.listDocuments(
      env.databaseId,
      env.governoratesCollectionId,
      [Query.limit(200), Query.orderAsc("name")],
    );
    return response.documents;
  } catch (error) {
    console.warn(
      "[Governorates] Falling back to mock data because Appwrite request failed.",
      error,
    );
    return FALLBACK_GOVERNORATES;
  }
}

async function createEditLog({ facilityId, userId, action, changes, status }) {
  if (!env.editsCollectionId) {
    return null;
  }

  try {
    return await databases.createDocument(
      env.databaseId,
      env.editsCollectionId,
      ID.unique(),
      {
        facilityId,
        userId,
        action,
        status,
        changes,
        timestamp: new Date().toISOString(),
      },
    );
  } catch (error) {
    console.warn("[EditsLog] Unable to write edit log entry.", error);
    return null;
  }
}

async function validateWithFunction(payload) {
  if (!env.validateFunctionId) {
    return null;
  }
  try {
    return await functions.createExecution(
      env.validateFunctionId,
      JSON.stringify(payload),
      false,
    );
  } catch (error) {
    console.error("[Validation] Remote validation failed.", error);
    throw error;
  }
}

export async function saveFacility(formData, { facilityId, userId } = {}) {
  if (!isAppwriteConfigured) {
    throw new Error(
      "Appwrite environment variables are missing. Cannot persist facility.",
    );
  }

  const longitude = normalizeNumber(formData.longitude);
  const latitude = normalizeNumber(formData.latitude);

  const payload = {
    ...formData,
    longitude,
    latitude,
    location:
      Number.isFinite(longitude) && Number.isFinite(latitude)
        ? {
            type: "Point",
            coordinates: [longitude, latitude],
          }
        : undefined,
    lastEditedBy: userId ?? formData.lastEditedBy ?? "anonymous",
    updatedAt: new Date().toISOString(),
  };

  if (!facilityId) {
    payload.createdAt = new Date().toISOString();
    payload.createdBy = userId ?? "anonymous";
  }

  await validateWithFunction({
    facilityId,
    ...payload,
  });

  const document = facilityId
    ? await databases.updateDocument(
        env.databaseId,
        env.facilitiesCollectionId,
        facilityId,
        payload,
      )
    : await databases.createDocument(
        env.databaseId,
        env.facilitiesCollectionId,
        ID.unique(),
        payload,
      );

  await createEditLog({
    facilityId: document.$id,
    userId: payload.lastEditedBy,
    action: facilityId ? "updated" : "created",
    changes: formData,
    status: "approved",
  });

  return document;
}

export async function getFacilityById(facilityId) {
  if (!facilityId) {
    return null;
  }

  if (!isAppwriteConfigured) {
    return sampleFacilities.find((facility) => facility.$id === facilityId) ?? null;
  }

  try {
    return await databases.getDocument(
      env.databaseId,
      env.facilitiesCollectionId,
      facilityId,
    );
  } catch (error) {
    console.error(`[Facility] Unable to load facility ${facilityId}`, error);
    throw error;
  }
}

export async function listEdits({ status, limit = 25 } = {}) {
  if (!isAppwriteConfigured || !env.editsCollectionId) {
    return FALLBACK_EDITS.slice(0, limit);
  }

  const queries = [Query.orderDesc("$createdAt"), Query.limit(limit)];
  if (status) {
    queries.push(Query.equal("status", status));
  }

  try {
    const response = await databases.listDocuments(
      env.databaseId,
      env.editsCollectionId,
      queries,
    );
    return response.documents;
  } catch (error) {
    console.warn(
      "[Edits] Falling back to mock activity due to Appwrite error.",
      error,
    );
    return FALLBACK_EDITS.slice(0, limit);
  }
}

export async function updateEditStatus(editId, status, adminNotes = "") {
  if (!isAppwriteConfigured || !env.editsCollectionId) {
    throw new Error("Edits collection is not configured in Appwrite.");
  }

  if (!EDIT_STATUS_OPTIONS.includes(status)) {
    throw new Error(`Unsupported status: ${status}`);
  }

  return databases.updateDocument(
    env.databaseId,
    env.editsCollectionId,
    editId,
    { status, adminNotes },
  );
}

export function subscribeToFacilityChanges(callback) {
  if (!facilitiesSubscriptionResource) {
    return () => {};
  }
  const unsubscribe = client.subscribe(
    facilitiesSubscriptionResource,
    callback,
  );
  return () => {
    if (typeof unsubscribe === "function") {
      unsubscribe();
    }
  };
}

export function deriveReferenceOptions(facilities = []) {
  const unique = (values, preset = []) => {
    const set = new Set(preset);
    values.forEach((value) => {
      if (value) {
        set.add(value);
      }
    });
    return Array.from(set).sort();
  };

  return {
    facilityTypes: unique(
      facilities.map((facility) => facility.facilityTypeLabel),
      TYPE_OPTIONS,
    ),
    owners: unique(
      facilities.map((facility) => facility.facilityOwner),
      OWNER_OPTIONS,
    ),
    classifications: unique(
      facilities.map((facility) => facility.facilityClassification),
      CLASSIFICATION_OPTIONS,
    ),
  };
}
