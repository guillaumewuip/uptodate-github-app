import {
  ContextPayloadPullRequestAuthenticated,
} from '../entities/PayloadPullRequest';

export const PULL_REQUEST_MERGED = 'PULL_REQUEST_MERGED';

export type PullRequestMergedAction = {
  type: typeof PULL_REQUEST_MERGED,
  context: ContextPayloadPullRequestAuthenticated,
};

export const pullRequestMerged = (
  context: ContextPayloadPullRequestAuthenticated,
): PullRequestMergedAction => ({
  context,
  type: 'PULL_REQUEST_MERGED',
});
