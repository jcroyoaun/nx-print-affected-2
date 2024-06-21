const core = require('@actions/core');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

try {
  const tag = core.getInput('tag', { required: true });
  const workspacePath = process.env.GITHUB_WORKSPACE;

  // Get changed files
  const changedFiles = execSync('git diff --name-only HEAD~1 HEAD', { encoding: 'utf-8' })
    .trim().split('\n');

  // Read nx.json
  const nxConfigPath = path.join(workspacePath, 'nx.json');
  const nxConfig = JSON.parse(fs.readFileSync(nxConfigPath, 'utf8'));

  // Map changed files to projects
  const affectedProjects = new Set();
  changedFiles.forEach(file => {
    for (const [project, config] of Object.entries(nxConfig.projects)) {
      if (file.startsWith(config.root)) {
        affectedProjects.add(project);
        break;
      }
    }
  });

  // Filter affected projects by tag
  const filteredProjects = Array.from(affectedProjects).filter(project => {
    const projectConfigPath = path.join(workspacePath, nxConfig.projects[project], 'project.json');
    const projectConfig = JSON.parse(fs.readFileSync(projectConfigPath, 'utf8'));
    return projectConfig.tags && projectConfig.tags.includes(tag);
  });

  const affectedString = filteredProjects.join(' ');
  core.setOutput('affected_projects', affectedString);
} catch (error) {
  core.setFailed(error.message);
}


