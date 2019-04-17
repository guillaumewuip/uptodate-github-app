import Git from 'nodegit';

export type ERROR_TYPE =
  'CLONE_ERROR' |
  'REBASE_ERROR' |
  'UNKNOWN_REBASE_ERROR' |
  'PUSH_ERROR' |
  'LEASE_ERROR';

export type GitError = Error & {
  type: ERROR_TYPE,
};

export type RebaseError = GitError & {
  files: string[],
};

export const isGitError = (error: any): error is GitError => {
  return error.type !== undefined;
};

export const isRebaseError = (error: GitError): error is RebaseError => {
  return error.type === 'REBASE_ERROR';
};

export const isIndex = (error: any): error is Git.Index => {
  return error.hasConflicts !== undefined;
};

const clone = async (
  repoUrl: string,
  directory: string,
  branch: string,
) => {
  try {
    const repo = await Git.Clone.clone(
      repoUrl,
      directory,
      {
        checkoutBranch: branch,
      },
    );

    return repo;
  } catch (error) {
    error.type = 'CLONE_ERROR';

    throw error;
  }
};

const rebase = async (
  repo: Git.Repository,
  branchHeadRefName: string,
  baseBranchHeadRefName: string,
  signature: Git.Signature,
) => {
  const onto = null as unknown as string; // fix for bad function type

  try {
    await repo.rebaseBranches(
      branchHeadRefName,
      baseBranchHeadRefName,
      onto,
      signature,
      async () => {}, // fix for bad function type
    );
  } catch (errorOrIndex) {
    if (!isIndex(errorOrIndex)) {
      const error = errorOrIndex;

      error.type = 'UNKNOWN_REBASE_ERROR';

      throw error;
    }

    const statuses = await repo.getStatus();

    const conflictFiles = statuses
      .filter(statusFile => statusFile.isConflicted())
      .map(statusFile => statusFile.path());

    const error = new Error() as RebaseError;
    error.type = 'REBASE_ERROR';
    error.files = conflictFiles;

    throw error;
  }
};

const fetch = async (
  repo: Git.Repository,
  remote: Git.Remote,
) => {
  try {
    await repo.fetch(
      remote,
    );
  } catch (error) {
    error.type = 'PUSH_ERROR';

    throw error;
  }
};

const push = async (
  remote: Git.Remote,
  branchHeadRefName: string,
) => {
  try {
    await remote.connect(
      Git.Enums.DIRECTION.PUSH,
      {},
    );
  } catch (error) {
    error.type = 'PUSH_ERROR';

    throw error;
  }

  const connected = remote.connected();
  if (!connected) {
    const error = new Error('Can\'t connect');
    // @ts-ignore
    error.type = 'PUSH_ERROR';

    throw error;
  }

  const refSpecs = [
    // + for git push --force
    `+${branchHeadRefName}:${branchHeadRefName}`,
  ];

  try {
    await remote.push(
      refSpecs,
    );
  } catch (error) {
    error.type = 'PUSH_ERROR';

    throw error;
  }
};

const getRefSha1 = async (
  repo: Git.Repository,
  branchName: string,
) => {
  const ref = await Git.Reference.lookup(
    repo,
    branchName,
  );

  return ref.target();
};

export const cloneRebaseAndPush = async (
  repoUrl: string,
  directory: string,
  branch: string,
  baseBranch: string,
) => {
  const repo = await clone(
    repoUrl,
    directory,
    branch,
  );

  const signature = repo.defaultSignature();

  const remote = await repo.getRemote('origin');

  const branchHeadRefName = `refs/heads/${branch}`; // checkouted in clone
  const baseBranchHeadRefName = `refs/remotes/origin/${baseBranch}`;

  const baseBranchHeadSha1 = await getRefSha1(
    repo,
    baseBranchHeadRefName,
  );

  await rebase(
    repo,
    branchHeadRefName,
    baseBranchHeadRefName,
    signature,
  );

  await fetch(
    repo,
    remote,
  );

  const newBaseBranchHeadSha1 = await getRefSha1(
    repo,
    baseBranchHeadRefName,
  );

  const isBaseBranchUpToDate = newBaseBranchHeadSha1.equal(
    baseBranchHeadSha1,
  );

  if (!isBaseBranchUpToDate) {
    // something as been pushed on the remote branch during rebase
    const error = new Error('Remote has changed') as GitError;
    error.type = 'LEASE_ERROR';

    throw error;
  }

  await push(
    remote,
    branchHeadRefName,
  );
};
