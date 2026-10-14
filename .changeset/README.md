# Changesets

A change to a published package needs a changeset: a file in this folder that names the package, the kind of version bump, and the changelog line.

    pnpm changeset

Commit the file it writes with the change. Merging to `main` opens or updates a "Version Packages" pull request; merging that one publishes to npm.
