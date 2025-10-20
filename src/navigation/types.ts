export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  ForgotPassword: undefined;
};

export type MainStackParamList = {
  Dashboard: undefined;
  Clients: undefined;
  Guides: undefined;
  Garments: undefined;
  ScanClothes: { mode?: 'garment' | 'guide' | 'process' } | undefined;
  ScanProcesses: undefined;
  Processes: undefined;
};
