export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
};

export type MainStackParamList = {
  Dashboard: undefined;
  Clients: undefined;
  Guides: undefined;
  Garments: undefined;
  ScanClothes: { mode?: 'garment' | 'guide' | 'process'; guideId?: string; processType?: string } | undefined;
  ScanProcesses: undefined;
  Processes: undefined;
  Incidents: undefined;
};
