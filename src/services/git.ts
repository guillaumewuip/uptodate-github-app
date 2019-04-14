import Git from 'nodegit';

export const ERRORS = {
  CLONE: 'CLONE_ERROR',
  REBASE: 'REBASE_ERROR',
  CONNECT: 'CONNECT_ERROR',
  PUSH: 'PUSH_ERROR',
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
    error.type = ERRORS.CLONE;

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
  } catch (error) {
    error.type = ERRORS.REBASE;

    throw error;
  }
};

const push = async ( // TODO find a way to do a force-with-lease
  repo: Git.Repository,
  branchHeadRefName: string,
) => {
  const remote = await repo.getRemote('origin');

  try {
    await remote.connect(
      Git.Enums.DIRECTION.PUSH,
      {},
    );
  } catch (error) {
    error.type = ERRORS.CONNECT;

    throw error;
  }

  const connected = remote.connected();
  if (!connected) {
    const error = new Error('Can\'t connect');
    // @ts-ignore
    error.type = ERRORS.CONNECT;

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
    error.type = ERRORS.PUSH;

    throw error;
  }
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

  const branchHeadRefName = `refs/heads/${branch}`; // checkouted in clone
  const baseBranchHeadRefName = `refs/remotes/origin/${baseBranch}`;

  await rebase(
    repo,
    branchHeadRefName,
    baseBranchHeadRefName,
    signature,
  );

  await push(
    repo,
    branchHeadRefName,
  );
};
