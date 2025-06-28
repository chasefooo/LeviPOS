import '@mantine/core/styles.css';
import React from 'react';
import { MantineProvider } from '@mantine/core';
import { theme } from './theme';
import { Layout } from '@/components/Layout/Layout';
import { Provider } from 'react-redux';
import store, { persistor } from '@/store';
import { PersistGate } from 'redux-persist/integration/react';
import { BrowserRouter } from 'react-router-dom';
import { ModalsProvider } from '@mantine/modals';
import { Notifications } from '@mantine/notifications';

export default function App() {
    return (
        <MantineProvider theme={theme}>
            <ModalsProvider>
                <Provider store={store}>
                    <PersistGate loading={null} persistor={persistor}>
                        <BrowserRouter>
                            {/* Fixed container for notifications */}
                            <div
                                style={{
                                    position: 'fixed',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    zIndex: 9999,
                                    pointerEvents: 'none'
                                }}
                            >
                                <Notifications withinPortal={false} position="top-center" />
                            </div>
                            <Layout />
                        </BrowserRouter>
                    </PersistGate>
                </Provider>
            </ModalsProvider>
        </MantineProvider>
    );
}