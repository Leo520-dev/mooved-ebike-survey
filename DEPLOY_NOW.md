# MOOVED E-Bike Survey - 快速部署指南

## 📋 核心步骤（约10分钟完成）

### 第1步: 创建 Google Sheet (2分钟)
1. 打开 https://sheets.new/
2. 重命名工作簿为 "MOOVED E-Bike Survey"
3. 在 **Sheet1** 中，第1行输入列名：
   | A1: Salesperson | B1: Region | C1: District | D1: Submitted At | E1: Updated At |
4. 点击底部 "+" 新建工作表，重命名为 **Vehicles**
5. 在 **Vehicles** 工作表第1行输入列名：
   | A1: Submission ID | B1: Photo | C1: Range km | D1: Charging time h | E1: Weight kg | F1: Price GHS | G1: Notes | H1: Created At |

### 第2步: 获取 Sheet ID (30秒)
- 浏览器地址栏 URL 格式：`https://docs.google.com/spreadsheets/d/SHEET_ID_HERE/edit...`
- 复制 `/d/` 和 `/edit` 之间的长字符串，例如：`148kP9e2cWK7RTDSeGwqeRevHmTs-nzMsDcwQPEb-shQ`

### 第3步: 创建 Apps Script (3分钟)
1. 在 Google Sheet 中，点击菜单 **Extensions > Apps Script**
2. 删除编辑器中所有现有代码
3. 打开文件 `D:\桌面\Hermes 中文社区版\4.个人工作辅助\加纳电动车调研\google-apps-script.js`
4. **全选复制** 全部内容
5. 粘贴到 Apps Script 编辑器，**替换所有原有代码**
6. **关键**: 找到第16行 `var SHEET_ID = 'YOUR_SHEET_ID_HERE';`
7. 将 `'YOUR_SHEET_ID_HERE'` 替换为你的实际 Sheet ID（第2步复制的字符串）
8. 按 **Ctrl+S** 保存

### 第4步: 部署为 Web App (2分钟)
1. 点击顶部菜单 **Deploy > New deployment**
2. 点击左侧齿轮图标 ⚙️，选择 **Web app**
3. 填写：
   - Description: `MOOVED E-Bike Survey API`
   - Execute as: **Me** (你的邮箱)
   - Who has access: **Anyone** ← 必须选这个！否则前端无法访问
4. 点击 **Deploy**
5. Google 会弹窗要求授权 → 点击 **Review permissions** → 选择账号 → 点击 **Advanced** → 点击 **Go to ... (unsafe)** → 点击 **Allow**
6. 部署成功后，复制 **Web App URL**，类似：
   ```
   https://script.google.com/macros/s/AKfycbxXXXXXXXXXXXXXXXX/exec
   ```

### 第5步: 更新前端 API 地址 (1分钟)
1. 打开文件：`D:\桌面\Hermes 中文社区版\4.个人工作辅助\加纳电动车调研\index.html`
2. 搜索 `YOUR_SCRIPT_ID`
3. 替换为你的实际脚本 ID（从 Web App URL 中提取 `/s/` 和 `/exec` 之间的部分）
   
   例如：如果 URL 是 `https://script.google.com/macros/s/AKfycbx123456/exec`
   
   则将：
   ```javascript
   var API = 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec';
   ```
   改为：
   ```javascript
   var API = 'https://script.google.com/macros/s/AKfycbx123456/exec';
   ```

4. 保存文件

### 第6步: 推送到 GitHub
```powershell
cd "D:\桌面\Hermes 中文社区版\4.个人工作辅助\加纳电动车调研"
git add -A
git commit -m "Update API URL to production"
git push -u origin main
```

GitHub Pages 会在约1-2分钟内自动重新部署。

---

## ✅ 验证清单

部署完成后逐一检查：

| 检查项 | 方法 | 预期结果 |
|--------|------|----------|
| 首页加载 | 浏览器访问 https://leo520-dev.github.io/mooved-ebike-survey/ | 问卷表单正常显示 |
| 提交数据 | 填写表单并提交 | 显示"提交成功"提示 |
| 查看数据 | 打开 Google Sheet | 数据出现在 Submissions 和 Vehicles 表中 |
| Admin Panel | 点击 Admin Panel → 输入密码 mooved2026 | 看到统计数据和记录列表 |
| 导出 CSV | Admin Panel 中点击 Export CSV | 下载 CSV 文件 |

---

## 🔗 最终链接

- **前端页面**: https://leo520-dev.github.io/mooved-ebike-survey/
- **Google Sheet**: https://docs.google.com/spreadsheets/d/[你的Sheet_ID]/edit
- **GitHub 仓库**: https://github.com/Leo520-dev/mooved-ebike-survey

---

## ⚠️ 常见问题

**Q: 提交时显示 "Network error"**
A: 检查 Google Apps Script 部署时 "Who has access" 是否设置为 "Anyone"

**Q: 提交后 Google Sheet 中没有数据**
A: 检查 Sheet 名称是否为 "Submissions" 和 "Vehicles"（区分大小写）

**Q: 管理员面板显示 "Incorrect password"**
A: 默认密码是 mooved2026，检查是否输入正确

**Q: 前端更新没有生效**
A: GitHub Pages 可能需要1-2分钟重新部署，刷新浏览器缓存（Ctrl+F5）
