"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const app = (0, express_1.default)();
const port = 3001;
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
