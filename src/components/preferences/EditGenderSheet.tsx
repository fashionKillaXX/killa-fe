"use client";

import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetBody, SheetFooter, SheetTitle } from "@/components/ui/sheet";
import { SelectOption } from "@/components/shared/SelectOption";
import { updatePreference } from "@/services/preferences";
import { toast } from "sonner";

interface EditGenderSheetProps {
    currentValue: string;
    onSave: (value: string) => void;
    onClose: () => void;
}

export function EditGenderSheet({
    currentValue,
    onSave,
    onClose,
}: EditGenderSheetProps) {
    const [selectedGender, setSelectedGender] = useState(currentValue);
    const [saving, setSaving] = useState(false);

    const genderOptions = ["Woman", "Man", "Non-binary"];

    const handleSave = async () => {
        if (selectedGender === currentValue) {
            onClose();
            return;
        }

        setSaving(true);
        const response = await updatePreference("gender", selectedGender);
        if (response.success) {
            toast.success("Gender updated successfully");
            onSave(selectedGender);
        } else {
            toast.error(response.error || "Failed to update gender");
        }
        setSaving(false);
    };

    return (
        <Sheet open={true} onOpenChange={(open: boolean) => !open && onClose()}>
            <SheetContent
                side="bottom"
                className="bg-white max-w-md mx-auto rounded-t-[24px] p-0 [&>button]:hidden"
            >
                <SheetHeader onClose={onClose}>
                    <SheetTitle className="text-xl font-medium">Select Gender</SheetTitle>
                </SheetHeader>

                <SheetBody>
                    <div className="flex flex-col gap-3">
                        {genderOptions.map((option) => (
                            <SelectOption
                                key={option}
                                label={option}
                                isSelected={selectedGender === option}
                                onClick={() => setSelectedGender(option)}
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
