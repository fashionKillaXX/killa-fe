"use client";

import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetBody, SheetFooter, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { TextInput } from "@/components/shared/TextInput";
import { updatePreference } from "@/services/preferences";
import { toast } from "sonner";

interface EditAgeSheetProps {
    currentValue: number;
    onSave: (value: number) => void;
    onClose: () => void;
}

export function EditAgeSheet({
    currentValue,
    onSave,
    onClose,
}: EditAgeSheetProps) {
    const [age, setAge] = useState(currentValue.toString());
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        const ageNum = parseInt(age);

        if (isNaN(ageNum) || ageNum < 13 || ageNum > 120) {
            toast.error("Age must be between 13 and 120");
            return;
        }

        if (ageNum === currentValue) {
            onClose();
            return;
        }

        setSaving(true);
        const response = await updatePreference("age", ageNum);
        if (response.success) {
            toast.success("Age updated successfully");
            onSave(ageNum);
        } else {
            toast.error(response.error || "Failed to update age");
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
                    <SheetTitle className="text-xl font-medium">Enter Age</SheetTitle>
                    <SheetDescription>Age must be between 13 and 120</SheetDescription>
                </SheetHeader>

                <SheetBody>
                    <TextInput
                        type="number"
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        min={13}
                        max={120}
                        placeholder="Enter your age"
                        autoFocus
                        className="text-lg py-4"
                    />
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
