import {
  PayloadRepository,
} from '@octokit/webhooks';

export const getRepositoryIdentifier = (repository: PayloadRepository) =>
  `${repository.id}-${repository.full_name}`;
