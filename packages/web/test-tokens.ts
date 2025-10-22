/**
 * Simple script to test if all tokens are configured correctly
 * Run with: npx tsx test-tokens.ts
 */

import { configDotenv } from 'dotenv';
import { CircleCIClient } from '../core/integrations/CircleCIClient';
import { GitHubClient } from '../core/integrations/GitHubClient';
import { OpenAIClient } from '../core/integrations/OpenAIClient';


configDotenv();

async function testTokens() {
  console.log('🔍 Testing token configuration...\n');

  // Check if tokens exist
  const requiredEnvVars = [
    'CIRCLE_CI_TOKEN',
    'GITHUB_TOKEN',
    'OPENAI_TOKEN',
    'GITHUB_OWNER',
    'GITHUB_REPO'
  ];

  let missingVars = false;
  for (const varName of requiredEnvVars) {
    if (!process.env[varName]) {
      console.error(`❌ Missing environment variable: ${varName}`);
      missingVars = true;
    } else {
      const value = process.env[varName];
      const masked = value.substring(0, 8) + '...';
      console.log(`✅ ${varName}: ${masked}`);
    }
  }

  if (missingVars) {
    console.error('\n⚠️  Please set all required environment variables in packages/web/.env');
    process.exit(1);
  }

  console.log('\n📋 All environment variables are set!\n');

  // Test GitHub Token
  console.log('🔧 Testing GitHub token...');
  try {
    const github = new GitHubClient({ token: process.env.GITHUB_TOKEN! });
    const owner = process.env.GITHUB_OWNER!;
    const repo = process.env.GITHUB_REPO!;

    // Test by getting repo info (using the authenticated user endpoint)
    const response = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (response.ok) {
      const user = await response.json();
      console.log(`✅ GitHub token is valid! Authenticated as: ${user.login}`);

      // Test repo access
      const repoResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
        headers: {
          'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (repoResponse.ok) {
        const repoData  = await repoResponse.json();
        console.log(`✅ Can access repo: ${repoData.full_name}`);
      } else {
        console.error(`❌ Cannot access repo ${owner}/${repo}. Status: ${repoResponse.status}`);
        console.error('   Make sure GITHUB_OWNER and GITHUB_REPO are correct.');
      }
    } else {
      const error = await response.text();
      console.error(`❌ GitHub token is invalid. Status: ${response.status}`);
      console.error(`   Error: ${error}`);
    }
  } catch (error: any) {
    console.error(`❌ GitHub token test failed: ${error.message}`);
  }

  // Test CircleCI Token
  console.log('\n🔧 Testing CircleCI token...');
  try {
    const response = await fetch('https://circleci.com/api/v2/me', {
      headers: {
        'Circle-Token': process.env.CIRCLE_CI_TOKEN!
      }
    });

    if (response.ok) {
      const user = await response.json();
      console.log(`✅ CircleCI token is valid! Authenticated as: ${user.name || user.login}`);
    } else {
      const error = await response.text();
      console.error(`❌ CircleCI token is invalid. Status: ${response.status}`);
      console.error(`   Error: ${error}`);
    }
  } catch (error: any) {
    console.error(`❌ CircleCI token test failed: ${error.message}`);
  }

  // Test OpenAI Token
  console.log('\n🔧 Testing OpenAI token...');
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`✅ OpenAI token is valid! You have access to ${data.data.length} models.`);

      // Check if GPT-4 is available
      const hasGPT4 = data.data.some((model: any) => model.id.includes('gpt-4'));
      const hasGPT35 = data.data.some((model: any) => model.id.includes('gpt-3.5'));

      console.log(`   📝 Default model used by this app: gpt-4`);
      if (hasGPT4) {
        console.log(`   ✅ GPT-4 is available in your account`);
      } else {
        console.log(`   ⚠️  GPT-4 is NOT available. You may need to:`);
        console.log(`      1. Add payment method to OpenAI account`);
        console.log(`      2. Make at least one successful payment`);
        console.log(`      3. Consider using gpt-3.5-turbo instead (set in .env: OPENAI_MODEL=gpt-3.5-turbo)`);
      }

      if (hasGPT35) {
        console.log(`   ✅ GPT-3.5-turbo is available (cheaper alternative)`);
      }
    } else {
      const error = await response.text();
      console.error(`❌ OpenAI token is invalid. Status: ${response.status}`);
      console.error(`   Error: ${error}`);

      if (response.status === 401) {
        console.error('   Make sure you copied the full API key (starts with sk-proj- or sk-)');
      }
    }
  } catch (error: any) {
    console.error(`❌ OpenAI token test failed: ${error.message}`);
  }

  console.log('\n✨ Token testing complete!\n');
}

testTokens().catch(console.error);
