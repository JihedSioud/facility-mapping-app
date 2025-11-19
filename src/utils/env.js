const env = {
  projectId: import.meta.env.VITE_APPWRITE_PROJECT_ID ?? "",
  endpoint: import.meta.env.VITE_APPWRITE_ENDPOINT ?? "",
  databaseId: import.meta.env.VITE_APPWRITE_DATABASE_ID ?? "",
  facilitiesCollectionId:
    import.meta.env.VITE_APPWRITE_FACILITIES_COLLECTION_ID ?? "",
  governoratesCollectionId:
    import.meta.env.VITE_APPWRITE_GOVERNORATES_COLLECTION_ID ?? "",
  editsCollectionId: import.meta.env.VITE_APPWRITE_EDITS_COLLECTION_ID ?? "",
  accessRequestsCollectionId:
    import.meta.env.VITE_APPWRITE_ACCESS_REQUESTS_COLLECTION_ID ?? "",
  validateFunctionId:
    import.meta.env.VITE_APPWRITE_VALIDATE_FUNCTION_ID ?? "",
  editorsTeamId: import.meta.env.VITE_APPWRITE_EDITORS_TEAM_ID ?? "",
  adminsTeamId: import.meta.env.VITE_APPWRITE_ADMINS_TEAM_ID ?? "",
  visitorsTeamId: import.meta.env.VITE_APPWRITE_VISITORS_TEAM_ID ?? "",
  addTeamMembershipUrl:
    import.meta.env.VITE_APPWRITE_ADD_TEAM_MEMBERSHIP_URL ?? "",
  addTeamMembershipToken:
    import.meta.env.VITE_APPWRITE_ADD_TEAM_MEMBERSHIP_TOKEN ?? "",
  listLimit: Number(import.meta.env.VITE_APPWRITE_LIST_LIMIT ?? 500),
};

export const isAppwriteConfigured =
  Boolean(env.projectId) &&
  Boolean(env.endpoint) &&
  Boolean(env.databaseId) &&
  Boolean(env.facilitiesCollectionId);

export default env;
