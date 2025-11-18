export interface GarmentsByProcess {
  processType: string;
  count: number;
  totalWeight: number;
}

export interface WeightByBranch {
  branchOfficeId: string;
  branchOfficeName: string;
  totalWeight: number;
}

export interface DashboardMetrics {
  pendingIncidents: number;
  totalIncidents: number;
  pendingIncidentsPercentage: number;

  reprocessedGuides: number;
  totalGuides: number;
  reprocessedPercentage: number;

  onTimeDeliveries: number;
  totalDeliveries: number;
  onTimeDeliveryPercentage: number;

  industrialGuides: number;
  personalGuides: number;
  industrialPercentage: number;
  personalPercentage: number;

  operationalMachines: number;
  maintenanceMachines: number;
  totalMachines: number;
  operationalMachinesPercentage: number;

  availableVehicles: number;
  inUseVehicles: number;
  maintenanceVehicles: number;
  totalVehicles: number;
  availableVehiclesPercentage: number;

  garmentsByProcess: GarmentsByProcess[];
  weightByBranch: WeightByBranch[];
}


