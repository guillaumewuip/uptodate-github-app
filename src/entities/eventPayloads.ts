import {
  Context,
} from 'probot';

import {
  path,
  last,
} from 'ramda';

export type PushEventPayload = {
  ref: string,
};

const branchUpdated = (context: Context<PushEventPayload>): string => {
  const ref = context.payload.ref;
  const parts = ref.split('/');

  const branch = last(parts) as string;

  return branch;
};

export const isMasterUpdated = (context: Context<PushEventPayload>): boolean => {
  const branch = branchUpdated(context);

  return branch === 'master';
};
