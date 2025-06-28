import React, { useEffect, useState } from 'react';
import Views from '@/components/Layout/Views';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import navigationConfig from '@/configs/navigation.config';
import { LinksGroup } from '@/components/Layout/LinksGroup';
import classes from '@/components/Layout/LayoutTypes/SimpleSideBar.module.css';
import { Box, Card, Group, Burger, ActionIcon } from '@mantine/core';
import { IconX, IconChevronLeft } from '@tabler/icons-react';
import { useMediaQuery } from '@mantine/hooks';
import SimpleSideBarBottomContent from '@/components/Layout/LayoutTypes/SimpleSideBarBottomContent';
import { useTranslation } from 'react-i18next';
import AuthorityCheck from '@/route/AuthorityCheck';
import { useAuth } from '@/contexts/AuthContext';

function SideBar({
                     collapsed,
                     setCollapsed,
                 }: {
    collapsed: boolean;
    setCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
}) {
    const navigate = useNavigate();
    const location = useLocation();
    const [active, setActive] = useState('');
    const { t } = useTranslation();
    const isMobile = useMediaQuery('(max-width: 768px)');

    // Use AuthContext instead of Redux
    const { groups } = useAuth();
    const userAuthority = groups;

    useEffect(() => {
        const currentPath = location.pathname.split('/')[1];
        setActive(currentPath);
    }, [location.pathname]);

    const links = navigationConfig.map((item, index) => {
        if (item.subMenu && item.subMenu.length > 0) {
            const subLinks = item.subMenu.map((i) => ({
                label: i.title,
                link: i.path,
                authority: i.authority,
            }));
            const isAnyLinkActive = subLinks.some((link) => location.pathname.includes(link.link));

            return (
                <AuthorityCheck
                    key={index}
                    userAuthority={userAuthority}
                    authority={item.authority}
                >
                    <Box ml={10} my={10}>
                        <LinksGroup
                            initiallyOpened={isAnyLinkActive}
                            icon={item.icon}
                            label={collapsed ? '' : item.title}
                            links={subLinks}
                            collapsed={collapsed}
                            setCollapsed={setCollapsed}
                            isMobile={isMobile}
                        />
                    </Box>
                </AuthorityCheck>
            );
        } else {
            return (
                <AuthorityCheck
                    key={index}
                    userAuthority={userAuthority}
                    authority={item.authority}
                >
                    <Link
                        className={classes.link}
                        data-active={item.path.split('/')[1] === active ? 'true' : undefined}
                        to={item.path}
                        onClick={(event) => {
                            event.preventDefault();
                            setActive(item.path.split('/')[1]);
                            navigate(item.path);
                            if (isMobile) {
                                setCollapsed(true);
                            }
                        }}
                    >
                        <item.icon className={classes.linkIcon} stroke={1.5} />
                        {!collapsed && (
                            <span>{item.translateKey ? t(item.translateKey) : item.title}</span>
                        )}
                    </Link>
                </AuthorityCheck>
            );
        }
    });

    return (
        <nav
            className={classes.navbar}
            style={{ width: collapsed ? 60 : 250, transition: 'width 0.2s ease' }}
        >
            <Box
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    padding: '1rem',
                    position: 'relative',
                }}
            >
                <img
                    className={classes.logo}
                    alt="Garrett Growers Logo"
                    src="/logo/logo.svg"
                />
                <ActionIcon
                    variant="transparent"
                    onClick={() => setCollapsed(true)}
                    size={40}
                    style={{
                        position: 'absolute',
                        top: 8,
                        right: 8
                    }}
                >
                    <IconChevronLeft size={32} color="#000" />
                </ActionIcon>
            </Box>
            <div className={classes.navbarMain}>
                {/* Header with logo removed as per instructions */}
                {links}
            </div>
            {!collapsed && <SimpleSideBarBottomContent />}
        </nav>
    );
}

export default function SimpleSideBar() {
    const { groups } = useAuth();
    const isAdmin = groups.includes('Administrator');
    const isMobile = useMediaQuery('(max-width: 768px)');
    const [collapsed, setCollapsed] = useState<boolean>(() => isMobile || !isAdmin);

    useEffect(() => {
        setCollapsed(isMobile || !isAdmin);
    }, [isMobile, isAdmin]);

    return (
        <div
            style={{
                overflow: 'hidden',
                backgroundColor: 'rgb(236,236,236)',
                display: 'flex',
                flex: '1 1 auto',
                height: '100vh',
            }}
        >
            {!collapsed && (
                <SideBar collapsed={collapsed} setCollapsed={setCollapsed} />
            )}
            {isAdmin && collapsed && (
                <Box
                    style={{
                        position: 'absolute',
                        top: 8,
                        left: 8,
                        zIndex: 1000,
                    }}
                >
                    <Burger
                        opened={false}
                        onClick={() => setCollapsed(false)}
                        size={40}
                        color="#000"
                    />
                </Box>
            )}
            <div
                style={{
                    padding: '2rem',
                    backgroundColor: '#ffffff',
                    flex: 1,
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100vh',
                    marginLeft: collapsed ? '0px' : '0',
                }}
            >
                {isAdmin && collapsed && (
                    <Box
                        style={{
                            position: 'absolute',
                            top: 8,
                            left: 8,
                            zIndex: 1000,
                        }}
                    >
                        <Burger
                            opened={false}
                            onClick={() => setCollapsed(false)}
                            size={40}
                            color="#000"
                        />
                    </Box>
                )}
                <Card
                    style={{
                        overflowY: 'scroll',
                        overflow: 'scroll',
                        maxHeight: '100%',
                        width: '100%',
                        flex: 1,
                    }}
                    radius={15}
                    withBorder
                    p={0}
                >
                    <Views />
                </Card>
            </div>
        </div>
    );
}
