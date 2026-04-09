import {
  BadgeDollarSign,
  BriefcaseBusiness,
  Building2,
  HardHat,
  House,
  UserRound,
  type LucideIcon,
} from 'lucide-react';

const iconMap = {
  'user-round': UserRound,
  briefcase: BriefcaseBusiness,
  'building-2': Building2,
  house: House,
  'hard-hat': HardHat,
  'badge-dollar-sign': BadgeDollarSign,
} satisfies Record<string, LucideIcon>;

export type UserIconId = keyof typeof iconMap;

export const userIconOptions: {
  id: UserIconId;
  label: string;
  description: string;
  icon: LucideIcon;
}[] = [
  {
    id: 'user-round',
    label: 'Clasico',
    description: 'Icono general de usuario.',
    icon: UserRound,
  },
  {
    id: 'briefcase',
    label: 'Trabajo',
    description: 'Enfoque administrativo y operativo.',
    icon: BriefcaseBusiness,
  },
  {
    id: 'building-2',
    label: 'Edificio',
    description: 'Ideal para propiedades y conjuntos.',
    icon: Building2,
  },
  {
    id: 'house',
    label: 'Casa',
    description: 'Pensado para hogares y recibos.',
    icon: House,
  },
  {
    id: 'hard-hat',
    label: 'Obra',
    description: 'Util para construcciones y proyectos.',
    icon: HardHat,
  },
  {
    id: 'badge-dollar-sign',
    label: 'Finanzas',
    description: 'Perfil orientado a control economico.',
    icon: BadgeDollarSign,
  },
];

export function getUserIcon(iconId?: string) {
  return iconMap[iconId as UserIconId] ?? UserRound;
}

export function UserIcon({
  iconId,
  className,
}: {
  iconId?: string;
  className?: string;
}) {
  if (iconId === 'briefcase') {
    return <BriefcaseBusiness className={className} />;
  }

  if (iconId === 'building-2') {
    return <Building2 className={className} />;
  }

  if (iconId === 'house') {
    return <House className={className} />;
  }

  if (iconId === 'hard-hat') {
    return <HardHat className={className} />;
  }

  if (iconId === 'badge-dollar-sign') {
    return <BadgeDollarSign className={className} />;
  }

  return <UserRound className={className} />;
}
