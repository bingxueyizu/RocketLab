export type Id = string;

export type NavItem = {
  id: Id;
  emoji?: string;
  name: string;
  description?: string;
  url: string;
  createdAt: number;
  updatedAt: number;
};

export type Group = {
  id: Id;
  title: string;
  collapsed: boolean;
  itemIds: Id[];
};

export type NavStateV1 = {
  schemaVersion: 1;
  groupOrder: Id[];
  groups: Group[];
  itemsById: Record<Id, NavItem>;
};

export type NavState = NavStateV1;

