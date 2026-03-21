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

      <div className="flex-1 overflow-y-auto pb-24 md:pb-12">

        {/* Header */}
        <div className="px-6 pt-12 pb-6 flex items-end justify-between md:max-w-5xl">
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] text-gray-400 mb-1">Fitcurry</p>
            <h1 className="text-3xl md:text-4xl leading-none" style={{ letterSpacing: "-0.02em", fontWeight: 340 }}>
              Saved
            </h1>
          </div>
          <button
            onClick={() => setSheetOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full border border-gray-200 text-[11px] uppercase tracking-[0.12em] text-gray-600 hover:border-black hover:text-black transition-all duration-200 focus:outline-none"
          >
            <Plus className="w-3.5 h-3.5" />
            New
          </button>
        </div>

        {/* Tabs */}
        <div className="w-full">
          <div className="flex border-b border-gray-100 px-6 mb-8">
            {[
              { key: "items", label: "Collections" },
              { key: "outfits", label: "Outfits" },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => handleTabChange(key)}
                className={`mr-8 pb-3 text-[11px] uppercase tracking-[0.16em] transition-colors duration-200 relative focus:outline-none ${
                  currentTab === key ? "text-black" : "text-gray-400 hover:text-gray-600"
                }`}
              >
                {label}
                {currentTab === key && (
                  <span className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-black rounded-full" />
                )}
              </button>
            ))}
          </div>

          {/* Items tab */}
          {currentTab === "items" && (
            <div className="px-6">
              {collections.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <div className="w-12 h-12 rounded-xl border border-gray-200 flex items-center justify-center mb-4">
                    <Plus className="w-5 h-5 text-gray-300" />
                  </div>
                  <p className="text-[13px] text-gray-500 mb-1">No collections yet</p>
                  <p className="text-[12px] text-gray-400 max-w-[220px] leading-relaxed">
                    Create a collection to start saving your favourite pieces
                  </p>
                  <button
                    onClick={() => setSheetOpen(true)}
                    className="mt-5 px-5 py-2.5 rounded-full border border-gray-900 text-[11px] uppercase tracking-[0.14em] text-gray-900 hover:bg-black hover:text-white transition-all duration-200"
                  >
                    Create collection
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-5 gap-y-9">
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
                      <div className="aspect-[3/4] bg-gray-50 border border-gray-100 mb-3 overflow-hidden rounded-xl shadow-[0_4px_16px_rgba(0,0,0,0.05)] transition-all duration-300 md:group-hover:scale-[1.02] md:group-hover:shadow-[0_8px_28px_rgba(0,0,0,0.10)]">
                        {collection.thumbnail ? (
                          <ImageWithFallback
                            src={collection.thumbnail}
                            alt={collection.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Plus className="w-6 h-6 text-gray-200" />
                          </div>
                        )}
                      </div>
                      <p className="text-[13px] text-gray-900 line-clamp-1 mb-0.5" style={{ fontWeight: 440 }}>
                        {collection.name}
                      </p>
                      <p className="text-[11px] text-gray-400 uppercase tracking-[0.08em]">
                        {collection.itemCount} {collection.itemCount === 1 ? "piece" : "pieces"}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Outfits tab */}
          {currentTab === "outfits" && (
            <div className="px-6">
              {outfits.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <div className="w-12 h-12 rounded-xl bg-black flex items-center justify-center mb-4">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-[13px] text-gray-500 mb-1">No outfits saved yet</p>
                  <p className="text-[12px] text-gray-400 max-w-[220px] leading-relaxed">
                    Ask Style Buddy to build a look and save it here
                  </p>
                  <button
                    onClick={() => router.push("/chat")}
                    className="mt-5 px-5 py-2.5 rounded-full bg-black text-white text-[11px] uppercase tracking-[0.14em] hover:bg-gray-800 transition-colors"
                  >
                    Open Style Buddy
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {outfits.map((outfit) => (
                    <div
                      key={outfit.outfitId}
                      className="rounded-2xl border border-gray-100 overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.05)]"
                    >
                      {/* Outfit header */}
                      <div className="px-4 pt-4 pb-3 flex items-start justify-between gap-3">
                        <div>
                          {outfit.occasion && (
                            <p className="text-[9px] uppercase tracking-[0.2em] text-gray-400 mb-0.5">{outfit.occasion}</p>
                          )}
                          <h3 className="text-[13px] text-gray-900 leading-snug" style={{ fontWeight: 480, letterSpacing: "-0.01em" }}>
                            {outfit.name}
                          </h3>
                        </div>
                        <button
                          onClick={() => handleDeleteOutfit(outfit.outfitId)}
                          className="flex-shrink-0 p-1.5 text-gray-300 hover:text-red-400 transition-colors rounded-lg hover:bg-gray-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Horizontal product strip */}
                      <div className="flex gap-2.5 px-4 pb-4 overflow-x-auto scrollbar-none">
                        {outfit.products.map((p) => (
                          <button
                            key={p.productId}
                            onClick={() => router.push(`/products/${p.productId}`)}
                            className="flex-shrink-0 w-[90px] group"
                          >
                            <div className="w-[90px] h-[118px] rounded-xl overflow-hidden bg-gray-100 mb-1.5 transition-transform duration-300 group-hover:scale-[1.03]">
                              {p.productImageUrl ? (
                                <img
                                  src={p.productImageUrl}
                                  alt={p.name}
                                  className="w-full h-full object-cover"
                                  loading="lazy"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-300">
                                  <Sparkles className="w-4 h-4" />
                                </div>
                              )}
                            </div>
                            <p className="text-[9px] text-gray-400 uppercase tracking-[0.1em]">{p.slot}</p>
                            <p className="text-[11px] text-gray-800 line-clamp-1 leading-tight" style={{ fontWeight: 420 }}>{p.name}</p>
                          </button>
                        ))}
                      </div>

                      {/* Footer */}
                      <div className="px-4 py-2.5 border-t border-gray-100 flex items-center justify-between">
                        <p className="text-[10px] text-gray-400 uppercase tracking-[0.1em]">
                          {outfit.products.length} pieces
                        </p>
                        <p className="text-[10px] text-gray-400">
                          {new Date(outfit.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
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

      <BottomNav />

      {/* Create Collection Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent
          side="bottom"
          className="bg-white border-t border-gray-200 text-black max-w-7xl mx-auto rounded-t-[24px] p-0 focus:outline-none focus-visible:outline-none [&>button]:hidden shadow-[0px_-2px_4px_0px_rgba(14,31,53,0.12)]"
        >
          <SheetTitle className="sr-only">Create New Collection</SheetTitle>
          <SheetDescription className="sr-only">Enter a name for your new collection</SheetDescription>

          <SheetHeader onClose={() => setSheetOpen(false)}>
            <h2 className="text-xl font-medium">New Collection</h2>
            <p className="text-gray-400 text-sm">Give your collection a name</p>
          </SheetHeader>

          <div className="px-6 pt-6 pb-6">
            <Input
              value={newCollectionName}
              onChange={(e) => setNewCollectionName(e.target.value)}
              placeholder="e.g. Summer Fits, Work Looks…"
              className="bg-[#f3f3f5] border-transparent text-black rounded-[8px] placeholder:text-gray-400 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none mb-4 h-[48px] px-4"
              onKeyDown={(e) => { if (e.key === "Enter") handleCreateCollection(); }}
              autoFocus
            />
            <button
              onClick={handleCreateCollection}
              disabled={!newCollectionName.trim()}
              className="w-full h-[48px] bg-black text-white active:bg-gray-800 transition-colors flex items-center justify-center text-[11px] uppercase tracking-[0.16em] disabled:opacity-30 disabled:cursor-not-allowed focus:outline-none rounded-[10px]"
            >
              Create & Save
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
