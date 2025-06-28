import type {NavigationTree} from '@/@types/navigation';
import {
  IconHome,
  IconTruck,
  IconPackageExport,
  IconShoppingCart,
  IconTractor,
  IconReport, IconShoppingBag
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
];

export default navigationConfig;
