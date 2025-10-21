# deploy.ps1

# 设置 Git 用户信息（替换为你的姓名和邮箱）
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# 初始化仓库（如果已经初始化可跳过）
if (-not (Test-Path .git)) {
    git init
}

# 添加远程 origin（如果已存在则先移除再添加）
$remote = git remote
if ($remote -contains "origin") {
    git remote remove origin
}
git remote add origin https://github.com/LJ996007/agent-fee-calculator.git

# 添加所有变更并提交
git add .
git commit -m "Initial commit"

# 切换到 main 分支
git branch -M main

# 推送到远程仓库
git push -u origin main
