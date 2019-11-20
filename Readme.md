# Pull Request Comment Trigger

Look for a "trigger word" in a pull-request description or comment, so that later actions can know whether or not to run.

This is most useful in tandem with [workflow-preprocessor], so that you don't have to be writing a ton of `if`s all down the line.

## Example usage in workflow

Your workflow needs to listen to the following events:
```
on:
  pull_request:
    types: [opened]
  issue_comment:
    types: [created]
```

And then you can use the action in your jobs like this:

```
jobs:
  do_some_work:
    runs-on: ubuntu-latest
    steps:
      - uses: khan/pull-request-comment-trigger@master
        id: check
        with:
          trigger: '@hello/world'
        env:
          GITHUB_TOKEN: '${{ secrets.GITHUB_TOKEN }}'
      - run: 'echo Found it!'
        if: steps.check.outputs.triggered == 'true'
```
