import type {NavigationTree} from '@/@types/navigation';
import {
  IconHome,
  IconTruck,
  IconPackageExport,
  IconShoppingCart,
  IconTractor,
  IconReport, IconShoppingBag, IconSettings
} from '@tabler/icons-react';

const navigationConfig: NavigationTree[] = [
  {
    key: 'dashboard',
    path: '/dashboard',
    title: 'POS',
    translateKey: '',
    icon: IconShoppingBag,
    authority: [],
    subMenu: []
  },
  {
    key: '',
    path: '',
    title: 'Admin',
    translateKey: '',
    icon: IconSettings,
    type: 'title',
    authority: ['Administrator'],
    subMenu: [
      {
        key: 'users',
        path: '/users',
        title: 'Users',
        translateKey: '',
        authority: ['Administrator'],
      },
      {
        key: 'locations',
        path: '/locations',
        title: 'Locations',
        translateKey: '',
        authority: ['Administrator'],
      },
      {
        key: 'terminals',
        path: '/terminals',
        title: 'Terminals',
        translateKey: '',
        authority: ['Administrator'],
      },
    ]
  },
];

export default navigationConfig;
