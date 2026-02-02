const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000; // 使用新端口避免衝突

// 設置靜態文件目錄
app.use(express.static(path.join(__dirname)));

// 路由根路徑到 index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 處理其他靜態資源請求
app.use((req, res, next) => {
    if (!req.path.startsWith('/css/') && !req.path.startsWith('/js/') && !req.path.startsWith('/assets/')) {
        res.sendFile(path.join(__dirname, 'index.html'));
    } else {
        next();
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`TODO LIST 應用正在運行在端口 ${PORT}`);
    console.log(`訪問地址: https://glorious-computing-machine-6q74jgwgwp5h576w-18789.app.github.dev:${PORT}/`);
});