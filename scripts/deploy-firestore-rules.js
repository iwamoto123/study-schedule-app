#!/usr/bin/env node

/**
 * Deploy Firestore security rules using the Firestore REST API
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function deployRules() {
  try {
    // Get the access token using gcloud
    const accessToken = execSync('gcloud auth print-access-token', { encoding: 'utf-8' }).trim();

    // Read the rules file
    const rulesPath = path.join(__dirname, '..', 'firestore.rules');
    const rulesContent = fs.readFileSync(rulesPath, 'utf-8');

    // Prepare the request body
    const projectId = 'study-schedule-app';
    const requestBody = JSON.stringify({
      source: {
        files: [
          {
            content: rulesContent,
            name: 'firestore.rules'
          }
        ]
      }
    });

    // Deploy using curl
    const curlCommand = `curl -X POST \
      "https://firebaserules.googleapis.com/v1/projects/${projectId}/rulesets" \
      -H "Authorization: Bearer ${accessToken}" \
      -H "Content-Type: application/json" \
      -d '${requestBody.replace(/'/g, "'\"'\"'")}'`;

    console.log('Deploying Firestore rules...');
    const response = execSync(curlCommand, { encoding: 'utf-8' });
    const result = JSON.parse(response);

    if (result.name) {
      // Extract ruleset ID from the response
      const rulesetId = result.name.split('/').pop();

      // Now release the ruleset to make it active
      const releaseCommand = `curl -X PATCH \
        "https://firebaserules.googleapis.com/v1/projects/${projectId}/releases/cloud.firestore" \
        -H "Authorization: Bearer ${accessToken}" \
        -H "Content-Type: application/json" \
        -d '{"release": {"rulesetName": "projects/${projectId}/rulesets/${rulesetId}"}}'`;

      console.log('Releasing ruleset...');
      execSync(releaseCommand, { encoding: 'utf-8' });

      console.log('✅ Firestore rules deployed successfully!');
    } else {
      console.error('Failed to deploy rules:', result);
      process.exit(1);
    }
  } catch (error) {
    console.error('Error deploying rules:', error.message);
    process.exit(1);
  }
}

deployRules();