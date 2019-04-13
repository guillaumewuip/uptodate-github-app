import {
  PayloadRepository,
} from '@octokit/webhooks';

import {
  PullsListResponseItem,
} from '@octokit/rest';

import {
  any as anyR,
  propSatisfies,
  equals,
} from 'ramda';

export const getRepositoryIdentifier = (repository: PayloadRepository) =>
  `${repository.id}-${repository.full_name}`;

export const hasLabel = (label: string) => (pull: PullsListResponseItem) => anyR(
  propSatisfies(equals(label), 'name'),
  pull.labels,
);
