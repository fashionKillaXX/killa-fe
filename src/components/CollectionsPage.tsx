"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Sparkles } from "lucide-react";
import { useSavedCollections } from "@/contexts/SavedCollectionsContext";
import { ImageWithFallback } from "@/components/figma/ImageWithFallback";
import { BottomNav } from "@/components/BottomNav";
import { DesktopNav } from "@/components/DesktopNav";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { listOutfits, deleteOutfit, SavedOutfit } from "@/services/outfits";

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
  const [outfits, setOutfits] = useState<SavedOutfit[]>([]);
  const [outfitsLoaded, setOutfitsLoaded] = useState(false);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Load outfits when tab switches to outfits
  useEffect(() => {
    if (currentTab === "outfits" && !outfitsLoaded) {
      listOutfits()
        .then((data) => {
          setOutfits(data);
          setOutfitsLoaded(true);
        })
        .catch((e) => console.error("Failed to load outfits:", e));
    }
  }, [currentTab, outfitsLoaded]);

  const handleDeleteOutfit = async (outfitId: string) => {
    try {
      await deleteOutfit(outfitId);
      setOutfits((prev) => prev.filter((o) => o.outfitId !== outfitId));
      toast.success("Outfit deleted");
    } catch (e) {
      console.error("Failed to delete outfit:", e);
      toast.error("Failed to delete outfit");
    }
  };

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
    <div className="min-h-screen bg-white text-black flex flex-col max-w-md md:max-w-7xl mx-auto">
      <DesktopNav />
      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-24 md:pb-12">
        {/* Page Heading with Create Button */}
        <div className="px-6 pt-12 pb-4">
          <div className="flex items-center justify-between">
            <h1 style={{ fontSize: '28px' }}>Saved</h1>
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
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-6 gap-y-8">
                  {collections.map((collection) => (
                    <button
                      key={collection.id}
                      onClick={() => {
                        if (collection.itemCount === 0) {
                          toast("No pieces saved yet — start browsing to add some");
                        } else {
                          handleCollectionClick(collection.id, collection.name);
                        }
                      }}
                      className="text-left group focus:outline-none"
                    >
                      {/* Thumbnail */}
                      <div className="aspect-square bg-gray-50 border border-gray-200 mb-3 overflow-hidden active:border-gray-300 transition-all duration-300 rounded-[8px] shadow-[0px_1px_3px_0px_rgba(14,31,53,0.08)] md:group-hover:scale-[1.03] md:group-hover:shadow-lg">
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
              {outfits.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 mx-auto mb-4 border border-gray-200 flex items-center justify-center rounded-[8px] shadow-[0px_1px_2px_0px_rgba(14,31,53,0.06)]">
                    <Sparkles className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-600 mb-2">No outfits yet</p>
                  <p className="text-gray-400 text-sm">
                    Ask Style Buddy to create outfits and save them here
                  </p>
                  <button
                    onClick={() => router.push("/chat")}
                    className="mt-4 px-4 py-2 bg-black text-white text-sm rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    Open Style Buddy
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {outfits.map((outfit) => (
                    <div
                      key={outfit.outfitId}
                      className="border border-gray-200 rounded-xl overflow-hidden shadow-sm"
                    >
                      {/* Outfit header */}
                      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-semibold text-gray-900">
                            {outfit.name}
                          </h3>
                          {outfit.occasion && (
                            <p className="text-xs text-gray-500 mt-0.5">
                              {outfit.occasion}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => handleDeleteOutfit(outfit.outfitId)}
                          className="p-1.5 text-gray-300 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Product thumbnails grid */}
                      <div className="grid grid-cols-2 gap-px bg-gray-100">
                        {outfit.products.slice(0, 4).map((p) => (
                          <button
                            key={p.productId}
                            onClick={() =>
                              router.push(`/products/${p.productId}`)
                            }
                            className="bg-white p-2 flex flex-col items-center text-center hover:bg-gray-50 transition-colors"
                          >
                            <div className="w-full aspect-[3/4] rounded-lg overflow-hidden bg-gray-50 mb-1.5">
                              {p.productImageUrl ? (
                                <img
                                  src={p.productImageUrl}
                                  alt={p.name}
                                  className="w-full h-full object-cover"
                                  loading="lazy"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-300">
                                  <Sparkles className="w-5 h-5" />
                                </div>
                              )}
                            </div>
                            <p className="text-[10px] text-gray-400 uppercase tracking-wider">
                              {p.slot}
                            </p>
                            <p className="text-xs text-gray-900 line-clamp-1">
                              {p.name}
                            </p>
                          </button>
                        ))}
                      </div>

                      {/* Footer */}
                      <div className="px-4 py-2 border-t border-gray-100 flex items-center justify-between">
                        <p className="text-[11px] text-gray-400">
                          {outfit.products.length} pieces
                        </p>
                        <p className="text-[11px] text-gray-400">
                          {new Date(outfit.created_at).toLocaleDateString(
                            "en-IN",
                            { day: "numeric", month: "short" }
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
          className="bg-white border-t border-gray-200 text-black max-w-7xl mx-auto rounded-t-[24px] p-0 focus:outline-none focus-visible:outline-none [&>button]:hidden shadow-[0px_-2px_4px_0px_rgba(14,31,53,0.12)]"
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
