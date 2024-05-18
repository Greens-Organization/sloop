# Sloop
![sloop](/public/sloop.svg)

This action is for the functionality of removing automatic deployments created by vercel or another action.

Attention: It only works if the environment name is the same as the branch.

## Usage

```yaml
steps:
  - name: Checkout
    id: checkout
    uses: actions/checkout@v4

  - name: Run my Action
    id: run-action
    uses: actions/sloop@v1
    with:
      token: ${{ secrets.TOKEN_GITHUB }}
      owner: 'org-name'
      repo: 'repo-name'


  - name: Print Output
    id: output
    run: echo "${{ steps.run-action.outputs.result }}"
```
