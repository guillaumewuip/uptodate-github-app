import {
  PullsGetResponse,
} from '@octokit/rest';

import {
  any as anyR,
  propSatisfies,
  equals,
} from 'ramda';

export const isMergeable = (pull: PullsGetResponse) => pull.mergeable;
export const getHeadSha = (pull: PullsGetResponse) => pull.head.sha;

export const hasLabel = (label: string) => (pull: PullsGetResponse) => anyR(
  propSatisfies(equals(label), 'name'),
  pull.labels,
);
