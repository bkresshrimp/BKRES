"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEmails = exports.testFptMailConnection = exports.FptMailService = void 0;
var fptMailService_1 = require("./fptMailService");
Object.defineProperty(exports, "FptMailService", { enumerable: true, get: function () { return fptMailService_1.FptMailService; } });
Object.defineProperty(exports, "testFptMailConnection", { enumerable: true, get: function () { return fptMailService_1.testFptMailConnection; } });
Object.defineProperty(exports, "getEmails", { enumerable: true, get: function () { return fptMailService_1.getEmails; } });
__exportStar(require("../interfaces"), exports);
//# sourceMappingURL=index.js.map