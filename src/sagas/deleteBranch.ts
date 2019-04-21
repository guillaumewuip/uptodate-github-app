import {
  SagaIterator,
} from 'redux-saga';

import {
  takeEvery,
  call,
} from 'redux-saga/effects';

import {
  PULL_REQUEST_MERGED,
  PullRequestMergedAction,
} from '../actions/pullRequestMerged';

import {
  getRepositoryOwnerLogin,
  getRepositoryName,
  getLogInfo,
} from '../entities/withRepositoryAuthenticated';

import {
  getBranchRef,
} from '../entities/PayloadPullRequest';

import {
  Config,
  shouldDeleteBranchAfterMerge,
} from '../entities/config';

import {
  readRepoConfigSaga,
} from './readConfig';

function* deleteBranchSaga(
  action: PullRequestMergedAction,
): SagaIterator {
  const {
    context,
  } = action;

  const branchRef = getBranchRef(context);

  const config: Config = yield call(
    readRepoConfigSaga,
    context,
  );

  const deleteBranch = shouldDeleteBranchAfterMerge(config);

  if (!deleteBranch) {
    context.log.info(
      {
        ...getLogInfo(context),
        branchRef,
      },
      'Should not delete branch after merge',
    );

    return;
  }

  try {
    yield call(
      context.github.git.deleteRef,
      {
        owner: getRepositoryOwnerLogin(context),
        repo: getRepositoryName(context),
        ref: `heads/${branchRef}`,
      },
    );

    context.log.info(
      {
        ...getLogInfo(context),
        branchRef,
      },
      'Branch deleted',
    );
  } catch (error) {
    context.log.error(
      {
        ...getLogInfo(context),
        branchRef,
        err: error,
      },
      'Can\'t delete branch',
    );

    return;
  }
}

export function* deleteBranchesSaga(): SagaIterator {
  yield takeEvery(
    PULL_REQUEST_MERGED,
    deleteBranchSaga,
  );
}
