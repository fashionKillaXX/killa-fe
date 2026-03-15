"use client";

import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetBody, SheetFooter, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { updatePreference, fetchAvailableBrands, type Brand } from "@/services/preferences";
import { toast } from "sonner";

interface EditBrandsSheetProps {
    currentBrands: Brand[];
    onSave: (brands: Brand[]) => void;
    onClose: () => void;
}

export function EditBrandsSheet({
    currentBrands,
    onSave,
    onClose,
}: EditBrandsSheetProps) {
    const [availableBrands, setAvailableBrands] = useState<Brand[]>([]);
    const [selectedBrandIds, setSelectedBrandIds] = useState<string[]>(
        currentBrands.map(b => b.id)
    );
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadBrands();
    }, []);

    const loadBrands = async () => {
        const response = await fetchAvailableBrands();
        if (response.success) {
            setAvailableBrands(response.brands);
        } else {
            toast.error(response.error || "Failed to load brands");
        }
        setLoading(false);
    };

    const toggleBrand = (brandId: string) => {
        if (selectedBrandIds.includes(brandId)) {
            setSelectedBrandIds(selectedBrandIds.filter(id => id !== brandId));
        } else {
            if (selectedBrandIds.length >= 5) {
                toast.error("Maximum 5 brands can be selected");
                return;
            }
            setSelectedBrandIds([...selectedBrandIds, brandId]);
        }
    };

    const handleSave = async () => {
        if (JSON.stringify([...selectedBrandIds].sort()) === JSON.stringify(currentBrands.map(b => b.id).sort())) {
            onClose();
            return;
        }

        setSaving(true);
        const response = await updatePreference("brands", selectedBrandIds);
        if (response.success) {
            toast.success("Favorite brands updated successfully");
            onSave(response.value); // Backend returns brand objects with names
        } else {
            toast.error(response.error || "Failed to update brands");
        }
        setSaving(false);
    };

    return (
        <Sheet open={true} onOpenChange={(open: boolean) => !open && onClose()}>
            <SheetContent
                side="bottom"
                className="bg-white max-w-md mx-auto rounded-t-[24px] p-0 [&>button]:hidden max-h-[80vh] overflow-y-auto"
            >
                <SheetHeader onClose={onClose}>
                    <SheetTitle className="text-xl font-medium">Favorite Brands</SheetTitle>
                    <SheetDescription>Select up to 5 brands ({selectedBrandIds.length}/5)</SheetDescription>
                </SheetHeader>

                <SheetBody>
                    {loading ? (
                        <p className="text-gray-500">Loading brands...</p>
                    ) : (
                        <div className="flex flex-wrap gap-2">
                            {availableBrands.map((brand) => {
                                const isSelected = selectedBrandIds.includes(brand.id);
                                return (
                                    <button
                                        key={brand.id}
                                        onClick={() => toggleBrand(brand.id)}
                                        className={`px-4 py-2.5 rounded-full border transition-all shadow-[0px_1px_3px_0px_rgba(14,31,53,0.08)] ${isSelected
                                                ? "border-black bg-black text-white"
                                                : "border-gray-200 bg-white active:border-gray-300"
                                            }`}
                                    >
                                        {brand.name}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </SheetBody>

                <SheetFooter>
                    <button
                        onClick={handleSave}
                        disabled={saving || selectedBrandIds.length === 0 || loading}
                        className="w-full py-4 bg-black text-white rounded-[8px] active:bg-gray-800 transition-colors disabled:bg-gray-400 uppercase tracking-widest"
                    >
                        {saving ? "Saving..." : `Save${selectedBrandIds.length > 0 ? ` (${selectedBrandIds.length})` : ""}`}
                    </button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
