"use client";

import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetBody, SheetFooter, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { SelectOption } from "@/components/shared/SelectOption";
import { updatePreference } from "@/services/preferences";
import { toast } from "sonner";

interface EditAccessoriesSheetProps {
    currentValues: string[];
    gender: string;
    onSave: (values: string[]) => void;
    onClose: () => void;
}

export function EditAccessoriesSheet({
    currentValues,
    gender,
    onSave,
    onClose,
}: EditAccessoriesSheetProps) {
    const [saving, setSaving] = useState(false);

    const getAccessoryOptions = () => {
        if (gender === "Woman") {
            return ["Earrings", "Bracelet", "Necklace", "Hair accessory"];
        } else {
            // Man or Non-binary
            return ["Sunglasses", "Bracelet", "Caps", "Chain", "Rings", "Slingbag"];
        }
    };

    const accessoryOptions = getAccessoryOptions();

    // Filter currentValues to only include valid accessories for current gender
    const validCurrentValues = currentValues.filter(v => accessoryOptions.includes(v));
    const [selectedAccessories, setSelectedAccessories] = useState<string[]>(validCurrentValues);

    const toggleAccessory = (accessory: string) => {
        if (selectedAccessories.includes(accessory)) {
            setSelectedAccessories(selectedAccessories.filter(a => a !== accessory));
        } else {
            setSelectedAccessories([...selectedAccessories, accessory]);
        }
    };

    const handleSave = async () => {
        if (JSON.stringify([...selectedAccessories].sort()) === JSON.stringify([...validCurrentValues].sort())) {
            onClose();
            return;
        }

        setSaving(true);
        const response = await updatePreference("accessory_preferences", selectedAccessories);
        if (response.success) {
            toast.success("Accessory preferences updated successfully");
            onSave(selectedAccessories);
        } else {
            toast.error(response.error || "Failed to update accessory preferences");
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
                    <SheetTitle className="text-xl font-medium">Accessory Preferences</SheetTitle>
                    <SheetDescription>Select all that apply</SheetDescription>
                </SheetHeader>

                <SheetBody>
                    <div className="flex flex-col gap-3">
                        {accessoryOptions.map((option) => (
                            <SelectOption
                                key={option}
                                label={option}
                                isSelected={selectedAccessories.includes(option)}
                                onClick={() => toggleAccessory(option)}
                            />
                        ))}
                    </div>
                </SheetBody>

                <SheetFooter>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="w-full py-4 bg-black text-white rounded-[8px] active:bg-gray-800 transition-colors disabled:bg-gray-400 uppercase tracking-widest"
                    >
                        {saving ? "Saving..." : "Save"}
                    </button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
