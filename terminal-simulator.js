// ============================================
// NetXpert AI - محاكي طرفية Linux
// يدعم أوامر شبكات شائعة بمخرجات محاكاة واقعية
// ============================================

const commandHistory = [];
let historyIndex = -1;

function getTimestamp() {
    return new Date().toLocaleTimeString('en-GB');
}

function randomLatency() {
    return (Math.random() * 40 + 5).toFixed(1);
}

function fakePing(target) {
    if (!target) return 'الاستخدام: ping <address>';
    let output = `PING ${target} (${target}): 56 data bytes\n`;
    for (let i = 0; i < 4; i++) {
        output += `64 bytes from ${target}: icmp_seq=${i} ttl=117 time=${randomLatency()} ms\n`;
    }
    output += `\n--- ${target} ping statistics ---\n4 packets transmitted, 4 received, 0% packet loss`;
    return output;
}

function fakeIfconfig() {
    return `eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500
        inet 192.168.1.15  netmask 255.255.255.0  broadcast 192.168.1.255
        ether 08:00:27:4e:66:a1  txqueuelen 1000  (Ethernet)
        RX packets 8452  bytes 5834213 (5.5 MiB)
        TX packets 6210  bytes 1023983 (1000.0 KiB)

lo: flags=73<UP,LOOPBACK,RUNNING>  mtu 65536
        inet 127.0.0.1  netmask 255.0.0.0
        loop  txqueuelen 1000  (Local Loopback)`;
}

function fakeTraceroute(target) {
    if (!target) return 'الاستخدام: traceroute <address>';
    let output = `traceroute to ${target}, 30 hops max, 60 byte packets\n`;
    const hops = ['192.168.1.1', '10.0.0.1', '172.16.5.1', '203.0.113.1', target];
    hops.forEach((hop, i) => {
        output += ` ${i + 1}  ${hop}  ${randomLatency()} ms  ${randomLatency()} ms  ${randomLatency()} ms\n`;
    });
    return output.trim();
}

function fakeNetstat() {
    return `Active Internet connections
Proto  Local Address           Foreign Address         State
tcp    192.168.1.15:443        142.250.80.14:80        ESTABLISHED
tcp    192.168.1.15:22         10.0.0.5:51422          ESTABLISHED
udp    192.168.1.15:68         192.168.1.1:67          -`;
}

const COMMANDS = {
    help: () => `الأوامر المتاحة:
  ping <ip>        - إرسال حزم اختبار لعنوان معين
  ifconfig         - عرض إعدادات واجهات الشبكة
  traceroute <ip>  - تتبع مسار الحزم لوجهة معينة
  netstat          - عرض الاتصالات النشطة
  whoami           - عرض المستخدم الحالي
  date             - عرض التاريخ والوقت الحالي
  clear            - مسح الشاشة
  ls               - عرض الملفات (محاكاة)`,
    ping: (args) => fakePing(args[0]),
    ifconfig: () => fakeIfconfig(),
    traceroute: (args) => fakeTraceroute(args[0]),
    netstat: () => fakeNetstat(),
    whoami: () => 'user@netxpert',
    date: () => new Date().toString(),
    ls: () => 'Desktop  Documents  Downloads  netxpert-project  README.md',
    clear: () => '__CLEAR__'
};

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
