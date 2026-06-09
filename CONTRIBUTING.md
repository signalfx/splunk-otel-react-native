# Contributing Guidelines

Thank you for your interest in contributing to our repository! Whether it's a bug
report, new feature, question, or additional documentation, we greatly value
feedback and contributions from our community. Read through this document before
submitting any issues or pull requests to ensure we have all the necessary
information to effectively respond to your bug report or contribution.

In addition to this document, review our [Code of Conduct](CODE_OF_CONDUCT.md).
For any code of conduct questions or comments, send an email to <oss@splunk.com>.

## Reporting Bugs/Feature Requests

We welcome you to use the GitHub issue tracker to report bugs or suggest
features. When filing an issue, check existing open, or recently closed,
issues to make sure somebody else hasn't already reported the issue. Try
to include as much information as you can. Details like these can be useful:

- A reproducible test case or series of steps
- The version of our code being used
- Any modifications you've made relevant to the bug
- Anything unusual about your environment or deployment
- Any known workarounds

When filing an issue, do *NOT* include:

- Internal identifiers such as Jira tickets
- Any sensitive information related to your environment, users, etc.

## Reporting Security Issues

See [SECURITY.md](SECURITY.md#reporting-security-issues) for instructions.

## Setting Up Your Environment

This repository is a Yarn (Berry) monorepo using Yarn workspaces and Turborepo.
To build and test the project locally:

1. Install [Node.js](https://nodejs.org/) `>=22` and enable Yarn via
   [Corepack](https://yarnpkg.com/corepack) (`corepack enable`).
2. Fork and clone the repository.
3. Install dependencies and build the packages:

```bash
yarn
yarn build
```

Git hooks are managed by [Lefthook](https://github.com/evilmartians/lefthook) and
installed automatically with the dependencies. On commit they run ESLint and
TypeScript type-checking; on commit messages they run commitlint.

## Contributing via Pull Requests

Contributions via Pull Requests (PRs) are much appreciated. Before sending us a
pull request, make sure that:

1. You are working against the latest source on the `main` branch.
2. You check existing open, and recently merged, pull requests to make sure
   someone else hasn't addressed the problem already.
3. You open an issue to discuss any significant work - we would hate for your
   time to be wasted.
4. You submit PRs that are easy to review and ideally less than 500 lines of code.
   Multiple PRs can be submitted for larger contributions.

To send us a pull request:

1. Fork the repository.
2. Modify the source; a single change per PR is recommended.
3. Ensure local lint, type-checks, and tests pass, and add new tests related to the contribution.
4. Commit to your fork using clear, [conventional commit](#commit-message-guidelines) messages.
5. Use `NO-TICKET:` as the prefix in your PR title if your contribution is not associated with an internal ticket.
6. Send us a pull request, answering any default questions in the pull request
   interface.
7. Pay attention to any automated CI failures reported in the pull request, and
   stay involved in the conversation.

GitHub provides additional documentation on [forking a
repository](https://help.github.com/articles/fork-a-repo/) and [creating a pull
request](https://help.github.com/articles/creating-a-pull-request/).

### Pull Request Checks

Every PR runs the checks below (see [.github/workflows/ci.yml](.github/workflows/ci.yml)).
All must pass before a PR can be merged:

| Check | What it verifies | Run locally |
| --- | --- | --- |
| Lint & Typecheck | ESLint and TypeScript pass | `yarn lint` / `yarn typecheck` |
| Unit Tests | All package tests pass | `yarn test` |
| Build Library | SDK packages build with valid artifacts | `yarn build` |
| Build Android | Example app builds (old and new arch) | `yarn build:android` |
| Build iOS | Example app builds (old and new arch) | `yarn build:ios` |
| CLA Assistant | Signed Splunk CLA (see [Licensing](#licensing)) | n/a |

Run this before pushing to catch issues early:

```bash
yarn
yarn lint
yarn typecheck
yarn test
yarn build
```

The pre-commit hook (see [Setting Up Your Environment](#setting-up-your-environment))
mirrors lint and type-checking locally.

## Commit Message Guidelines

We enforce a [conventional commit](https://www.conventionalcommits.org/) message
format (via `@commitlint/config-conventional`) to ensure consistency and enable
automated changelog generation. Commit messages must follow the format:

```text
<type>(<scope>)?: <subject>
```

- **`type`** (required): one of `build`, `chore`, `ci`, `docs`, `feat`, `fix`,
  `perf`, `refactor`, `revert`, `style`, `test`.
- **`scope`** (optional): a parenthesized word providing additional context, for
  example `feat(network): capture response headers`.
- **`!`** (optional): an exclamation mark before the colon marks a breaking
  change, for example `feat(api)!: remove old endpoint`.
- **`subject`**: a concise description that does not end with a period.

The commit-msg Git hook validates messages locally before they are committed.

## Documentation

The Splunk Observability documentation is hosted on the [Splunk Observability
Cloud docs site](https://help.splunk.com/en/splunk-observability-cloud), which
contains all the prescriptive guidance for Splunk Observability products.
Prescriptive guidance consists of step-by-step instructions, conceptual material,
and decision support for customers. Reference documentation and development
documentation is still hosted on this repository.

## Finding contributions to work on

Looking at the existing issues is a great way to find something to contribute
on. As our repositories, by default, use the default GitHub issue labels
(enhancement/bug/duplicate/help wanted/invalid/question/wontfix), looking at
any 'help wanted' issues is a great place to start.

## Licensing

See the [LICENSE](LICENSE) file for our repository's licensing. We will ask you to
confirm the licensing of your contribution.

### Contributor License Agreement

Before contributing, you must sign the [Splunk Contributor License Agreement (CLA)](https://www.splunk.com/en_us/form/contributions.html).
