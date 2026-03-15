"use client";

import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetBody, SheetFooter, SheetTitle } from "@/components/ui/sheet";
import { SelectOption } from "@/components/shared/SelectOption";
import { updatePreference } from "@/services/preferences";
import { toast } from "sonner";

interface EditBodyTypeSheetProps {
    currentValue: string;
    gender: string;
    onSave: (value: string) => void;
    onClose: () => void;
}

const BODY_TYPE_ICONS: Record<string, string> = {
    "Pear": "\u25BD",
    "Rectangle": "\u25AD",
    "Apple": "\u2B2D",
    "Hourglass": "\u29D7",
    "Inverted Triangle": "\u25B3",
    "Oval": "\u2B2D",
    "Triangle": "\u25BD",
    "Trapezoid": "\u2B20",
};

export function EditBodyTypeSheet({
    currentValue,
    gender,
    onSave,
    onClose,
}: EditBodyTypeSheetProps) {
    const [selectedBodyType, setSelectedBodyType] = useState(currentValue);
    const [saving, setSaving] = useState(false);

    const getBodyTypeOptions = () => {
        if (gender === "Woman") {
            return ["Pear", "Rectangle", "Apple", "Hourglass", "Inverted Triangle"];
        } else if (gender === "Man") {
            return ["Rectangle", "Oval", "Triangle", "Trapezoid", "Inverted Triangle"];
        } else {
            // Non-binary
            return ["Rectangle", "Triangle", "Inverted Triangle", "Oval", "Hourglass"];
        }
    };

    const bodyTypeOptions = getBodyTypeOptions();

    const handleSave = async () => {
        if (selectedBodyType === currentValue) {
            onClose();
            return;
        }

        setSaving(true);
        const response = await updatePreference("body_type", selectedBodyType);
        if (response.success) {
            toast.success("Body type updated successfully");
            onSave(selectedBodyType);
        } else {
            toast.error(response.error || "Failed to update body type");
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
                    <SheetTitle className="text-xl font-medium">Select Body Type</SheetTitle>
                </SheetHeader>

                <SheetBody>
                    <div className="flex flex-col gap-3">
                        {bodyTypeOptions.map((option) => (
                            <SelectOption
                                key={option}
                                label={option}
                                isSelected={selectedBodyType === option}
                                onClick={() => setSelectedBodyType(option)}
                                icon={BODY_TYPE_ICONS[option]}
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
