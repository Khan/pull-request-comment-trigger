#!/usr/bin/env node

const core = require('@actions/core');
const {context, GitHub} = require('@actions/github')

async function run() {
    const trigger = core.getInput('trigger');
    if (!trigger) {
        core.setFailed('No `trigger` input given, aborting.')
        return
    }

    if (context.eventName === 'issue_comment' && !context.payload.issue.pull_request) {
        // not a pull-request comment, aborting
        core.setOutput('triggered', 'false');
        return
    }

    const {owner, repo} = context.repo;

    const body = context.eventName === 'issue_comment'
        ? context.payload.comment.body
        : context.payload.pull_request.body;

    if (!body.includes(trigger)) {
        core.setOutput('triggered', 'false');
        return;
    }

    core.setOutput('triggered', 'true');

    const client = new GitHub(process.env.GITHUB_TOKEN);
    if (context.eventName === 'issue_comment') {
        await client.reactions.createForIssueComment({
            owner,
            repo,
            comment_id: context.payload.comment.id,
            content: 'rocket'
        })
    } else {
        await client.reactions.createForIssue({
            owner,
            repo,
            issue_number: context.payload.pull_request.number,
            content: 'rocket'
        });
    }
}

run().catch(err => {
    console.error(err)
    core.setFailed('Unexpected error');
});
