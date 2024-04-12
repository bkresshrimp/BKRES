const mongoose = require('mongoose');

const dataSchema = new mongoose.Schema({
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
        data: {
            type: Number,
            required: true,
        },
        time: {
            type: Date,
            default: Date.now,
        },
    },
    isProcess: {
        type: Boolean,
        required: true,
    },
    alert_message: {
        type: String,
    }
});

module.exports = mongoose.model('Data', dataSchema);
