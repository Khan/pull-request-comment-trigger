#!/usr/bin/env node

const core = require("@actions/core");
const { context, GitHub } = require("@actions/github");

const MAP = {
    "issue_comment": {
        "key": "comment"
    },
    "pull_request_comment": {
        "key": "pull_request"
    }
}

async function run() {
    const trigger = core.getInput("trigger", { required: true });

    const reaction = core.getInput("reaction");
    const { GITHUB_TOKEN } = process.env;
    if (reaction && !GITHUB_TOKEN) {
        core.setFailed('If "reaction" is supplied, GITHUB_TOKEN is required');
        return;
    }
    const {eventName, payload} = context;
    const body = payload[MAP[eventName]["key"]].body.trim();

    core.setOutput('comment_body', body);
    if (
        eventName === "issue_comment" &&
        !payload.issue.pull_request
    ) {
        // not a pull-request comment, aborting
        core.setOutput("triggered", "false");
        return;
    }

    const { owner, repo } = context.repo;


    const prefixOnly = core.getInput("prefix_only") === 'true';
    if ((prefixOnly && !body.startsWith(trigger)) || !body.includes(trigger)) {
        core.setOutput("triggered", "false");
        return;
    }

    core.setOutput("triggered", "true");

    if (!reaction) {
        return;
    }

    const client = new GitHub(GITHUB_TOKEN);
    if (context.eventName === "issue_comment") {
        await client.reactions.createForIssueComment({
            owner,
            repo,
            comment_id: context.payload.comment.id,
            content: reaction
        });
    } else {
        await client.reactions.createForIssue({
            owner,
            repo,
            issue_number: context.payload.pull_request.number,
            content: reaction
        });
    }
}

run().catch(err => {
    console.error(err);
    core.setFailed("Unexpected error");
});
