import SavedMagazine from "@/components/magazine/SavedMagazine";

/**
 * Phase 1 magazine replaces the legacy <CollectionsPage />. /collections now
 * renders the editorial saved-looks page backed by the brain /saved endpoint.
 */
export default function Collections() {
  return <SavedMagazine />;
}
