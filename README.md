<img align="left" width="180" height="180" src="https://i.imgur.com/v2kx3RN.png">

**Up To Date**

A Github app to keep your repository up to date (update PRs when base change, delete merged branch, etc.)

> Built with [Probot](https://github.com/probot/probot)

[![Actions Status](https://wdp9fww0r9.execute-api.us-west-2.amazonaws.com/production/badge/guillaumewuip/uptodate-github-app)](https://wdp9fww0r9.execute-api.us-west-2.amazonaws.com/production/results/guillaumewuip/uptodate-github-app)

## For what ?

- keep your PRs up to date with their base branch (via rebase or merge)
- merge your PRs when they're ready
- delete merged branch

## How ?

- Host your version of the app somewhere (I don't have a public app available for now)

  ⚠ As the app requires full read/write [permission on your repository content](https://developer.github.com/v3/apps/permissions/#permission-on-contents) you probably want to be sure to host your own app for private repos

- (optional) Configure the app by creating a `.github/uptodate.yml` file

    ```yml
    # the label you put on the PR to tell Up To Date to keep it updated
    # default keep-updated
    keepUpdatedLabel: 'keep-updated'

    # the update method 
    # - rebase: rebase the PR on the base branch with autosquash and git push --force-with-lease
    # - merge: merge the base branch on the PR
    # default rebase
    updateMethod: 'rebase'

    # the label you put on the PR to tell Up To Date to merge once mergeable
    # default ready-to-merge
    mergeLabel: 'ready-to-merge'

    # whether or not Up To Date should delete branches once merged
    # default false
    deleteBranchAfterMerge: false
    ```

- (optional) [Protect your repository default branch](https://help.github.com/en/articles/configuring-protected-branches)

  Select "Required status check to pass before merging" and "Require branches to be up to date before merging"

## See also

- https://github.com/tibdex/autorebase : rebase and merge and clean your PRs
- https://github.com/SvanBoxel/delete-merged-branch : delete merged branches

## Contributing

If you have suggestions for how up-to-date could be improved, or want to report a bug, open an issue! We'd love all and any contributions.

For more, check out the [Contributing Guide](CONTRIBUTING.md).

## License

[MIT](LICENSE) © 2019 Guillaume Clochard <clochard.guillaume@gmail.com>
