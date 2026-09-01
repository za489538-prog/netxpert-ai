// ============================================
// NetXpert AI - محاكي طرفية Linux
// يدعم أوامر شبكات شائعة بمخرجات محاكاة واقعية
// ============================================

// أوامر التيرمنال ومخرجاتها منقولة لملف logic/terminal-logic.js
// (قابل للاختبار بـ Jest بمعزل عن الـ DOM)
import { COMMANDS } from "./logic/terminal-logic.js";

const commandHistory = [];
let historyIndex = -1;

function runCommand(rawInput) {
    const terminalWindow = document.getElementById('terminalWindow');
    const trimmed = rawInput.trim();

    // اطبع السطر المكتوب من المستخدم
    const inputLine = document.createElement('div');
    inputLine.className = 'terminal-line terminal-line-user';
    inputLine.textContent = `user@netxpert:~$ ${trimmed}`;
    terminalWindow.appendChild(inputLine);

    if (!trimmed) return;

    const [cmd, ...args] = trimmed.split(' ');
    const handler = COMMANDS[cmd.toLowerCase()];

    if (!handler) {
        const errorLine = document.createElement('div');
        errorLine.className = 'terminal-line terminal-line-error';
        errorLine.textContent = `bash: ${cmd}: command not found`;
        terminalWindow.appendChild(errorLine);
    } else {
        const output = handler(args);
        if (output === '__CLEAR__') {
            terminalWindow.innerHTML = '';
        } else {
            const outputLine = document.createElement('div');
            outputLine.className = 'terminal-line terminal-line-output';
            outputLine.textContent = output;
            terminalWindow.appendChild(outputLine);
        }
    }

    terminalWindow.scrollTop = terminalWindow.scrollHeight;
}

document.addEventListener('DOMContentLoaded', () => {
    const terminalInput = document.getElementById('terminalInput');
    const terminalWindow = document.getElementById('terminalWindow');

    if (!terminalInput) return;

    terminalInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const value = terminalInput.value;
            runCommand(value);
            if (value.trim()) {
                commandHistory.push(value);
                historyIndex = commandHistory.length;
            }
            terminalInput.value = '';
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (historyIndex > 0) {
                historyIndex--;
                terminalInput.value = commandHistory[historyIndex] || '';
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (historyIndex < commandHistory.length - 1) {
                historyIndex++;
                terminalInput.value = commandHistory[historyIndex] || '';
            } else {
                historyIndex = commandHistory.length;
                terminalInput.value = '';
            }
        }
    });

    // ركّز على خانة الإدخال لما يضغط المستخدم بأي مكان بالتيرمنال
    terminalWindow.addEventListener('click', () => terminalInput.focus());
});
