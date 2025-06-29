import { Suspense, useMemo } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import appConfig from '@/configs/app.config';
import { protectedRoutes, publicRoutes } from '@/configs/routes.config';
import ProtectedRoute from '@/route/ProtectedRoute';
import PublicRoute from '@/route/PublicRoute';
import AppRoute from '@/route/AppRoute';
import AuthorityGuard from '@/route/AuthorityGuard';
import LoadingScreen from '@/components/LoadingScreen/LoadingScreen';
import { useAuth } from '@/contexts/AuthContext';

interface ViewsProps {
    pageContainerType?: 'default' | 'gutterless' | 'contained';
}

const { authenticatedEntryPath } = appConfig;

const AllRoutes = (props: ViewsProps) => {
    const { user } = useAuth();

    const { groups } = useAuth();
    const userAuthority = groups;

    return (
        <Routes>
            <Route path="/" element={<ProtectedRoute />}>
                <Route path="/" element={<Navigate replace to={authenticatedEntryPath} />} />
                {protectedRoutes.map((route, index) => (
                    <Route
                        key={route.key + index}
                        path={route.path}
                        element={
                            <AuthorityGuard userAuthority={userAuthority} authority={route.authority}>
                                <AppRoute
                                    routeKey={route.key}
                                    component={route.component!}
                                    {...route.authority}
                                />
                            </AuthorityGuard>
                        }
                    />
                ))}
                <Route path="*" element={<Navigate replace to="/" />} />
            </Route>
            <Route path="/" element={<PublicRoute />}>
                {publicRoutes.map((route) => (
                    <Route
                        key={route.path}
                        path={route.path}
                        element={
                            <AppRoute routeKey={route.key} component={route.component!} />
                        }
                    />
                ))}
            </Route>
        </Routes>
    );
};

const Views = (props: ViewsProps) => {
    return (
        <Suspense fallback={<LoadingScreen />}>
            <AllRoutes {...props} />
        </Suspense>
    );
};

export default Views;
