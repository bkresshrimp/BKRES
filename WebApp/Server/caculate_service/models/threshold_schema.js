const mongoose = require('mongoose');

const Schema = mongoose.Schema;

// Định nghĩa Schema
const ThresholdSchema = new Schema({
    gateway_API: {
        type: String,
        required: true
    },
    device_API: {
        type: String,
        required: true
    },
    sensor_API: {
        type: String,
        required: true
    },
    alert_threshold: {
        min: {
            type: Number,
            required: true
        },
        max: {
            type: Number,
            required: true
        }
    }
});

// Tạo model từ schema
const Threshold = mongoose.model('Threshold', ThresholdSchema);

module.exports = Threshold;
