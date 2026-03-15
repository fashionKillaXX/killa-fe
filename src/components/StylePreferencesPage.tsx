"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Edit2 } from "lucide-react";
import { SubpageHeader } from "@/components/SubpageHeader";
import { BottomNav } from "@/components/BottomNav";
import { PageHeader } from "@/components/shared/PageHeader";
import { fetchUserPreferences, type StylePreferences } from "@/services/preferences";
import { EditGenderSheet } from "@/components/preferences/EditGenderSheet";
import { EditAgeSheet } from "@/components/preferences/EditAgeSheet";
import { EditBrandsSheet } from "@/components/preferences/EditBrandsSheet";
import { EditBodyTypeSheet } from "@/components/preferences/EditBodyTypeSheet";
import { EditAccessoriesSheet } from "@/components/preferences/EditAccessoriesSheet";
import { useOnboarding } from "@/contexts/OnboardingContext";

export function StylePreferencesPage() {
    const router = useRouter();
    const { restartOnboarding } = useOnboarding();
    const [preferences, setPreferences] = useState<StylePreferences | null>(null);
    const [loading, setLoading] = useState(true);
    const [editingField, setEditingField] = useState<string | null>(null);

    useEffect(() => {
        loadPreferences();
    }, []);

    const loadPreferences = async () => {
        setLoading(true);
        const response = await fetchUserPreferences();
        if (response.success && response.preferences) {
            setPreferences(response.preferences);
            setLoading(false);
        } else {
            // No preferences found - redirect to onboarding
            handleResetPreferences();
        }
    };

    const handleResetPreferences = () => {
        restartOnboarding();
        router.push('/onboarding');
    };

    const handlePreferenceUpdate = async (field: string, value: any) => {
        if (!preferences) return;

        // If gender changed, reload all preferences from backend
        // because backend may have filtered invalid accessories
        if (field === 'gender' && value !== preferences.gender) {
            setEditingField(null);
            await loadPreferences();
            return;
        }

        setPreferences({
            ...preferences,
            [field]: value
        });
        setEditingField(null);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white text-black flex flex-col max-w-md mx-auto">
                <SubpageHeader onBackClick={() => router.back()} showDivider={false} />
                <div className="flex-1 flex items-center justify-center">
                    <p className="text-gray-500">Loading preferences...</p>
                </div>
            </div>
        );
    }

    if (!preferences) return null;

    return (
        <div className="min-h-screen bg-white text-black flex flex-col max-w-md mx-auto">
            {/* Header */}
            <SubpageHeader onBackClick={() => router.back()} showDivider={false} />

            {/* Content */}
            <div className="flex-1 px-6 pb-32 overflow-y-auto">
                {/* Page Title */}
                <PageHeader
                    title="Style Preferences"
                    subtitle="Manage your fashion profile"
                />

                {/* Preference Sections */}
                <div className="flex flex-col" style={{ gap: '20px' }}>
                    {/* Gender */}
                    <PreferenceCard
                        label="Gender"
                        value={preferences.gender}
                        onEdit={() => setEditingField("gender")}
                    />

                    {/* Age */}
                    <PreferenceCard
                        label="Age"
                        value={preferences.age.toString()}
                        onEdit={() => setEditingField("age")}
                    />

                    {/* Body Type */}
                    <PreferenceCard
                        label="Body Type"
                        value={preferences.body_type}
                        onEdit={() => setEditingField("body_type")}
                    />

                    {/* Favorite Brands */}
                    <PreferenceCard
                        label="Favorite Brands"
                        value={
                            preferences.brands.length > 0
                                ? preferences.brands.map(b => b.name).join(", ")
                                : "None selected"
                        }
                        onEdit={() => setEditingField("brands")}
                    />

                    {/* Accessory Preferences */}
                    <PreferenceCard
                        label="Accessory Preferences"
                        value={
                            preferences.accessory_preferences.length > 0
                                ? preferences.accessory_preferences.join(", ")
                                : "None selected"
                        }
                        onEdit={() => setEditingField("accessory_preferences")}
                    />
                </div>

                {/* Reset Button */}
                <div className="flex justify-center" style={{ marginTop: '32px' }}>
                    <button
                        onClick={handleResetPreferences}
                        className="bg-gray-200 text-gray-600 rounded-full active:bg-gray-300 transition-colors text-sm"
                        style={{ padding: '6px 16px' }}
                    >
                        Reset Preferences
                    </button>
                </div>
            </div>

            {/* Bottom Navigation */}
            <BottomNav />

            {/* Edit Sheets */}
            {editingField === "gender" && (
                <EditGenderSheet
                    currentValue={preferences.gender}
                    onSave={(value) => handlePreferenceUpdate("gender", value)}
                    onClose={() => setEditingField(null)}
                />
            )}

            {editingField === "age" && (
                <EditAgeSheet
                    currentValue={preferences.age}
                    onSave={(value) => handlePreferenceUpdate("age", value)}
                    onClose={() => setEditingField(null)}
                />
            )}

            {editingField === "brands" && (
                <EditBrandsSheet
                    currentBrands={preferences.brands}
                    onSave={(value) => handlePreferenceUpdate("brands", value)}
                    onClose={() => setEditingField(null)}
                />
            )}

            {editingField === "body_type" && (
                <EditBodyTypeSheet
                    currentValue={preferences.body_type}
                    gender={preferences.gender}
                    onSave={(value) => handlePreferenceUpdate("body_type", value)}
                    onClose={() => setEditingField(null)}
                />
            )}

            {editingField === "accessory_preferences" && (
                <EditAccessoriesSheet
                    currentValues={preferences.accessory_preferences}
                    gender={preferences.gender}
                    onSave={(value) => handlePreferenceUpdate("accessory_preferences", value)}
                    onClose={() => setEditingField(null)}
                />
            )}
        </div>
    );
}

// Preference Card Component
interface PreferenceCardProps {
    label: string;
    value: string;
    onEdit: () => void;
}

function PreferenceCard({ label, value, onEdit }: PreferenceCardProps) {
    return (
        <div className="bg-gray-50 border border-gray-200 rounded-[8px] p-4">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-sm text-gray-500 uppercase tracking-wide mb-1">
                        {label}
                    </p>
                    <p className="text-base">{value}</p>
                </div>
                <button
                    onClick={onEdit}
                    className="p-2 -mr-2 -mt-1 active:bg-gray-200 rounded-[8px] transition-colors"
                >
                    <Edit2 className="w-4 h-4 text-gray-600" />
                </button>
            </div>
        </div>
    );
}
