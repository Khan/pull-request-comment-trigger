#!/usr/bin/env node

const core = require("@actions/core");
const { context, GitHub } = require("@actions/github");

async function run() {
    const trigger = core.getInput("trigger", { required: true });

    const reaction = core.getInput("reaction");
    const { GITHUB_TOKEN } = process.env;
    if (reaction && !GITHUB_TOKEN) {
        core.setFailed('If "reaction" is supplied, GITHUB_TOKEN is required');
        return;
    }

    const body =
        (context.eventName === "issue_comment"
        // For comments on pull requests
            ? context.payload.comment.body
            // For the initial pull request description
            : context.payload.pull_request.body) || '';
    core.setOutput('comment_body', body);

    if (
        context.eventName === "issue_comment" &&
        !context.payload.issue.pull_request
    ) {
        // not a pull-request comment, aborting
        core.setOutput("triggered", "false");
        return;
    }

    const { owner, repo } = context.repo;


    const allowArguments = core.getInput("allow_arguments") === 'true';

    let hasTrigger = body.startsWith(trigger);

    if (allowArguments) {
        let regexRawTrigger = trigger.replace(/\s\*{2}/g, ' [^\\s]+');

        regexRawTrigger = `^${regexRawTrigger}$`;

        const regexTrigger = new RegExp(regexRawTrigger);

        hasTrigger = regexTrigger.test(body);
    }

    if (!hasTrigger) {
        core.setOutput("triggered", "false");
        return;
    }

    core.setOutput("triggered", "true");

    if (allowArguments && trigger.includes('**')) {
        const args = [];

        const triggerSplit = trigger.split(' ');
        const bodySplit = body.split(' ');

        triggerSplit.forEach((part, i) => {
            if (part !== '**') return;

            args.push(bodySplit[i]);
        });

        core.setOutput("arguments", JSON.stringify(args));
    }

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
