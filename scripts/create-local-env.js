const { spawn } = require("child_process");
const fs = require("fs");
const readline = require("readline");

function getUserInput(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

function parseConfig(output) {
  const match = output.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0].replace(/firebase\.initializeApp\(|\);/g, ""));
  } catch (e) {
    return null;
  }
}

async function getFirebaseConfig(projectId) {
  return new Promise((resolve, reject) => {
    const child = spawn("firebase", ["apps:sdkconfig", "WEB", "--project", projectId], {
      stdio: ["inherit", "pipe", "inherit"],
    });

    let output = "";
    child.stdout.on("data", (data) => {
      output += data.toString();
      process.stdout.write(data); // ユーザーにプロンプトを見せるため出力
    });

    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error("Failed to get config"));
        return;
      }
      const config = parseConfig(output);
      if (!config) {
        reject(new Error("Failed to parse Firebase config"));
        return;
      }
      resolve(config);
    });
  });
}

async function createEnvFile() {
  try {
    const gcpProjectId = await getUserInput("Enter NEXT_PUBLIC_GCP_PROJECT_ID: ");
    const gcpRegion = "asia-northeast1";

    console.log("Please select your web app from the list below:");
    const firebaseConfig = await getFirebaseConfig(gcpProjectId);
    const firebaseConfigString = JSON.stringify(firebaseConfig);

    const envContent = `NEXT_PUBLIC_FIREBASE_CONFIG='${firebaseConfigString}'\nNEXT_PUBLIC_GCP_PROJECT_ID=${gcpProjectId}\nNEXT_PUBLIC_GCP_REGION=${gcpRegion}\n`;
    fs.writeFileSync(".env.local", envContent);

    console.log(".env.local file created successfully.");
  } catch (error) {
    console.error("Error:", error.message);
  }
}

createEnvFile();
