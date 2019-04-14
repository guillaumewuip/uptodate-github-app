describe('services/git', () => {
  const mockedSignature = {
    signature: 'signature',
  };

  describe('cloneRebaseAndPush', () => {
    it('should clone the repo, rebase the branch and push', async () => {
      const mockedRemote = {
        connect: jest.fn().mockResolvedValue(undefined),
        connected: jest.fn().mockReturnValue(true),
        push: jest.fn().mockResolvedValue(undefined),
      };

      const mockedRepo = {
        rebaseBranches: jest.fn().mockResolvedValue(undefined),
        getRemote: jest.fn().mockResolvedValue(mockedRemote),
        defaultSignature: jest.fn().mockReturnValue(mockedSignature),
      };

      jest.resetModules();
      jest.mock('nodegit', () => ({
        Clone: {
          clone: jest.fn().mockImplementation(() => Promise.resolve(mockedRepo)),
        },
      }));

      const {
        cloneRebaseAndPush,
      } = require('./git');

      const Git = require('nodegit');

      const url = 'https://github.com/guillaumewuip/test-github-app';
      const dir = '/tmp/guillaumewuip-test';
      const baseBranch = 'master';
      const branch = 'test-pr1';

      await cloneRebaseAndPush(
        url,
        dir,
        branch,
        baseBranch,
      );

      expect(Git.Clone.clone).toHaveBeenCalledWith(
        url,
        dir,
        {
          checkoutBranch: branch,
        },
      );

      expect(mockedRepo.defaultSignature).toHaveBeenCalled();

      const branchHeadRefName = `refs/heads/${branch}`;
      const baseBranchHeadRefName = `refs/remotes/origin/${baseBranch}`;

      expect(mockedRepo.rebaseBranches).toHaveBeenCalled();
      expect(mockedRepo.rebaseBranches.mock.calls[0][0]).toEqual(branchHeadRefName);
      expect(mockedRepo.rebaseBranches.mock.calls[0][1]).toEqual(baseBranchHeadRefName);
      expect(mockedRepo.rebaseBranches.mock.calls[0][2]).toEqual(null);
      expect(mockedRepo.rebaseBranches.mock.calls[0][3]).toEqual(mockedSignature);

      expect(mockedRemote.push).toHaveBeenCalledWith(
        [
          `+${branchHeadRefName}:${branchHeadRefName}`,
        ],
      );
    });

    it('should handle clone error', async () => {
      const mockedCloneError = new Error('');

      jest.resetModules();
      jest.mock('nodegit', () => ({
        Signature: {
          now: jest.fn().mockImplementation(() => mockedSignature),
        },
        Clone: {
          clone: jest.fn().mockImplementation(() => Promise.reject(mockedCloneError)),
        },
      }));

      const {
        cloneRebaseAndPush,
        ERRORS,
      } = require('./git');

      const url = 'https://github.com/guillaumewuip/test-github-app';
      const dir = '/tmp/guillaumewuip-test';
      const baseBranch = 'master';
      const branch = 'test-pr1';

      expect.assertions(1);

      try {
        await cloneRebaseAndPush(
          url,
          dir,
          branch,
          baseBranch,
        );
      } catch (error) {
        expect(error.type).toEqual(ERRORS.CLONE);
      }
    });

    it('should handle rebase error', async () => {
      const mockedRebaseError = new Error('');

      const mockedRepo = {
        rebaseBranches: jest.fn().mockRejectedValue(mockedRebaseError),
        defaultSignature: jest.fn().mockReturnValue(mockedSignature),
      };

      jest.resetModules();
      jest.mock('nodegit', () => ({
        Clone: {
          clone: jest.fn().mockImplementation(() => Promise.resolve(mockedRepo)),
        },
      }));

      const {
        cloneRebaseAndPush,
        ERRORS,
      } = require('./git');

      const url = 'https://github.com/guillaumewuip/test-github-app';
      const dir = '/tmp/guillaumewuip-test';
      const baseBranch = 'master';
      const branch = 'test-pr1';

      expect.assertions(1);

      try {
        await cloneRebaseAndPush(
          url,
          dir,
          branch,
          baseBranch,
        );
      } catch (error) {
        expect(error.type).toEqual(ERRORS.REBASE);
      }
    });

    it('should handle connection error', async () => {
      const mockedConnectionError = new Error('');

      const mockedRemote = {
        connect: jest.fn().mockRejectedValue(mockedConnectionError),
        connected: jest.fn().mockReturnValue(true),
        push: jest.fn().mockResolvedValue(undefined),
      };

      const mockedRepo = {
        rebaseBranches: jest.fn().mockResolvedValue(mockedRemote),
        getRemote: jest.fn().mockResolvedValue(mockedRemote),
        defaultSignature: jest.fn().mockReturnValue(mockedSignature),
      };

      jest.resetModules();
      jest.mock('nodegit', () => ({
        Clone: {
          clone: jest.fn().mockImplementation(() => Promise.resolve(mockedRepo)),
        },
      }));

      const {
        cloneRebaseAndPush,
        ERRORS,
      } = require('./git');

      const url = 'https://github.com/guillaumewuip/test-github-app';
      const dir = '/tmp/guillaumewuip-test';
      const baseBranch = 'master';
      const branch = 'test-pr1';

      expect.assertions(1);

      try {
        await cloneRebaseAndPush(
          url,
          dir,
          branch,
          baseBranch,
        );
      } catch (error) {
        expect(error.type).toEqual(ERRORS.CONNECT);
      }
    });

    it('should handle connected false', async () => {
      const mockedRemote = {
        connect: jest.fn().mockResolvedValue(undefined),
        connected: jest.fn().mockReturnValue(false),
        push: jest.fn().mockResolvedValue(undefined),
      };

      const mockedRepo = {
        rebaseBranches: jest.fn().mockResolvedValue(mockedRemote),
        getRemote: jest.fn().mockResolvedValue(mockedRemote),
        defaultSignature: jest.fn().mockReturnValue(mockedSignature),
      };

      jest.resetModules();
      jest.mock('nodegit', () => ({
        Clone: {
          clone: jest.fn().mockImplementation(() => Promise.resolve(mockedRepo)),
        },
      }));

      const {
        cloneRebaseAndPush,
        ERRORS,
      } = require('./git');

      const url = 'https://github.com/guillaumewuip/test-github-app';
      const dir = '/tmp/guillaumewuip-test';
      const baseBranch = 'master';
      const branch = 'test-pr1';

      expect.assertions(1);

      try {
        await cloneRebaseAndPush(
          url,
          dir,
          branch,
          baseBranch,
        );
      } catch (error) {
        expect(error.type).toEqual(ERRORS.CONNECT);
      }
    });

    it('should handle push error', async () => {
      const mockedPushError = new Error('');

      const mockedRemote = {
        connect: jest.fn().mockResolvedValue(undefined),
        connected: jest.fn().mockReturnValue(true),
        push: jest.fn().mockRejectedValue(mockedPushError),
      };

      const mockedRepo = {
        rebaseBranches: jest.fn().mockResolvedValue(mockedRemote),
        getRemote: jest.fn().mockResolvedValue(mockedRemote),
        defaultSignature: jest.fn().mockReturnValue(mockedSignature),
      };

      jest.resetModules();
      jest.mock('nodegit', () => ({
        Clone: {
          clone: jest.fn().mockImplementation(() => Promise.resolve(mockedRepo)),
        },
      }));

      const {
        cloneRebaseAndPush,
        ERRORS,
      } = require('./git');

      const url = 'https://github.com/guillaumewuip/test-github-app';
      const dir = '/tmp/guillaumewuip-test';
      const baseBranch = 'master';
      const branch = 'test-pr1';

      expect.assertions(1);

      try {
        await cloneRebaseAndPush(
          url,
          dir,
          branch,
          baseBranch,
        );
      } catch (error) {
        expect(error.type).toEqual(ERRORS.PUSH);
      }
    });
  });
});