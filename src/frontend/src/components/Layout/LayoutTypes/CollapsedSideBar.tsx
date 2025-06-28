import React, { useEffect, useState } from 'react';
import { Card, Center, Stack } from '@mantine/core';
import { IconLogout } from '@tabler/icons-react';
import classes from './CollapsedSideBar.module.css';
import navigationConfig from '@/configs/navigation.config';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Views from '@/components/Layout/Views';
import { useAuth } from '@/contexts/AuthContext'; // Updated to use new AuthContext
import AuthorityCheck from '@/route/AuthorityCheck';

function CollapsedSideBarBottomContent() {
    const { signOut } = useAuth();

    return (
        <div className={classes.linkWrapper}>
            <div className={classes.link}>
                {/* Assuming CollapsedSideBarUserPopOver is still used as-is */}
                {/* If needed, update it to also use AuthContext */}
                {/* <CollapsedSideBarUserPopOver /> */}
            </div>
            <div
                className={classes.link}
                onClick={() => {
                    signOut();
                }}
            >
                <IconLogout />
            </div>
        </div>
    );
}

function CollapsedSideBarContent() {
    const [active, setActive] = useState('');
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();

    // Instead of pulling userAuthority from Redux, we derive it from the AuthContext.
    // Adjust the attribute key if your role is stored differently.
    const userAuthority =
        user && user.attributes && user.attributes['custom:role']
            ? [user.attributes['custom:role']]
            : [];

    useEffect(() => {
        const currentPath = location.pathname.split('/')[1];
        setActive(currentPath);
    }, [location.pathname]);

    const links = navigationConfig.map((item) => (
        <AuthorityCheck
            key={item.title}
            userAuthority={userAuthority}
            authority={item.authority}
        >
            <Link
                className={classes.link}
                data-active={item.path.split('/')[1] === active ? 'true' : undefined}
                to={item.path}
                onClick={(event) => {
                    event.preventDefault();
                    navigate(item.path);
                }}
            >
                <item.icon className={classes.linkIcon} stroke={1.5} />
            </Link>
        </AuthorityCheck>
    ));

    return (
        <nav className={classes.navbar}>
            <Center>
                <img
                    className={classes.logo}
                    alt={'Garrett Growers Logo'}
                    src={'/logo/logo.svg'}
                />
            </Center>
            <div className={classes.navbarMain}>
                <Stack justify="center" gap={10}>
                    {links}
                </Stack>
            </div>
            <CollapsedSideBarBottomContent />
        </nav>
    );
}

export default function CollapsedSideBar() {
    return (
        <div style={{ display: 'flex', flex: '1 1 auto', backgroundColor: 'rgb(241,240,240)' }}>
            <CollapsedSideBarContent />
            <div
                style={{
                    padding: '2rem',
                    backgroundColor: '#ffffff',
                    flex: 1,
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100vh',
                }}
            >
                <Card
                    style={{
                        overflowY: 'auto',
                        maxHeight: '100%',
                        width: '100%',
                        flex: 1,
                    }}
                    radius={15}
                    withBorder
                    p={40}
                >
                    <Views />
                </Card>
            </div>
        </div>
    );
}
