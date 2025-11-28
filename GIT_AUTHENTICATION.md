# Git Authentication Setup

## Problem
```
Permission denied (publickey)
fatal: Could not read from remote repository.
```

This happens when using SSH but SSH keys aren't set up with GitHub.

## Solution 1: Use HTTPS (Easiest - Already Applied)

I've switched the remote back to HTTPS. Now you can push using:

```bash
git push -u origin main
```

GitHub will prompt for:
- **Username:** Your GitHub username
- **Password:** Use a **Personal Access Token** (not your GitHub password)

### Create Personal Access Token

1. Go to GitHub: https://github.com/settings/tokens
2. Click "Generate new token" → "Generate new token (classic)"
3. Give it a name (e.g., "HesabDooni Project")
4. Select scopes: `repo` (full control of private repositories)
5. Click "Generate token"
6. **Copy the token** (you won't see it again!)
7. Use this token as your password when pushing

## Solution 2: Set Up SSH Keys (For Future)

If you want to use SSH (more convenient long-term):

### Step 1: Generate SSH Key
```bash
ssh-keygen -t ed25519 -C "your_email@example.com"
# Press Enter to accept default location
# Enter a passphrase (optional but recommended)
```

### Step 2: Add SSH Key to SSH Agent
```bash
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519
```

### Step 3: Copy Public Key
```bash
cat ~/.ssh/id_ed25519.pub
# Copy the entire output
```

### Step 4: Add to GitHub
1. Go to: https://github.com/settings/keys
2. Click "New SSH key"
3. Title: "Mac - HesabDooni"
4. Paste your public key
5. Click "Add SSH key"

### Step 5: Switch to SSH
```bash
git remote set-url origin git@github.com:AmirAbbasVafaee/hesabdoni.git
git push -u origin main
```

## Current Configuration

- **Remote URL:** HTTPS (https://github.com/AmirAbbasVafaee/hesabdoni.git)
- **Credential Helper:** osxkeychain (will save your token)

## Try Pushing Now

```bash
git push -u origin main
```

When prompted:
- **Username:** `AmirAbbasVafaee`
- **Password:** Your Personal Access Token (not your GitHub password)

The token will be saved in macOS Keychain for future use.

## Troubleshooting

### If HTTPS still asks for password repeatedly:
1. Make sure you're using a Personal Access Token (not password)
2. Check that `credential.helper` is set: `git config --global credential.helper`
3. Clear saved credentials: `git credential-osxkeychain erase` then enter GitHub URL

### If you want to use SSH:
Follow Solution 2 above to set up SSH keys.



