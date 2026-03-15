"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Bookmark, ArrowLeft, X } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { useSavedCollections } from "@/contexts/SavedCollectionsContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import { PrimaryButton } from "@/components/shared/PrimaryButton";
import { TextInput } from "@/components/shared/TextInput";
import { SignInSheet } from "@/components/SignInSheet";

interface SaveToCollectionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  productName: string;
  savedCollectionIds: string[];  // Collection IDs this product is already saved in
  onSaveSuccess?: (updatedCollectionIds: string[]) => void;
}

export function SaveToCollectionSheet({
  open,
  onOpenChange,
  productId,
  productName,
  savedCollectionIds,
  onSaveSuccess,
}: SaveToCollectionSheetProps) {
  const { collections, createCollection, batchUpdateCollections } = useSavedCollections();
  const { isAuthenticated } = useAuth();
  const [toggledCollections, setToggledCollections] = useState<Set<string>>(new Set());
  const [showCreateView, setShowCreateView] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [showSignInSheet, setShowSignInSheet] = useState(false);

  // Create a set of saved collection IDs for quick lookup
  const savedCollectionIdsSet = useMemo(() => new Set(savedCollectionIds), [savedCollectionIds]);

  // Auto-show sign-in sheet when not authenticated
  useEffect(() => {
    if (open && !isAuthenticated) {
      setShowSignInSheet(true);
      onOpenChange(false); // Close the save sheet
    }
  }, [open, isAuthenticated]);

  // Reset state when sheet opens
  useEffect(() => {
    if (open && isAuthenticated) {
      setToggledCollections(new Set());
      setShowCreateView(false);
      setNewCollectionName("");
    }
  }, [open, isAuthenticated]);

  // Check if product is currently in collection (accounting for toggles)
  const isCurrentlyInCollection = (collectionId: string) => {
    const wasInCollection = savedCollectionIdsSet.has(collectionId);
    const wasToggled = toggledCollections.has(collectionId);
    return wasToggled ? !wasInCollection : wasInCollection;
  };

  const handleBookmarkToggle = (collectionId: string) => {
    setToggledCollections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(collectionId)) {
        newSet.delete(collectionId);
      } else {
        newSet.add(collectionId);
      }
      return newSet;
    });
  };

  const handleSave = async () => {
    // Build add/remove arrays based on toggles
    const add: string[] = [];
    const remove: string[] = [];

    for (const collectionId of toggledCollections) {
      const wasInCollection = savedCollectionIdsSet.has(collectionId);

      if (wasInCollection) {
        remove.push(collectionId);
      } else {
        add.push(collectionId);
      }
    }

    // Skip API call if no changes were made
    if (add.length === 0 && remove.length === 0) {
      onOpenChange(false);
      return;
    }

    // Call batch update API
    const success = await batchUpdateCollections(productId, add, remove);

    if (success) {
      // Calculate final collection IDs
      const finalCollectionIds = collections
        .filter((collection) => isCurrentlyInCollection(collection.id))
        .map(c => c.id);

      if (finalCollectionIds.length > 0) {
        toast.success(`Saved to ${finalCollectionIds.length} ${finalCollectionIds.length === 1 ? 'collection' : 'collections'}`);
      }

      // Notify parent of updated collection IDs
      onSaveSuccess?.(finalCollectionIds);
    }

    onOpenChange(false);
    setToggledCollections(new Set());
  };

  const handleCreateNewCollection = async () => {
    if (newCollectionName.trim()) {
      const newCollection = await createCollection(newCollectionName.trim());
      if (newCollection) {
        // Add product to new collection
        const success = await batchUpdateCollections(productId, [newCollection.id], []);

        if (success) {
          toast.success(`Saved to ${newCollection.name}`);
          // Notify parent with updated collection IDs (existing + new)
          onSaveSuccess?.([...savedCollectionIds, newCollection.id]);
        }

        setNewCollectionName("");
        setShowCreateView(false);
        onOpenChange(false);
      }
    }
  };

  const handleBackFromCreate = () => {
    setShowCreateView(false);
    setNewCollectionName("");
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          className="bg-white border-t border-gray-200 text-black max-w-md mx-auto rounded-t-[24px] p-0 focus:outline-none focus-visible:outline-none [&>button]:hidden shadow-[0px_-2px_4px_0px_rgba(14,31,53,0.12)]"
        >
          <SheetTitle className="sr-only">
            {showCreateView ? "Create New Collection" : "Save to Collection"}
          </SheetTitle>
          <SheetDescription className="sr-only">
            {showCreateView
              ? "Enter a name for your new collection"
              : `Choose collections to save ${productName}`}
          </SheetDescription>

          {!isAuthenticated ? null : showCreateView ? (
            // Create New Collection View
            <>
              {/* Header with Back Button */}
              <div className="px-6 pt-6">
                <div className="flex items-center gap-4">
                  <button
                    onClick={handleBackFromCreate}
                    className="text-gray-500 active:text-black transition-colors focus:outline-none"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <h2 className="text-xl font-medium">Create New Collection</h2>
                </div>
              </div>

              {/* Create Form */}
              <div className="px-6 pt-6 pb-6">
                <TextInput
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  placeholder="Collection name"
                  className="mb-6"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleCreateNewCollection();
                    }
                  }}
                  autoFocus
                />
                <PrimaryButton
                  onClick={handleCreateNewCollection}
                  disabled={!newCollectionName.trim()}
                  className="w-full"
                >
                  Create & Save
                </PrimaryButton>
              </div>
            </>
          ) : (
            // Save to Collection View
            <>
              <SheetHeader onClose={() => onOpenChange(false)}>
                <h2 className="text-xl font-medium">Save to Collection</h2>
                <button
                  onClick={() => setShowCreateView(true)}
                  className="text-gray-500 active:text-black transition-colors focus:outline-none text-left"
                >
                  + New Collection
                </button>
              </SheetHeader>

              <div className="px-6 pt-4 pb-6">
                {collections.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600 mb-6">
                      You don&apos;t have any collections yet.
                    </p>
                    <PrimaryButton
                      onClick={() => setShowCreateView(true)}
                      className="w-full"
                    >
                      Create Collection
                    </PrimaryButton>
                  </div>
                ) : (
                  <div className="space-y-0">
                    {/* Collection items */}
                    <div className="space-y-0 -mx-6">
                      {collections.map((collection) => {
                        const isInCollection = isCurrentlyInCollection(collection.id);

                        return (
                          <div
                            key={collection.id}
                            className="w-full flex items-center gap-3 px-6 py-3 border-b border-gray-200 last:border-b-0"
                          >
                            {/* Thumbnail */}
                            <div className="w-12 h-12 bg-gray-50 border border-gray-200 flex items-center justify-center flex-shrink-0 overflow-hidden rounded-[8px] shadow-[0px_1px_2px_0px_rgba(14,31,53,0.06)]">
                              {collection.thumbnail ? (
                                <ImageWithFallback
                                  src={collection.thumbnail}
                                  alt={collection.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <Bookmark className="w-5 h-5 text-gray-400" />
                              )}
                            </div>

                            {/* Collection info */}
                            <div className="flex-1 min-w-0">
                              <p className="truncate">{collection.name}</p>
                              <p className="text-gray-500 mt-0.5">
                                {collection.itemCount} items
                              </p>
                            </div>

                            {/* Bookmark toggle button */}
                            <button
                              onClick={() => handleBookmarkToggle(collection.id)}
                              className="flex-shrink-0 focus:outline-none text-gray-500 active:text-black transition-colors"
                            >
                              <Bookmark
                                className={`w-5 h-5 ${isInCollection ? 'fill-black text-black' : ''}`}
                              />
                            </button>
                          </div>
                        );
                      })}
                    </div>

                    {/* Primary CTA */}
                    <div className="mt-6">
                      <PrimaryButton
                        onClick={handleSave}
                        className="w-full"
                      >
                        Save
                      </PrimaryButton>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Separate Sign In Sheet */}
      <SignInSheet
        open={showSignInSheet}
        onOpenChange={(open) => {
          setShowSignInSheet(open);
          if (!open && isAuthenticated) {
            // After signing in, reopen the save collection sheet
            onOpenChange(true);
          }
        }}
      />
    </>
  );
}
