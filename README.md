# Sloop

![sloop](/public/sloop.svg)

This action is for the functionality of removing automatic deployments created
by vercel or another action.

Attention: It only works if the environment name is the same as the branch.

## Usage

```yaml
steps:
  - name: Checkout
    id: checkout
    uses: actions/checkout@v4

  - name: Run my Action
    id: run-action
    uses: actions/sloop-launch@v1
    with:
      token: ${{ secrets.TOKEN_GITHUB }}
      owner: 'org-name'
      repo: 'repo-name'

  - name: Print Output
    id: output
    run: echo "${{ steps.run-action.outputs.result }}"
```

## How to create the token

You need to create a token to use the action, it must contain the following
requirements.

**Path in Github:**

```
Settings / Developer settings / Personal access tokens / Fine-grained tokens
```

**Repository access:**

- **All repositories** or **Only select repositories**.

**Permissions:**

- Administration: Read and write
- Commit statuses: Read and write
- Deployments: Read and write
- Metadata(mandatory): Read-only

**Organization permissions:**

- Administration: Read and write
