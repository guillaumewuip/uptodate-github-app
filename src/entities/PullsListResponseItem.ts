import {
  PullsListResponseItem,
} from '@octokit/rest';

import {
  any as anyR,
  propSatisfies,
  equals,
} from 'ramda';

export const hasLabel = (label: string) => (pull: PullsListResponseItem) => anyR(
  propSatisfies(equals(label), 'name'),
  pull.labels,
);

export const getPullNumber = (pull: PullsListResponseItem) => pull.number;
export const getPullBaseBranch = (pull: PullsListResponseItem) => pull.base.ref;
export const getPullBranch = (pull: PullsListResponseItem) => pull.head.ref;
