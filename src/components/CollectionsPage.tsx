"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { useSavedCollections } from "@/contexts/SavedCollectionsContext";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import { BottomNav } from "@/components/BottomNav";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

/**
 * CollectionsPage displays saved collections with Items/Outfits tabs.
 * Allows creating new collections via a bottom sheet.
 */
export function CollectionsPage() {
  const router = useRouter();
  const { collections, createCollection } = useSavedCollections();
  const [newCollectionName, setNewCollectionName] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState("items");

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleCreateCollection = () => {
    if (newCollectionName.trim()) {
      createCollection(newCollectionName.trim());
      setNewCollectionName("");
      setSheetOpen(false);
      toast.success("Collection created successfully");
    }
  };

  const handleBackFromCreate = () => {
    setSheetOpen(false);
    setNewCollectionName("");
  };

  const handleTabChange = (value: string) => {
    setCurrentTab(value);
  };

  const handleCollectionClick = (collectionId: string, collectionName: string) => {
    router.push("/products?userCollection=" + collectionId + "&label=" + encodeURIComponent(collectionName));
  };

  return (
    <div className="min-h-screen bg-white text-black flex flex-col max-w-md mx-auto">
      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-24">
        {/* Page Heading with Create Button */}
        <div className="px-6 pt-12 pb-4">
          <div className="flex items-center justify-between">
            <h1 style={{ fontSize: '28px' }}>Saved condiments</h1>
            <button
              onClick={() => setSheetOpen(true)}
              className="p-2 active:bg-gray-100 transition-colors focus:outline-none"
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="w-full">
          {/* Custom Tabs Header */}
          <div className="flex items-center px-6 mb-6">
            <button
              onClick={() => handleTabChange("items")}
              className={`flex-1 pb-3 relative transition-colors flex justify-center ${currentTab === "items" ? "text-black" : "text-gray-500"
                }`}
            >
              <span className="relative inline-block">
                Items
                {currentTab === "items" && (
                  <div
                    className="absolute bottom-[-12px] left-1/2 -translate-x-1/2 w-[300%] h-[1px]"
                    style={{
                      background: 'linear-gradient(to right, transparent 0%, rgba(0, 0, 0, 0.15) 50%, transparent 100%)'
                    }}
                  />
                )}
              </span>
            </button>
            <button
              onClick={() => handleTabChange("outfits")}
              className={`flex-1 pb-3 relative transition-colors flex justify-center ${currentTab === "outfits" ? "text-black" : "text-gray-500"
                }`}
            >
              <span className="relative inline-block">
                Outfits
                {currentTab === "outfits" && (
                  <div
                    className="absolute bottom-[-12px] left-1/2 -translate-x-1/2 w-[300%] h-[1px]"
                    style={{
                      background: 'linear-gradient(to right, transparent 0%, rgba(0, 0, 0, 0.15) 50%, transparent 100%)'
                    }}
                  />
                )}
              </span>
            </button>
          </div>

          {/* Tab Content */}
          {currentTab === "items" && (
            <div className="px-6">
              {collections.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 mx-auto mb-4 border border-gray-200 flex items-center justify-center rounded-[8px] shadow-[0px_1px_2px_0px_rgba(14,31,53,0.06)]">
                    <Plus className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-600 mb-2">No collections yet</p>
                  <p className="text-gray-400">
                    Create a collection to start organizing your items
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-x-6 gap-y-8">
                  {collections.map((collection) => (
                    <button
                      key={collection.id}
                      onClick={() => {
                        if (collection.itemCount === 0) {
                          toast("0 products. browse to find condiments");
                        } else {
                          handleCollectionClick(collection.id, collection.name);
                        }
                      }}
                      className="text-left group focus:outline-none"
                    >
                      {/* Thumbnail */}
                      <div className="aspect-square bg-gray-50 border border-gray-200 mb-3 overflow-hidden active:border-gray-300 transition-colors rounded-[8px] shadow-[0px_1px_3px_0px_rgba(14,31,53,0.08)]">
                        {collection.thumbnail ? (
                          <ImageWithFallback
                            src={collection.thumbnail}
                            alt={collection.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Plus className="w-8 h-8 text-gray-300" />
                          </div>
                        )}
                      </div>

                      {/* Collection Info */}
                      <div>
                        <h3 className="mb-1 line-clamp-1">
                          {collection.name}
                        </h3>
                        <p className="text-gray-500">
                          {collection.itemCount} {collection.itemCount === 1 ? "item" : "items"}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {currentTab === "outfits" && (
            <div className="px-6">
              <div className="text-center py-16">
                <div className="w-16 h-16 mx-auto mb-4 border border-gray-200 flex items-center justify-center rounded-[8px] shadow-[0px_1px_2px_0px_rgba(14,31,53,0.06)]">
                  <Plus className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-600 mb-2">No outfits yet</p>
                <p className="text-gray-400">
                  Coming soon - create and save complete outfits
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNav />

      {/* Create New Collection Bottom Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent
          side="bottom"
          className="bg-white border-t border-gray-200 text-black max-w-md mx-auto rounded-t-[24px] p-0 focus:outline-none focus-visible:outline-none [&>button]:hidden shadow-[0px_-2px_4px_0px_rgba(14,31,53,0.12)]"
        >
          <SheetTitle className="sr-only">Create New Collection</SheetTitle>
          <SheetDescription className="sr-only">
            Enter a name for your new collection
          </SheetDescription>

          <SheetHeader onClose={() => setSheetOpen(false)}>
            <h2 className="text-xl font-medium">Create New Collection</h2>
            <p className="text-gray-500 text-sm">Enter a name for your collection</p>
          </SheetHeader>

          {/* Create Form */}
          <div className="px-6 pt-6 pb-6">
            <Input
              value={newCollectionName}
              onChange={(e) => setNewCollectionName(e.target.value)}
              placeholder="Collection name"
              className="bg-[#f3f3f5] border-transparent text-black rounded-[8px] placeholder:text-gray-400 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none mb-6 h-[48px] px-4"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleCreateCollection();
                }
              }}
              autoFocus
            />
            <button
              onClick={handleCreateCollection}
              disabled={!newCollectionName.trim()}
              className="w-full h-[48px] bg-black text-white active:bg-gray-800 transition-colors flex items-center justify-center uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none rounded-[8px]"
            >
              Create & Save
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
