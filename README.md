# Voting System

本系統是一個專為最多 150 名用戶的組織設計的線上投票平台，支援多種角色管理與投票功能，包含出席統計、視覺化圖表與 Cloudflare Tunnel 安全連線部署。

---

## 功能特色

- **多角色權限驗證**：使用 JWT 驗證，依使用者角色限制權限。
- **投票流程設計**：包含出席簽到、贊成 / 反對 / 棄權選項、未投票者自動記錄為棄權。
- **即時圖表統計**：投票結果以 Recharts 呈現。
- **安全部署**：整合 Cloudflare Tunnel、Nginx 與 GCP VM 主機。

---

## 安裝順序與詳細步驟

### ✅ 1. 建立 GCP VM（建議 Ubuntu 22.04）

1. 登入 [Google Cloud Console](https://console.cloud.google.com/)
2. 左上角點選「≡」> IAM 與管理 > 專案 > 建立新專案（可命名為 voting-system）
3. 選擇左邊「≡」> Compute Engine > VM 執行個體 > 建立執行個體
   - 區域：選 asia-east1-b（台灣）
   - 機器類型：e2-micro（免費）
   - 映像檔：Ubuntu 22.04
   - 外部 IP：選「保留靜態 IP」
   - 建立完成後點選 SSH 開啟終端機

---

### ✅ 2. 安裝 Node.js、MySQL、Nginx、Cloudflared

```bash
# 安裝 Node.js (建議版本 18 或以上)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 安裝 MySQL
sudo apt install -y mysql-server

# 安裝 Nginx
sudo apt install -y nginx

# 安裝 cloudflared
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb
```

---

### ✅ 3. Clone 你的專案並部署後端/前端

```bash
git clone git@github.com:che3000/voting-system.git
cd voting-system
npm install
cp .env.example .env
```

編輯 `.env` 並填入你的 MySQL 密碼與 JWT：

```env
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=你的密碼
DB_NAME=voting_db
JWT_SECRET=使用 openssl rand -hex 32 產生
```

匯入資料庫：

```bash
mysql -u root -p
CREATE DATABASE voting_db;
exit

mysql -u root -p voting_db < sql.sql
```

建置前端：

```bash
cd client
npm install
npm run build
```

---

### ✅ 4. 設定 Nginx 並確認 localhost 可以正確顯示前端

建立設定檔 `/etc/nginx/sites-available/voting-system`：

```nginx
server {
    listen 8080;
    server_name <你的網域> www.<你的網域>;

    root /home/wirghthuang/voting-system/client/build;
    index index.html;

    include mime.types;
    default_type application/octet-stream;

    location ~* \.(js|css|json|ico|png|jpg|svg|woff2?)$ {
        try_files $uri =404;
        access_log off;
        add_header Access-Control-Allow-Origin *;
        expires 1y;
    }

    location / {
        try_files $uri /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    error_page 403 404 /index.html;
    error_page 502 503 504 /50x.html;
    location = /50x.html {
        root /usr/share/nginx/html;
    }
}
```

啟用設定：

```bash
sudo ln -s /etc/nginx/sites-available/voting-system /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

在瀏覽器訪問 http://<你的 VM IP>，應可看到前端畫面。

---

### ✅ 5. 建立 Cloudflare Tunnel（登入、建立、設定）

```bash
cloudflared tunnel login
cloudflared tunnel create voting-tunnel
cloudflared tunnel route dns voting-tunnel <你的網域>
```

設定 `/etc/cloudflared/config.yml`：

```yaml
tunnel: <你的 tunnel id>
credentials-file: /<你在VM中的username>/.cloudflared/<你的 tunnel id>.json

ingress:
  - hostname: <你的網域>
    service: http://localhost:8080
  - service: http_status:404
```

啟用服務：

```bash
cloudflared service install
sudo systemctl restart cloudflared
```

---

### ✅ 6. Cloudflare DNS 記錄設定

1. 打開cloudflare儀錶板
2. 選取左方 DNS > 紀錄
3. 新增紀錄
   - 類型：CNAME
   - 名稱：@
   - 目標：<你的 tunnel id>.cfargotunnel.com
   - Proxy 狀態：True

---

### ✅ 7. 測試 Tunnel + Cloudflare DNS 正常運作

打開瀏覽器進入 https://<你的網域>
應該會正確跳轉並看到前端介面（如登入畫面）

---

### ✅ 8. 移除 GCP 公網 port，僅由 Cloudflare 控管

打開 GCP > VPC 網路 > 防火牆規則  
刪除以下規則（如存在）：
- default-allow-http
- default-allow-https
- default-allow-ssh

Cloudflare Tunnel 現在會取代開放 port 功能。

---

## 自動啟動 Voting System 服務

建議使用 `pm2` 管理後端程式（開機自啟 + crash 復原）：

```bash
cd ~/voting-system
sudo npm install -g pm2
pm2 start server.js --name voting-system
pm2 save
pm2 startup
```

依照畫面指示貼上 sudo 的指令以啟用 systemd，此行為關鍵。

---

## 開發者補充

- 後端環境變數建議以 `.env` 管理
- 預設管理員帳號請自行從資料庫 `users` 表中查詢

## License

This project is licensed under the GNU General Public License v3.0 - see the [LICENSE](./LICENSE) file for details.