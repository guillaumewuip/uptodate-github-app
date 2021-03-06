workflow "CI" {
  on = "push"
  resolves = ["Lint", "Build", "Test"]
}

action "Install" {
  uses = "actions/npm@59b64a598378f31e49cb76f27d6f3312b582f680"
  args = "install"
}

action "Lint" {
  needs = "Install"
  uses = "actions/npm@59b64a598378f31e49cb76f27d6f3312b582f680"
  args = "run-script lint"
}

action "Build" {
  needs = "Install"
  uses = "actions/npm@59b64a598378f31e49cb76f27d6f3312b582f680"
  args = "run-script build"
}

action "Test" {
  needs = "Install"
  uses = "actions/npm@59b64a598378f31e49cb76f27d6f3312b582f680"
  args = "run-script test"
}
