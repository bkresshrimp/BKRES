const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const thresholdRouter = require('./control/threshold_router');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(bodyParser.json());

// Kết nối với cơ sở dữ liệu MongoDB
mongoose.connect('mongodb://admin:abc123@sanslab.viewdns.net:27017/bkres', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Kết nối thành công đến cơ sở dữ liệu'))
    .catch(err => console.error('Lỗi kết nối đến cơ sở dữ liệu:', err));

// Sử dụng router threshold
app.use(thresholdRouter);

// Server lắng nghe cổng
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
