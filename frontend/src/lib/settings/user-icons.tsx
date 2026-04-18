import {
  BadgeDollarSign,
  BriefcaseBusiness,
  Building2,
  HardHat,
  House,
  UserRound,
} from 'lucide-react';

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
