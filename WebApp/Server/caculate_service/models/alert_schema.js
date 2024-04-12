const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
    gateway_API: {
        type: String,
        required: true,
    },
    device_API: {
        type: String,
        required: true,
    },
    sensor_API: {
        type: String,
        required: true,
    },
    data: {
        type: Number,
        required: true,
    },
    alert_message: {
        type: String,
        required: true,
    },
    time: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Alert', alertSchema);
