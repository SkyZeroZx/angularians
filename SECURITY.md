# Security policy

## Supported versions

Only the live site, [angularians.netlify.app](https://angularians.netlify.app), and the latest commit on the main branch are supported.

## Report a vulnerability

Use GitHub's private vulnerability reporting: open the repository's **Security** tab and choose **Report a vulnerability**
(<https://github.com/erkamyaman/angularians/security/advisories/new>). Please do not open a public issue for a security problem.

Say what you did, what happened and what you expected. A small reproduction helps.

If you cannot use GitHub, email erkamyaman35@gmail.com with "Security" in the subject.

This is a small project kept up in spare time, so there is no fixed response time. Expect an answer within a few days. A confirmed
problem is fixed as soon as possible, and the advisory credits you unless you prefer not to be named.

## What the site keeps

- **Sign in with GitHub** keeps only your GitHub id and login, in a sealed, http-only cookie. GitHub's access token is used once, to
  ask who signed in, and is never stored. There is no database.
- **The data** is public GitHub activity of public repositories: pull requests, issues, comments, reactions, and the name, website,
  location and social links of public profiles.
- **The collector** reads public repositories with a read-only token and a GitHub App that ask for no permissions. They are
  repository secrets of GitHub Actions and never reach the site.
