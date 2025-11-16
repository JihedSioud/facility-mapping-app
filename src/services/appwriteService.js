import { ID, Query } from "appwrite";
import { account, client, databases, functions } from "../lib/appwrite";
import env, { isAppwriteConfigured } from "../utils/env";
import sampleFacilities from "../data/sampleFacilities";
import { EDIT_STATUS_OPTIONS } from "../utils/constants";

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

let ensureSessionPromise = null;

async function ensureAppwriteSession() {
  if (!isAppwriteConfigured) {
    return;
  }
  if (ensureSessionPromise) {
    return ensureSessionPromise;
  }
  ensureSessionPromise = account
    .get()
    .catch(async (error) => {
      if (error?.code === 401 || error?.code === 403) {
        await account.createAnonymousSession();
      } else {
        throw error;
      }
    })
    .finally(() => {
      ensureSessionPromise = null;
    });
  return ensureSessionPromise;
}

function resolvePageSize(limit) {
  const parsed =
    limit !== undefined ? Number(limit) : Number(env.listLimit ?? 0);
  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed;
  }
  return 100;
}

async function fetchAllDocuments(collectionId, baseQueries = [], options = {}) {
  await ensureAppwriteSession();
  const pageSize = resolvePageSize(options.limit);
  const documents = [];
  let total = null;
  let cursor = null;

  while (true) {
    const queries = [
      ...baseQueries,
      Query.limit(pageSize),
      ...(cursor ? [Query.cursorAfter(cursor)] : []),
    ];

    const response = await databases.listDocuments(
      env.databaseId,
      collectionId,
      queries,
    );

    if (total === null && typeof response.total === "number") {
      total = response.total;
    }

    if (!response.documents.length) {
      break;
    }

    documents.push(...response.documents);

    if (
      response.documents.length < pageSize ||
      (typeof total === "number" && documents.length >= total)
    ) {
      break;
    }

    const lastDocument = response.documents[response.documents.length - 1];
    if (!lastDocument?.$id) {
      break;
    }
    cursor = lastDocument.$id;
  }

  return {
    total: total ?? documents.length,
    documents,
  };
}

function normalizeNumber(value) {
  const parsed = typeof value === "number" ? value : parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function mapFacilityDocument(document = {}) {
  if (!document) {
    return null;
  }

  const longitude = normalizeNumber(
    document.longitude ??
      document.X ??
      document.Location?.coordinates?.[0] ??
      document.location?.coordinates?.[0],
  );
  const latitude = normalizeNumber(
    document.latitude ??
      document.Y ??
      document.Location?.coordinates?.[1] ??
      document.location?.coordinates?.[1],
  );

  const location =
    document.location ??
    document.Location ??
    (Number.isFinite(longitude) && Number.isFinite(latitude)
      ? {
          type: "Point",
          coordinates: [longitude, latitude],
        }
      : undefined);

  return {
    ...document,
    facilityName: document.facilityName ?? document.name ?? "",
    establishmentName:
      document.establishmentName ??
      document.establishment_name ??
      document.establishment ??
      "",
    governorate: document.governorate ?? "",
    facilityStatus: document.facilityStatus ?? document.STATUS ?? "",
    facilityTypeLabel: document.facilityTypeLabel ?? document.type ?? "",
    facilityOwner: document.facilityOwner ?? document.Owner ?? "",
    facilityAffiliation: document.facilityAffiliation ?? document.FOLLOWS ?? "",
    longitude,
    latitude,
    location,
    createdAt: document.createdAt ?? document.$createdAt ?? null,
    updatedAt: document.updatedAt ?? document.$updatedAt ?? null,
  };
}

function normalizeFacilities(documents = []) {
  return documents.map((document) => mapFacilityDocument(document));
}

function normalizeGovernorates(documents = []) {
  return documents.map((document) => ({
    ...document,
    name: document.name ?? document.NAME ?? document.governorate ?? "",
    name_AR: document.name_AR ?? document.nameAr ?? document.name_ar ?? "",
  }));
}

function mapFacilityFormToAppwrite(payload = {}) {
  const longitude = normalizeNumber(payload.longitude);
  const latitude = normalizeNumber(payload.latitude);
  const location =
    payload.location ??
    (Number.isFinite(longitude) && Number.isFinite(latitude)
      ? { type: "Point", coordinates: [longitude, latitude] }
      : undefined);

  const data = {
    name: payload.facilityName ?? payload.name ?? "",
    governorate: payload.governorate ?? "",
    STATUS: payload.facilityStatus ?? "",
    type: payload.facilityTypeLabel ?? "",
    Owner: payload.facilityOwner ?? "",
    FOLLOWS: payload.facilityAffiliation ?? "",
    X: longitude ?? undefined,
    Y: latitude ?? undefined,
    Location: location,
    lastEditedBy: payload.lastEditedBy,
    createdBy: payload.createdBy,
  };

  Object.keys(data).forEach((key) => {
    if (data[key] === undefined || data[key] === null) {
      delete data[key];
    }
  });

  return data;
}

function applyFiltersLocally(facilities, filters = {}) {
  const {
    governorate,
    statuses = [],
    facilityTypes = [],
    owners = [],
    affiliations = [],
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
      affiliations.length > 0 &&
      !affiliations.includes(facility.facilityAffiliation)
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
    queries.push(Query.equal("STATUS", filters.statuses));
  }
  if (filters.facilityTypes?.length) {
    queries.push(Query.equal("type", filters.facilityTypes));
  }
  if (filters.owners?.length) {
    queries.push(Query.equal("Owner", filters.owners));
  }
  if (filters.affiliations?.length) {
    queries.push(Query.equal("FOLLOWS", filters.affiliations));
  }
  if (filters.searchTerm?.trim()?.length > 1) {
    const term = filters.searchTerm.trim();
    queries.push(Query.search("name", term));
  }
  return queries;
}

export async function listFacilities(filters = {}) {
  if (!isAppwriteConfigured) {
    const filteredDocuments = applyFiltersLocally(sampleFacilities, filters);
    return {
      total: filteredDocuments.length,
      documents: normalizeFacilities(filteredDocuments),
      source: "mock",
    };
  }

  try {
    const response = await fetchAllDocuments(
      env.facilitiesCollectionId,
      [Query.orderDesc("$updatedAt"), ...buildFilterQueries(filters)],
      { limit: env.listLimit },
    );

    return {
      ...response,
      documents: normalizeFacilities(response.documents),
      source: "appwrite",
    };
  } catch (error) {
    console.warn(
      "[Facilities] Falling back to mock data because Appwrite request failed.",
      error,
    );
    const filteredDocuments = applyFiltersLocally(sampleFacilities, filters);
    return {
      total: filteredDocuments.length,
      documents: normalizeFacilities(filteredDocuments),
      source: "mock",
      error,
    };
  }
}

export async function listGovernorates() {
  if (!isAppwriteConfigured || !env.governoratesCollectionId) {
    return normalizeGovernorates(FALLBACK_GOVERNORATES);
  }

  try {
    const response = await fetchAllDocuments(
      env.governoratesCollectionId,
      [Query.orderAsc("name")],
      { limit: 200 },
    );
    return normalizeGovernorates(response.documents);
  } catch (error) {
    console.warn(
      "[Governorates] Falling back to mock data because Appwrite request failed.",
      error,
    );
    return normalizeGovernorates(FALLBACK_GOVERNORATES);
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

  const documentPayload = mapFacilityFormToAppwrite(payload);

  const document = facilityId
    ? await databases.updateDocument(
        env.databaseId,
        env.facilitiesCollectionId,
        facilityId,
        documentPayload,
      )
    : await databases.createDocument(
        env.databaseId,
        env.facilitiesCollectionId,
        ID.unique(),
        documentPayload,
      );

  await createEditLog({
    facilityId: document.$id,
    userId: payload.lastEditedBy,
    action: facilityId ? "updated" : "created",
    changes: formData,
    status: "approved",
  });

  return mapFacilityDocument(document);
}

export async function getFacilityById(facilityId) {
  if (!facilityId) {
    return null;
  }

  if (!isAppwriteConfigured) {
    const facility =
      sampleFacilities.find((item) => item.$id === facilityId) ?? null;
    return facility ? mapFacilityDocument(facility) : null;
  }

  try {
    await ensureAppwriteSession();
    const document = await databases.getDocument(
      env.databaseId,
      env.facilitiesCollectionId,
      facilityId,
    );
    return mapFacilityDocument(document);
  } catch (error) {
    console.error(`[Facility] Unable to load facility ${facilityId}`, error);
    throw error;
  }
}

export async function listEdits({ status, limit = 25 } = {}) {
  if (!isAppwriteConfigured || !env.editsCollectionId) {
    return FALLBACK_EDITS.slice(0, limit);
  }

  await ensureAppwriteSession();
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
    ),
    owners: unique(
      facilities.map((facility) => facility.facilityOwner),
    ),
    affiliations: unique(
      facilities.map((facility) => facility.facilityAffiliation),
    ),
  };
}
