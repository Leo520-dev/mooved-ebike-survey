# MOOVED E-Bike Survey - Production Deployment Guide

## 📋 方案对比

| 方案 | 费用 | 难度 | 推荐度 |
|------|------|------|--------|
| **方案A: PythonAnywhere** (推荐) | 免费 | ⭐ 简单 | ⭐⭐⭐⭐⭐ |
| 方案B: Railway (手动网页) | 免费额度 | ⭐⭐ 中等 | ⭐⭐⭐⭐ |
| 方案C: Google Cloud Run | 免费额度 | ⭐⭐⭐ 较难 | ⭐⭐⭐ |

---

## 🏆 方案A: PythonAnywhere (强烈推荐)

### 为什么选它？
- ✅ **完全免费** (每月 100,000 请求)
- ✅ **原生支持 Flask + SQLite**
- ✅ **512MB 磁盘空间** (足够用很久)
- ✅ **无需信用卡**
- ✅ **支持自定义域名** (付费方案)

### 部署步骤

#### 第1步: 注册账号
1. 打开 https://www.pythonanywhere.com/
2. 点击 "Sign up"
3. 用 GitHub 或 Google 登录
4. 选择 **Free** 计划

#### 第2步: 上传代码
1. 登录后进入 Dashboard
2. 点击 "Files" → "Bash" (顶部标签)
3. 运行以下命令克隆仓库:
   ```bash
   cd ~
   git clone https://github.com/Leo520-dev/mooved-ebike-survey.git
   cd mooved-ebike-survey
   pip install flask
   ```

#### 第3步: 配置 Web 应用
1. 点击顶部 "Web" 标签
2. 点击 "Add a new web app"
3. 选择 **Manual Config**
4. 选择 **Python 3.10+**
5. 点击 "Next" → "Done"

#### 第4步: 修改 WSGI 配置
1. 在 Web 页面，找到 "WSGI configuration file"
2. 编辑该文件，替换为以下内容:

```python
import sys
path = '/home/你的用户名/mooved-ebike-survey'
if path not in sys.path:
    sys.path.append(path)

from server import app as application
```

> ⚠️ 把 `你的用户名` 换成你在 PythonAnywhere 的实际用户名

#### 第5步: 修改 server.py (适配 PythonAnywhere)
在 `server.py` 最后找到 `app.run(...)` 那一行，**注释掉或删除**:
```python
# app.run(host="0.0.0.0", port=5000, debug=False)
```

PythonAnywhere 通过 WSGI 启动，不需要手动 run。

#### 第6步: 设置数据库路径
在 `server.py` 中找到 `DB_PATH` 定义，改为:
```python
DB_PATH = os.path.join(BASE_DIR, "data", "survey.db")
os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
```

#### 第7步: 重新加载
1. 回到 Web 页面
2. 点击顶部橙色 "Reload 你的用户名.pythonanywhere.com" 按钮

### 访问地址
- **免费域名**: `https://你的用户名.pythonanywhere.com/`
- **API**: `https://你的用户名.pythonanywhere.com/api/...`

### 更新前端 API 地址
修改 `index.html` 中的 API 地址:
```javascript
var API = 'https://你的用户名.pythonanywhere.com/api';
```

然后推送到 GitHub，GitHub Pages 会自动重新部署。

---

## 🚀 方案B: Railway (手动网页)

### 前提条件
- 已有 GitHub 账号 (Leo520-dev)

### 部署步骤

#### 第1步: 创建项目
1. 打开 https://railway.app/
2. 点击 "Login" → "Continue with GitHub"
3. 登录后点击 "New Project"
4. 选择 "Deploy from GitHub repo"
5. 搜索并选择 `mooved-ebike-survey`

#### 第2步: 配置构建
1. 在项目页面，点击 "Variables"
2. 添加环境变量:
   - `PORT` = `8080`
3. 点击 "Settings" → "Build Configuration"
4. 设置:
   - **Start Command**: `python server.py`
   - **Build Command**: `pip install flask`

#### 第3步: 部署
1. 确保代码已推送到 GitHub main 分支
2. Railway 会自动检测并开始部署
3. 部署完成后，在 "Deployments" 页面获取 URL

### 访问地址
- **生产 URL**: `https://mooved-ebike-survey-production.up.railway.app/`

---

## 📁 需要准备的文件

### 1. requirements.txt
```
flask==3.0.0
```

### 2. Procfile (Railway 需要)
```
web: python server.py
```

### 3. Dockerfile (可选，通用方案)
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY . .
RUN pip install flask
EXPOSE 5000
CMD ["python", "server.py"]
```

---

## 🔧 部署前必做修改

### server.py 修改清单
1. **数据库路径**: 确保数据目录存在
2. **删除 `app.run()`**: 云平台通过 WSGI 启动
3. **CORS 配置**: 允许跨域请求

### index.html 修改清单
1. **API 地址**: 改为生产环境 URL
2. **测试**: 提交功能是否正常

---

## ✅ 验证清单

部署完成后，逐一检查:

| 检查项 | 方法 | 预期结果 |
|--------|------|----------|
| 首页加载 | 浏览器访问 URL | 问卷表单显示正常 |
| 提交数据 | 填写并提交问卷 | 成功提示 |
| 查看数据 | Admin Panel → 输入密码 | 看到提交记录 |
| 导出 CSV | Admin Panel → Export | 下载 CSV 文件 |
| 统计图表 | Admin Panel → Stats | 显示统计数据 |

---

## 📞 常见问题

**Q: 数据库数据会丢失吗？**
A: PythonAnywhere 和 Railway 的 SQLite 数据库在免费套餐下会保留。但建议定期备份 `survey.db` 文件。

**Q: 免费套餐有流量限制吗？**
A: PythonAnywhere 免费套餐每月 100,000 请求，足够销售团队使用。Railway 免费套餐每月 500 小时运行时间。

**Q: 如何更换域名？**
A: PythonAnywhere 付费方案 ($5/月) 支持自定义域名。Railway 也支持绑定自定义域名。

---

## 🎯 推荐操作顺序

1. **立即**: 用 PythonAnywhere 部署后端 (5分钟搞定)
2. **然后**: 修改前端 API 地址，推送 GitHub
3. **最后**: 测试全流程，分享给销售员

📁 D:\桌面\Hermes 中文社区版\4.个人工作辅助\加纳电动车调研\DEPLOYMENT_GUIDE.md
