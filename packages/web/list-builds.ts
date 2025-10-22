/**
 * Helper script to list recent CircleCI builds
 * Run with: npx tsx list-builds.ts
 */

import { configDotenv } from 'dotenv';

configDotenv();

async function listBuilds() {
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  const token = process.env.CIRCLE_CI_TOKEN;

  if (!owner || !repo || !token) {
    console.error('❌ Missing environment variables. Please check your .env file.');
    process.exit(1);
  }

  const slug = `gh/${owner}/${repo}`;
  console.log(`🔍 Fetching recent builds for: ${slug}\n`);

  try {
    // Get recent pipelines
    const url = `https://circleci.com/api/v2/project/${slug}/pipeline`;
    const response = await fetch(url, {
      headers: {
        'Circle-Token': token
      }
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`❌ Failed to fetch pipelines. Status: ${response.status}`);
      console.error(`Error: ${error}`);
      console.error(`\nMake sure:`);
      console.error(`  1. The repository has CircleCI enabled`);
      console.error(`  2. GITHUB_OWNER and GITHUB_REPO are correct in .env`);
      console.error(`  3. Your CircleCI token has access to this project`);
      process.exit(1);
    }

    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      console.log('📭 No pipelines found for this project.');
      console.log('\nMake sure:');
      console.log('  1. You have pushed code to this repository');
      console.log('  2. CircleCI is configured for this repo');
      console.log('  3. At least one build has run');
      return;
    }

    console.log('📋 Recent Pipelines:\n');

    // Get workflows for each pipeline
    for (const pipeline of data.items.slice(0, 10)) {
      const workflowUrl = `https://circleci.com/api/v2/pipeline/${pipeline.id}/workflow`;
      const workflowResponse = await fetch(workflowUrl, {
        headers: {
          'Circle-Token': token
        }
      });

      if (workflowResponse.ok) {
        const workflows = await workflowResponse.json();

        for (const workflow of workflows.items) {
          const statusEmoji = workflow.status === 'success' ? '✅' :
                             workflow.status === 'failed' ? '❌' :
                             workflow.status === 'running' ? '🔄' : '⏸️';

          console.log(`${statusEmoji} Pipeline #${pipeline.number}`);
          console.log(`   Status: ${workflow.status}`);
          console.log(`   Branch: ${pipeline.vcs?.branch || 'N/A'}`);
          console.log(`   Workflow: ${workflow.name}`);
          console.log(`   Created: ${new Date(workflow.created_at).toLocaleString()}`);
          console.log(`   URL: https://app.circleci.com/pipelines/github/${owner}/${repo}/${pipeline.number}`);

          // Get jobs for failed workflows
          if (workflow.status === 'failed') {
            const jobsUrl = `https://circleci.com/api/v2/workflow/${workflow.id}/job`;
            const jobsResponse = await fetch(jobsUrl, {
              headers: {
                'Circle-Token': token
              }
            });

            if (jobsResponse.ok) {
              const jobs = await jobsResponse.json();
              const failedJobs = jobs.items.filter((j: any) => j.status === 'failed');

              if (failedJobs.length > 0) {
                console.log(`   ⚠️  Failed Jobs:`);
                failedJobs.forEach((job: any) => {
                  console.log(`      - ${job.name} (Job #${job.job_number})`);
                });
              }
            }
          }
          console.log('');
        }
      }
    }

    console.log('\n💡 Usage Examples:\n');
    console.log('To fetch test failures from a specific build, use the pipeline number:');
    console.log(`  GET /api/failures/${slug}/<pipeline-number>`);
    console.log('');
    console.log('Example with your repo:');
    console.log(`  GET /api/failures/${slug}/123`);
    console.log('');
    console.log('To run the full fix workflow:');
    console.log(`  POST /api/fix`);
    console.log(`  Body: { "slug": "${slug}", "build": 123 }`);

  } catch (error: any) {
    console.error(`❌ Error: ${error.message}`);
  }
}

listBuilds().catch(console.error);
