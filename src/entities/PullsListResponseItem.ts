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
