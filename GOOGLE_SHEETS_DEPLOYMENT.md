# MOOVED E-Bike Survey - Google Sheets 部署方案

## 📋 方案说明

这个方案使用 **Google Sheets 作为数据库**，前端纯 HTML/JS 运行在 GitHub Pages 上。

**优点：**
- ✅ 完全免费（Google Sheets + GitHub Pages）
- ✅ 无需后端服务器
- ✅ 数据实时同步到 Google Sheets
- ✅ 管理员可以直接在 Google Sheets 查看数据
- ✅ 支持多车型提交
- ✅ 移动端友好

---

## 🚀 部署步骤

### 第1步: 创建 Google Sheet

1. 打开 https://sheets.new/
2. 重命名为 "MOOVED E-Bike Survey"
3. 在第1行添加以下列名：
   - A1: Salesperson
   - B1: Region  
   - C1: District
   - D1: Submitted At
   - E1: Updated At
4. 新建一个工作表（底部 "+"），重命名为 "Vehicles"
5. 在 Vehicles 工作表第1行添加：
   - A1: Submission ID
   - B1: Photo
   - C1: Range km
   - D1: Charging time h
   - E1: Weight kg
   - F1: Price GHS
   - G1: Notes
   - H1: Created At

### 第2步: 获取 Sheet ID

1. 在浏览器地址栏中，找到 Sheet URL：
   `https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit#gid=0`
2. 复制 `YOUR_SHEET_ID` 部分（长字符串）

### 第3步: 创建 Google Apps Script

1. 在 Google Sheet 中，点击菜单 **Extensions > Apps Script**
2. 删除所有现有代码
3. 粘贴 `google-apps-script.js` 文件的内容
4. 将 `SHEET_ID = 'YOUR_SHEET_ID_HERE'` 替换为你的实际 Sheet ID

### 第4步: 部署为 Web App

1. 点击 **Deploy > New deployment**
2. 选择类型：**Web app**
3. 配置：
   - Description: "MOOVED E-Bike Survey API"
   - Execute as: **Me** (your email)
   - Who has access: **Anyone** (重要！)
4. 点击 **Deploy**
5. 授权访问权限（Google 会要求授权）
6. 复制生成的 **Web App URL**，格式类似：
   `https://script.google.com/macros/s/AKfycbx.../exec`

### 第5步: 更新前端代码

1. 打开 `index.html` 文件
2. 找到第 320 行左右的 `var API = ...`
3. 将 `YOUR_SCRIPT_ID` 替换为你的 Web App URL 中的脚本 ID
4. 推送到 GitHub

---

## 📁 文件列表

| 文件 | 说明 |
|------|------|
| `google-apps-script.js` | Google Apps Script 后端代码 |
| `index.html` | 前端问卷页面 |
| `DEPLOYMENT_GUIDE.md` | 本部署指南 |

---

## ✅ 验证清单

部署完成后，逐一检查：

| 检查项 | 方法 | 预期结果 |
|--------|------|----------|
| 首页加载 | 浏览器访问 GitHub Pages URL | 问卷表单显示正常 |
| 提交数据 | 填写并提交问卷 | 成功提示，数据出现在 Google Sheet |
| 查看数据 | Admin Panel → 输入密码 | 看到提交记录 |
| 导出 CSV | Admin Panel → Export | 下载 CSV 文件 |
| 统计图表 | Admin Panel → Stats | 显示统计数据 |

---

## 🔧 常见问题

**Q: 提交时显示"Network error"**
A: 检查 Google Apps Script 的 Web App 权限是否设置为 "Anyone"

**Q: 数据没有出现在 Google Sheet 中**
A: 检查 SHEET_ID 是否正确，以及 Apps Script 是否有编辑权限

**Q: 管理员看不到数据**
A: 确保前端 API 地址指向正确的 Web App URL

---

## 📞 技术支持

如有问题，请检查：
1. Google Apps Script 部署日志（Deploy > Manage deployments > View logs）
2. 浏览器控制台错误信息
3. Google Sheet 权限设置
