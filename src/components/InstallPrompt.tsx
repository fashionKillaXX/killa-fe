"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface InstallPromptProps {
    currentPage?: string;
}

export function InstallPrompt({ currentPage }: InstallPromptProps) {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showPrompt, setShowPrompt] = useState(false);
    const [isIOS, setIsIOS] = useState(false);

    useEffect(() => {
        // Only run checks if we are on the home page
        if (currentPage !== 'home') {
            return;
        }

        // Check if already in standalone mode
        const isStandalone =
            window.matchMedia('(display-mode: standalone)').matches ||
            (window.navigator as any).standalone === true ||
            document.referrer.includes('android-app://');

        if (isStandalone) {
            return; // Don't show if already installed
        }

        // Check dismissal cooldown (7 days)
        const dismissedAt = localStorage.getItem('fitcurry_install_dismissed_at');
        if (dismissedAt) {
            const dismissedTime = parseInt(dismissedAt, 10);
            const secondsSinceDismiss = (Date.now() - dismissedTime) / 1000;
            if (secondsSinceDismiss < 7 * 24 * 60 * 60) { // 7 days
                return; // Still in cooldown period
            }
        }

        // Detect iOS
        const userAgent = window.navigator.userAgent.toLowerCase();
        const isiOS = /iphone|ipad|ipod/.test(userAgent);
        setIsIOS(isiOS);

        if (isiOS) {
            // For iOS, show prompt after a delay
            const timer = setTimeout(() => {
                setShowPrompt(true);
            }, 2000);
            return () => clearTimeout(timer);
        } else {
            // For Android/Desktop, listen for beforeinstallprompt
            const handleBeforeInstallPrompt = (e: Event) => {
                e.preventDefault();
                setDeferredPrompt(e as BeforeInstallPromptEvent);
                setShowPrompt(true);
            };

            window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

            return () => {
                window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            };
        }
    }, [currentPage]); // Re-run when currentPage changes

    const handleInstall = async () => {
        if (!isIOS && deferredPrompt) {
            // Android - trigger native install prompt
            await deferredPrompt.prompt();
            const choiceResult = await deferredPrompt.userChoice;

            if (choiceResult.outcome === 'accepted') {
                console.log('User accepted the install prompt');
            } else {
                console.log('User dismissed the install prompt');
            }

            setDeferredPrompt(null);
            setShowPrompt(false);
        }
        // For iOS, the button text already instructs users, so we just keep it visible
    };

    const handleDismiss = () => {
        localStorage.setItem('fitcurry_install_dismissed_at', Date.now().toString());
        setShowPrompt(false);
    };

    // Only render if showPrompt is true AND we are on the home page
    if (!showPrompt || currentPage !== 'home') {
        return null;
    }

    return (
        <div
            style={{
                position: 'fixed',
                bottom: '80px', // Above bottom nav
                left: '12px',
                right: '12px',
                zIndex: 9999,
            }}
        >
            <div
                style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '12px',
                    padding: '12px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                    border: '1px solid #E5E5E5',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {/* App Icon */}
                    <div style={{ flexShrink: 0 }}>
                        <div
                            style={{
                                width: '48px',
                                height: '48px',
                                backgroundColor: '#F5F5F5',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                overflow: 'hidden',
                            }}
                        >
                            {/* TODO: Replace with actual app icon path once assets are set up */}
                            <img
                                src="/icons/fitcurry-192x192.png"
                                alt="FitCurry"
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                        </div>
                    </div>

                    {/* Text Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: '15px', fontWeight: 600, color: '#000', margin: 0 }}>
                            Install FitCurry
                        </p>
                        <p style={{ fontSize: '13px', color: '#666', margin: '2px 0 0 0' }}>
                            {isIOS ? (
                                <span>
                                    Tap <span style={{ fontWeight: 600 }}>Share</span> then <span style={{ fontWeight: 600 }}>Add to Home Screen</span>
                                </span>
                            ) : (
                                "Add to your home screen"
                            )}
                        </p>
                    </div>

                    {/* Action Button (Android) or Close (iOS) */}
                    {!isIOS ? (
                        <button
                            onClick={handleInstall}
                            style={{
                                backgroundColor: '#000',
                                color: '#FFF',
                                border: 'none',
                                borderRadius: '20px',
                                padding: '6px 12px',
                                fontSize: '13px',
                                fontWeight: 500,
                                cursor: 'pointer',
                            }}
                        >
                            Install
                        </button>
                    ) : (
                        <button
                            onClick={handleDismiss}
                            style={{
                                flexShrink: 0,
                                padding: '8px',
                                backgroundColor: 'transparent',
                                border: 'none',
                                borderRadius: '50%',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                            aria-label="Dismiss"
                        >
                            <X style={{ width: '20px', height: '20px', color: '#666' }} />
                        </button>
                    )}

                    {/* Close Button for Android (separate from install action) */}
                    {!isIOS && (
                        <button
                            onClick={handleDismiss}
                            style={{
                                flexShrink: 0,
                                padding: '8px',
                                backgroundColor: 'transparent',
                                border: 'none',
                                borderRadius: '50%',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginLeft: '-4px'
                            }}
                            aria-label="Dismiss"
                        >
                            <X style={{ width: '20px', height: '20px', color: '#666' }} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
