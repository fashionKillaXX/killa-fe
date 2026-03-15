"use client";

interface SelectOptionProps {
    label: string;
    isSelected: boolean;
    onClick: () => void;
    icon?: string;
}

/**
 * Reusable option button matching onboarding style
 * Used for gender, body type, accessories selection
 */
export function SelectOption({ label, isSelected, onClick, icon }: SelectOptionProps) {
    return (
        <button
            onClick={onClick}
            className={`w-full py-5 px-6 border transition-all rounded-[8px] shadow-[0px_1px_3px_0px_rgba(14,31,53,0.08)] flex items-center ${
                icon ? 'gap-4' : 'justify-center'
            } ${
                isSelected
                    ? "border-black bg-gray-50"
                    : "border-gray-200 bg-white active:border-gray-300"
            }`}
        >
            {icon && (
                <div className="w-10 h-10 bg-gray-100 flex items-center justify-center rounded-[8px]">
                    <span className="text-xl text-gray-700">{icon}</span>
                </div>
            )}
            <span className={`uppercase tracking-widest ${icon ? 'flex-1 text-left' : ''}`}>
                {label}
            </span>
        </button>
    );
}
