export type DashboardMetric = {
  label: string;
  value: string;
  description: string;
  tone: 'brand' | 'warning' | 'danger';
};

export type DashboardModule = {
  title: string;
  href: string;
  description: string;
  emphasis: string;
};

export type DashboardModulePreference = {
  moduleId: string;
  visible: boolean;
  favorite: boolean;
  order: number;
};
