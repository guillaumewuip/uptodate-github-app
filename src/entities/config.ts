export type Config = {
  keepUpdatedLabel: string,
  updateMethod: 'rebase' | 'merge',
  mergeLabel: string,
  deleteBranchAfterMerge: boolean,
};

export const CONFIG_FILE = 'uptodate.yml';

export const defaultConfig: Config = {
  keepUpdatedLabel: 'keep-updated',
  updateMethod: 'rebase',
  mergeLabel: 'ready-to-merge',
  deleteBranchAfterMerge: false,
};

export const getKeepUpdatedLabel = (config: Config) => config.keepUpdatedLabel;
export const getUpdateMethod = (config: Config) => config.updateMethod;
export const getReadyToMergeLabel = (config: Config) => config.mergeLabel;
export const shouldDeleteBranchAfterMerge = (config: Config) => config.deleteBranchAfterMerge;
