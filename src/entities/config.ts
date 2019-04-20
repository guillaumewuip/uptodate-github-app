export type Config = {
  keepUpdatedLabel: string,
  updateMethod: 'rebase' | 'merge',
};

export const CONFIG_FILE = 'uptodate.yml';

export const defaultConfig: Config = {
  keepUpdatedLabel: 'keep-updated',
  updateMethod: 'rebase',
};

export const getKeepUpdatedLabel = (config: Config) => config.keepUpdatedLabel;
export const getUpdateMethod = (config: Config) => config.updateMethod;
