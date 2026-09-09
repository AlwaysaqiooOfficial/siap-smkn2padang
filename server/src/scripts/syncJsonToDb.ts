import { loadCollections } from "../services/jsonDatabase";

/** Compatibility command: GitHub JSON is the source of truth; no local database sync is needed. */
loadCollections()
  .then(() => console.log("✅ GitHub JSON collections verified"))
  .catch((error) => {
    console.error("❌ GitHub JSON verification failed", error);
    process.exitCode = 1;
  });
