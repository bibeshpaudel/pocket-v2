// Pocket — Git Cheatsheet data. A curated, accurate catalog of git commands grouped
// by topic. Each command: { cmd, desc, note?, example?, danger? }.
//   desc  — what it does, in one line
//   note  — plain-language "why / when you'd use it" or a heads-up (the teaching bit)
// Consumed by GitCheatsheet.jsx.

export const GIT_CATEGORIES = [
  {
    id: "Setup & config",
    icon: "settings",
    blurb: "Tell Git who you are and how it should behave. You usually do this once per machine.",
    commands: [
      { cmd: 'git config --global user.name "Your Name"', desc: "Set the name attached to your commits", note: "This name shows up next to every commit you make, everywhere." },
      { cmd: 'git config --global user.email "you@example.com"', desc: "Set the email attached to your commits", note: "Match your GitHub/GitLab email so commits link back to your account." },
      { cmd: 'git config --global core.editor "code --wait"', desc: "Set the editor Git opens for messages", note: "Used when you write commit messages or do an interactive rebase." },
      { cmd: "git config --global init.defaultBranch main", desc: "Name the default branch 'main' on init", note: "The modern default. Older Git created 'master' instead." },
      { cmd: "git config --list", desc: "List every setting Git is currently using", note: "Add --show-origin to see which file each setting comes from." },
      { cmd: "git config --global alias.co checkout", desc: "Make a shortcut: 'git co' runs 'git checkout'", note: "Aliases save keystrokes for commands you type all day." },
    ],
  },
  {
    id: "Create & clone",
    icon: "folder-plus",
    blurb: "Start a brand-new repo, or download an existing one to work on.",
    commands: [
      { cmd: "git init", desc: "Turn the current folder into a new Git repo", note: "Creates a hidden .git folder. Nothing is tracked until you add files." },
      { cmd: "git clone <url>", desc: "Copy a remote repo and its full history locally", note: "You get every branch and all history, not just the latest files.", example: "git clone https://github.com/user/repo.git" },
      { cmd: "git clone <url> <dir>", desc: "Clone into a specific folder name", note: "Handy when the repo name isn't the folder name you want." },
      { cmd: "git clone --depth 1 <url>", desc: "Shallow clone — latest commit only, much faster", note: "Great for CI or when you don't care about old history." },
    ],
  },
  {
    id: "Stage & snapshot",
    icon: "file-plus",
    blurb: "Staging is a draft of your next commit. You pick exactly what goes in before committing.",
    commands: [
      { cmd: "git status", desc: "Show changed, staged, and untracked files", note: "Your most-used command — run it constantly to see where you stand." },
      { cmd: "git status -s", desc: "Short, compact status output", note: "Two columns: left = staged, right = working tree." },
      { cmd: "git add <file>", desc: "Stage a file's changes for the next commit", note: "Staging is reversible — you can keep adjusting before you commit." },
      { cmd: "git add .", desc: "Stage every change in the current directory", note: "Respects .gitignore, so ignored files stay out." },
      { cmd: "git add -p", desc: "Interactively stage individual chunks (hunks)", note: "Lets you split one messy edit into clean, separate commits." },
      { cmd: "git reset <file>", desc: "Unstage a file but keep its changes", note: "The opposite of git add. Your edits are safe." },
      { cmd: "git rm <file>", desc: "Delete a file and stage the removal", note: "Use this instead of deleting by hand so Git records the removal." },
      { cmd: "git rm --cached <file>", desc: "Stop tracking a file but keep it on disk", note: "Common fix when you accidentally committed something that belongs in .gitignore." },
      { cmd: "git mv <old> <new>", desc: "Rename or move a file and stage it", note: "Same as renaming the file and staging it in one step." },
      { cmd: "git diff", desc: "Show unstaged changes (working tree vs index)", note: "Shows what you'd lose if you discarded now — review before committing." },
      { cmd: "git diff --staged", desc: "Show staged changes (index vs last commit)", note: "Preview exactly what your next commit will contain." },
    ],
  },
  {
    id: "Commit",
    icon: "git-commit-horizontal",
    blurb: "A commit is a saved snapshot with a message. It's the unit of history in Git.",
    commands: [
      { cmd: 'git commit -m "message"', desc: "Commit staged changes with a message", note: "Write in the present tense: 'Add login', not 'Added login'." },
      { cmd: 'git commit -am "message"', desc: "Stage all tracked files and commit in one step", note: "Skips git add — but only for files Git already tracks, not new ones." },
      { cmd: "git commit --amend", desc: "Rewrite the last commit (message or contents)", note: "Only amend commits you haven't pushed yet." },
      { cmd: "git commit --amend --no-edit", desc: "Add staged changes to the last commit, keep its message", note: "Perfect for 'oops, I forgot a file' moments." },
      { cmd: 'git commit --allow-empty -m "msg"', desc: "Create a commit with no file changes", note: "Useful to trigger CI or mark a point in history." },
    ],
  },
  {
    id: "Branch",
    icon: "git-branch",
    blurb: "Branches let you work on something without touching the main line until it's ready.",
    commands: [
      { cmd: "git branch", desc: "List local branches", note: "The branch you're on is marked with a *." },
      { cmd: "git branch -a", desc: "List all branches, local and remote", note: "Remote ones appear as remotes/origin/…." },
      { cmd: "git switch <name>", desc: "Switch to an existing branch", note: "Newer, clearer replacement for git checkout." },
      { cmd: "git switch -c <name>", desc: "Create a new branch and switch to it", note: "Branches off whatever you have checked out right now." },
      { cmd: "git checkout -b <name>", desc: "Create and switch to a branch (older syntax)", note: "Same as switch -c — you'll see this a lot in older guides." },
      { cmd: "git branch -d <name>", desc: "Delete a branch that's been merged", note: "Git refuses if it has unmerged work — a built-in safety net." },
      { cmd: "git branch -D <name>", desc: "Force-delete a branch, even if unmerged", danger: true, note: "Skips the safety check; the unmerged work may be hard to recover." },
      { cmd: "git branch -m <new-name>", desc: "Rename the current branch", note: "Renames the branch you're currently on." },
      { cmd: "git branch -vv", desc: "Show branches with their upstream tracking", note: "Tells you if each branch is ahead of or behind its remote." },
    ],
  },
  {
    id: "Merge & rebase",
    icon: "git-merge",
    blurb: "Two ways to combine branches: merge keeps history as-is, rebase rewrites it to stay tidy.",
    commands: [
      { cmd: "git merge <branch>", desc: "Merge another branch into the current one", note: "Brings their commits in; may create a merge commit." },
      { cmd: "git merge --no-ff <branch>", desc: "Merge, always creating a merge commit", note: "Keeps a clear record that a feature branch existed." },
      { cmd: "git merge --abort", desc: "Cancel a merge that hit conflicts", note: "Resets everything back to before the merge began." },
      { cmd: "git rebase <branch>", desc: "Replay your commits on top of another branch", danger: true, note: "Makes history linear, but rewrites commit IDs — avoid on shared branches." },
      { cmd: "git rebase -i <commit>", desc: "Interactively squash, reorder, or edit commits", danger: true, note: "The go-to tool for cleaning up messy commits before sharing them." },
      { cmd: "git rebase --continue", desc: "Resume a rebase after resolving conflicts", note: "Run it after git add-ing your conflict fixes." },
      { cmd: "git rebase --abort", desc: "Cancel a rebase and return to the start", note: "Your escape hatch if a rebase gets confusing." },
      { cmd: "git cherry-pick <commit>", desc: "Apply one specific commit onto your branch", note: "Grab a single fix from another branch without merging everything." },
    ],
  },
  {
    id: "Remote & sync",
    icon: "cloud",
    blurb: "Remotes are copies on a server (like GitHub). These commands move commits to and from them.",
    commands: [
      { cmd: "git remote -v", desc: "List remotes and their URLs", note: "'origin' is just the conventional name for your main remote." },
      { cmd: "git remote add origin <url>", desc: "Connect your repo to a remote named 'origin'", note: "First step after creating an empty repo on GitHub." },
      { cmd: "git remote set-url origin <url>", desc: "Change a remote's URL", note: "Use when switching HTTPS↔SSH or when a repo moved." },
      { cmd: "git fetch", desc: "Download remote changes without merging them", note: "Safe — it never touches your files or current branch." },
      { cmd: "git pull", desc: "Fetch and merge the remote branch into yours", note: "Equivalent to git fetch followed by git merge." },
      { cmd: "git pull --rebase", desc: "Fetch and rebase your commits on top", note: "Avoids noisy merge commits when syncing with teammates." },
      { cmd: "git push", desc: "Upload your commits to the remote", note: "Only sends the current branch unless you say otherwise." },
      { cmd: "git push -u origin <branch>", desc: "Push and remember the upstream for next time", note: "After this, plain 'git push' and 'git pull' just work." },
      { cmd: "git push --force-with-lease", desc: "Force-push safely — won't clobber others' new work", danger: true, note: "Safer than --force: it aborts if someone else has pushed." },
      { cmd: "git push origin --delete <branch>", desc: "Delete a branch on the remote", danger: true, note: "Removes it on the server only; your local branch stays." },
    ],
  },
  {
    id: "Inspect & compare",
    icon: "search",
    blurb: "Read history, see who changed what, and compare any two points in time.",
    commands: [
      { cmd: "git log", desc: "Show commit history", note: "Press q to quit the scrolling log viewer." },
      { cmd: "git log --oneline", desc: "One compact line per commit", note: "Best for a quick bird's-eye view of recent work." },
      { cmd: "git log --oneline --graph --all", desc: "Visualize all branches as an ASCII graph", note: "See how branches diverged and merged over time." },
      { cmd: "git log -p", desc: "Show history with each commit's diff", note: "Read exactly what changed in every commit." },
      { cmd: "git log --stat", desc: "Show which files changed per commit", note: "A summary of files touched, without the full diff." },
      { cmd: "git log -<n>", desc: "Show only the last n commits", note: "Quick way to peek at just the most recent commits.", example: "git log -5" },
      { cmd: "git show <commit>", desc: "Show a commit's message and changes", note: "Defaults to the latest commit if you omit the hash." },
      { cmd: "git blame <file>", desc: "Show who last changed each line", note: "Great for finding why a line exists and who to ask." },
      { cmd: "git diff <a>..<b>", desc: "Compare two commits or branches", note: "Works with branches, tags, or commit hashes.", example: "git diff main..feature" },
      { cmd: "git shortlog -sn", desc: "Count commits per author", note: "A quick contributor leaderboard." },
    ],
  },
  {
    id: "Undo & recover",
    icon: "rotate-ccw",
    blurb: "Step back safely. Knowing reflog means you can rescue almost anything you 'lost'.",
    commands: [
      { cmd: "git restore <file>", desc: "Discard unstaged changes in a file", danger: true, note: "Throws your edits away for good — there's no undo for this." },
      { cmd: "git restore --staged <file>", desc: "Unstage a file but keep its changes", note: "Moves a file from staged back to just-modified." },
      { cmd: "git restore --source=<commit> <file>", desc: "Restore a file from a specific commit", note: "Pull an old version of one file into your working tree." },
      { cmd: "git reset --soft HEAD~1", desc: "Undo the last commit, keep changes staged", note: "Great for re-doing a commit message or combining commits." },
      { cmd: "git reset HEAD~1", desc: "Undo the last commit, keep changes unstaged", note: "Uncommits and unstages, but your edits stay put (the default)." },
      { cmd: "git reset --hard HEAD~1", desc: "Undo the last commit AND discard its changes", danger: true, note: "Deletes the commit and its changes. Double-check before running." },
      { cmd: "git revert <commit>", desc: "Make a new commit that undoes a past one", note: "The safe way to undo on a branch you've already pushed." },
      { cmd: "git reflog", desc: "Log of everywhere HEAD has been", note: "Your safety net — find and recover 'lost' commits for ~30 days." },
      { cmd: "git clean -fd", desc: "Delete untracked files and folders", danger: true, note: "Run 'git clean -n' first to preview what will be deleted." },
    ],
  },
  {
    id: "Stash",
    icon: "archive",
    blurb: "Park half-finished work so you can switch tasks, then bring it back later.",
    commands: [
      { cmd: "git stash", desc: "Save uncommitted changes and clean the working tree", note: "Lets you switch branches quickly without committing first." },
      { cmd: "git stash -u", desc: "Stash including untracked files", note: "Plain stash leaves new files behind; -u takes them too." },
      { cmd: "git stash list", desc: "List saved stashes", note: "Stashes are named stash@{0}, stash@{1}, and so on." },
      { cmd: "git stash pop", desc: "Reapply the latest stash and remove it", note: "Apply your saved work and clear it from the list." },
      { cmd: "git stash apply", desc: "Reapply a stash but keep it in the list", note: "Like pop, but keeps the stash so you can reuse it." },
      { cmd: "git stash drop", desc: "Delete a stash", note: "Remove a stash you no longer need." },
      { cmd: "git stash branch <name>", desc: "Create a new branch from a stash", note: "Best when your stash would conflict with current changes." },
    ],
  },
  {
    id: "Tags",
    icon: "tag",
    blurb: "Tags are permanent bookmarks on a commit — usually for marking releases.",
    commands: [
      { cmd: "git tag", desc: "List tags", note: "Lightweight tags are just named pointers to a commit." },
      { cmd: "git tag <name>", desc: "Create a lightweight tag at HEAD", note: "Often used for version numbers.", example: "git tag v1.0.0" },
      { cmd: 'git tag -a <name> -m "msg"', desc: "Create an annotated tag with a message", note: "Annotated tags store author, date, and a note — use these for releases." },
      { cmd: "git push origin <tag>", desc: "Push a single tag to the remote", note: "Tags aren't pushed automatically — you send them explicitly." },
      { cmd: "git push --tags", desc: "Push all local tags", note: "Sends every tag you have at once." },
      { cmd: "git tag -d <name>", desc: "Delete a local tag", note: "Deleting locally doesn't remove it from the remote." },
    ],
  },
  {
    id: "Advanced",
    icon: "sparkles",
    blurb: "Power tools worth knowing exist — reach for them when the basics aren't enough.",
    commands: [
      { cmd: "git bisect start", desc: "Binary-search history to find a bad commit", note: "Git checks out commits for you to test until it finds the culprit." },
      { cmd: "git worktree add <path> <branch>", desc: "Check out a branch in a separate folder", note: "Work on two branches at once without stashing." },
      { cmd: "git submodule update --init --recursive", desc: "Initialize and fetch all submodules", note: "Run this after cloning a repo that contains submodules." },
      { cmd: "git archive --format=zip HEAD > out.zip", desc: "Export the repo's files as a zip", note: "Files only — no .git history is included." },
      { cmd: "git gc", desc: "Clean up and compress the repository", note: "Git runs this automatically now and then; rarely needed by hand." },
      { cmd: "git rev-parse HEAD", desc: "Print the full SHA of the current commit", note: "Handy in scripts to capture the exact commit you're on." },
    ],
  },
];

// Flat list with category attached — handy for search and quiz.
export const GIT_COMMANDS = GIT_CATEGORIES.flatMap((cat) =>
  cat.commands.map((c) => ({ ...c, category: cat.id, categoryIcon: cat.icon }))
);

export const GIT_COMMAND_COUNT = GIT_COMMANDS.length;
