import React, { lazy, Suspense, useMemo } from "react";
// Update the import to use the new AuthContext rather than the old custom hook
import { useAuth } from "@/contexts/AuthContext";
import LoadingScreen from "@/components/LoadingScreen/LoadingScreen";
import { LayoutTypes } from "@/@types/layout";
import { useAppSelector } from "@/store";

const layouts: any = {
    [LayoutTypes.SimpleSideBar]: lazy(() => import('./LayoutTypes/SimpleSideBar')),
    [LayoutTypes.DeckedSideBar]: lazy(() => import('./LayoutTypes/DeckedSideBar')),
    [LayoutTypes.CollapsedSideBar]: lazy(() => import('./LayoutTypes/CollapsedSideBar')),
};

export function Layout() {
    // Use the new Auth context
    const { user } = useAuth();
    const authenticated = !!user; // true if user is logged in, false otherwise
    const layoutType = useAppSelector((state) => state.theme.currentLayout);

    // If authenticated, load the specified layout; otherwise, use the AuthLayout.
    const AppLayout = useMemo(() => {
        if (authenticated) {
            return layouts[layoutType];
        }
        return lazy(() => import('./AuthLayout'));
    }, [authenticated, layoutType]);

    return (
        <Suspense
            fallback={
                <div className="flex flex-auto flex-col h-[100vh]">
                    <LoadingScreen />
                </div>
            }
        >
            <AppLayout />
        </Suspense>
    );
}
