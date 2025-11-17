export interface Apprenticeship {
  id: number;
  name: string;
  branchId: number;
}

export interface Branch {
  id: number;
  name: string;
}

export interface Location {
  id: number;
  name: string;
  address?: string;
  city?: string;
  plz?: string;
}