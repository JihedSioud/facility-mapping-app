import { ID, Query } from "appwrite";
import { account, client, databases, functions, teams } from "../lib/appwrite";
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

const STATUS_REPLACEMENTS = new Set([
  "تعمل ولكن لا يمكن الوصول اليه بسبب الوضع الأمني",
  "تعمل ولكن لا يمكن الوصول اليه لسبب أخر (يرجى التحديد)",
]);

function canonicalizeLabel(raw) {
  if (!raw) return "";
  const trimmed = raw.toString().trim();
  if (!trimmed) return "";
  if (trimmed.length <= 5 || trimmed.includes("-")) {
    return trimmed.toUpperCase();
  }
  return trimmed
    .split(/\s+/)
    .map(
      (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
    )
    .join(" ");
}

function normalizeGovernorate(value) {
  if (typeof value !== "string") {
    return value ?? "";
  }
  return value.trim();
}

function normalizeStatus(value) {
  if (typeof value !== "string") {
    return value ?? "";
  }
  const trimmed = value.trim();
  if (STATUS_REPLACEMENTS.has(trimmed)) {
    return "تعمل";
  }
  return trimmed;
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

  const facilityStatus = normalizeStatus(
    document.facilityStatus ?? document.STATUS ?? "",
  );
  const governorate = normalizeGovernorate(
    document.governorate ?? document.Governorate ?? "",
  );

  return {
    ...document,
    facilityName: document.facilityName ?? document.name ?? "",
    establishmentName:
      document.establishmentName ??
      document.establishment_name ??
      document.establishment ??
      "",
    governorate,
    facilityStatus,
    facilityTypeLabel: canonicalizeLabel(
      document.facilityTypeLabel ?? document.type ?? "",
    ),
    facilityOwner: canonicalizeLabel(
      document.facilityOwner ?? document.Owner ?? "",
    ),
    facilityAffiliation: canonicalizeLabel(
      document.facilityAffiliation ?? document.FOLLOWS ?? "",
    ),
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
    name: normalizeGovernorate(
      document.name ?? document.NAME ?? document.governorate ?? "",
    ),
    name_AR: normalizeGovernorate(
      document.name_AR ?? document.nameAr ?? document.name_ar ?? "",
    ),
    boundary: (() => {
      const raw =
        document.boundary ??
        document.BOUNDARY ??
        document.geometry ??
        document.GEOMETRY ??
        null;
      if (typeof raw === "string") {
        try {
          return JSON.parse(raw);
        } catch (error) {
          return null;
        }
      }
      return raw ?? null;
    })(),
  }));
}

function mapFacilityFormToAppwrite(payload = {}) {
  const longitude = normalizeNumber(payload.longitude);
  const latitude = normalizeNumber(payload.latitude);
  const governorate = normalizeGovernorate(payload.governorate ?? "");
  const location =
    payload.location ??
    (Number.isFinite(longitude) && Number.isFinite(latitude)
      ? { type: "Point", coordinates: [longitude, latitude] }
      : undefined);

  const data = {
    name: payload.facilityName ?? payload.name ?? "",
    governorate,
    Governorate: governorate,
    STATUS: normalizeStatus(payload.facilityStatus ?? ""),
    type: canonicalizeLabel(payload.facilityTypeLabel ?? ""),
    Owner: canonicalizeLabel(payload.facilityOwner ?? ""),
    FOLLOWS: canonicalizeLabel(payload.facilityAffiliation ?? ""),
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

  const normalizeFilterValue = (value) =>
    (value ?? "").toString().trim().toLowerCase();

  const loweredSearch = searchTerm.trim().toLowerCase();
  const normalizedGovernorate = normalizeGovernorate(governorate);

  return facilities.filter((facility) => {
    const normalizedStatus = normalizeStatus(
      facility.facilityStatus ?? facility.STATUS ?? "",
    );
    const facilityTypeValue = normalizeFilterValue(
      canonicalizeLabel(facility.facilityTypeLabel ?? facility.type ?? ""),
    );
    const facilityOwnerValue = normalizeFilterValue(
      canonicalizeLabel(facility.facilityOwner ?? facility.Owner ?? ""),
    );
    const facilityAffiliationValue = normalizeFilterValue(
      canonicalizeLabel(
        facility.facilityAffiliation ?? facility.FOLLOWS ?? "",
      ),
    );

    if (
      normalizedGovernorate &&
      normalizeGovernorate(facility.governorate) !== normalizedGovernorate
    ) {
      return false;
    }

    if (statuses.length > 0 && !statuses.includes(normalizedStatus)) {
      return false;
    }

    if (
      facilityTypes.length > 0 &&
      !facilityTypes.some(
        (type) => normalizeFilterValue(type) === facilityTypeValue,
      )
    ) {
      return false;
    }

    if (
      owners.length > 0 &&
      !owners.some(
        (owner) => normalizeFilterValue(owner) === facilityOwnerValue,
      )
    ) {
      return false;
    }

    if (
      affiliations.length > 0 &&
      !affiliations.some(
        (affiliation) =>
          normalizeFilterValue(affiliation) === facilityAffiliationValue,
      )
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
    const normalizedGovernorate = normalizeGovernorate(filters.governorate);
    queries.push(Query.equal("governorate", normalizedGovernorate));
  }
  if (filters.statuses?.length) {
    const normalizedStatuses = filters.statuses.map((status) =>
      normalizeStatus(status),
    );
    const queryStatuses = new Set(normalizedStatuses);
    normalizedStatuses.forEach((status) => {
      if (status === "تعمل") {
        STATUS_REPLACEMENTS.forEach((original) => queryStatuses.add(original));
      }
    });
    queries.push(Query.equal("STATUS", Array.from(queryStatuses)));
  }
  if (filters.facilityTypes?.length) {
    const normalizedTypes = filters.facilityTypes.map((type) =>
      canonicalizeLabel(type),
    );
    queries.push(Query.equal("type", normalizedTypes));
  }
  if (filters.owners?.length) {
    const normalizedOwners = filters.owners.map((owner) =>
      canonicalizeLabel(owner),
    );
    queries.push(Query.equal("Owner", normalizedOwners));
  }
  if (filters.affiliations?.length) {
    const normalizedAffiliations = filters.affiliations.map((aff) =>
      canonicalizeLabel(aff),
    );
    queries.push(Query.equal("FOLLOWS", normalizedAffiliations));
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

function resolveTeamId(teamKey) {
  if (teamKey === "admin") {
    return env.adminsTeamId ?? null;
  }
  if (teamKey === "editor") {
    return env.editorsTeamId ?? null;
  }
  return null;
}

export async function inviteUserToTeam({ email, name = "", role = "member", team }) {
  if (!isAppwriteConfigured) {
    throw new Error("Appwrite is not configured.");
  }
  const teamId = resolveTeamId(team);
  if (!teamId) {
    throw new Error(
      `Team id for "${team}" is not configured. Please set env variables for adminsTeamId/editorsTeamId.`,
    );
  }

  // Appwrite requires a redirect URL for invitation confirmation. Use current origin as fallback.
  const url =
    env.inviteRedirectUrl ??
    (typeof window !== "undefined"
      ? `${window.location.origin}/`
      : "https://appwrite.io");

  return teams.createMembership(teamId, [role], email, url, name || email);
}

export function deriveReferenceOptions(facilities = []) {
  const uniqueCaseInsensitive = (values, preset = []) => {
    const map = new Map();

    [...preset, ...values].forEach((value) => {
      const display = canonicalizeLabel(value);
      if (!display) return;
      const key = display.toLowerCase();
      if (!map.has(key)) {
        map.set(key, display);
      }
    });

    return Array.from(map.values()).sort((a, b) =>
      a.toString().localeCompare(b.toString(), undefined, { sensitivity: "base" }),
    );
  };

  return {
    facilityTypes: uniqueCaseInsensitive(
      facilities.map((facility) => facility.facilityTypeLabel),
    ),
    owners: uniqueCaseInsensitive(
      facilities.map((facility) => facility.facilityOwner),
    ),
    affiliations: uniqueCaseInsensitive(
      facilities.map((facility) => facility.facilityAffiliation),
    ),
    statuses: uniqueCaseInsensitive(
      facilities.map((facility) => facility.facilityStatus),
      [],
    ),
  };
}
