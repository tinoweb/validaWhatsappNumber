// Proteções de Segurança
(function() {
    // Prevenir DevTools
    document.addEventListener('keydown', function(e) {
        if ((e.ctrlKey && e.shiftKey && e.key === 'I') || // Ctrl+Shift+I
            (e.ctrlKey && e.shiftKey && e.key === 'J') || // Ctrl+Shift+J
            (e.ctrlKey && e.key === 'u') ||              // Ctrl+U
            (e.key === 'F12')) {                         // F12
            e.preventDefault();
        }
    });

    // Prevenir clique direito
    document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
    });

    // Adicionar marca d'água dinâmica
    function addDynamicWatermark() {
        const watermark = document.createElement('div');
        watermark.className = 'watermark';
        watermark.textContent = `Validador WhatsApp - ${new Date().toLocaleDateString()} - ${Math.random().toString(36).substring(7)}`;
        // document.body.appendChild(watermark);
    }

    // Verificar origem da requisição
    function checkOrigin() {
        // Durante desenvolvimento, permitir arquivo local
        if (window.location.protocol === 'file:') {
            return true;
        }
        
        const allowedDomains = [
            'localhost',
            '127.0.0.1',
            'seu-dominio.com'
        ];
        
        return allowedDomains.some(domain => 
            window.location.hostname === domain || 
            window.location.hostname.endsWith('.' + domain)
        );
    }

    // Verificar tentativas de iframe
    if (window.self !== window.top) {
        window.top.location.href = window.self.location.href;
    }

    // Inicializar proteções
    function initSecurity() {
        addDynamicWatermark();
        
        // Adicionar listener para detectar modificações no DOM
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'childList') {
                    // Verificar se elementos críticos foram modificados
                    const criticalElements = document.querySelectorAll('.critical-element');
                    criticalElements.forEach(el => {
                        if (el.getAttribute('data-original') !== el.innerHTML) {
                            el.innerHTML = el.getAttribute('data-original');
                        }
                    });
                }
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // Iniciar proteções quando o DOM estiver pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSecurity);
    } else {
        initSecurity();
    }
})();

// Código original do aplicativo
document.addEventListener('DOMContentLoaded', function() {
    const numberInput = document.getElementById('numberInput');
    const importExcelBtn = document.getElementById('importExcel');
    const validateBtn = document.getElementById('validateNumbers');
    const fileInput = document.getElementById('fileInput');
    const loadingSection = document.getElementById('loadingSection');
    const resultsSection = document.getElementById('resultsSection');
    const resultsTable = document.getElementById('resultsTable');
    const exportExcelBtn = document.getElementById('exportExcel');
    const progressBar = document.querySelector('.progress-bar');
    const statusText = document.getElementById('statusText');
    const premiumMessage = document.getElementById('premiumMessage');

    const FREE_LIMIT = 10;
    let validatedNumbers = [];

    // Função para formatar os números
    function formatPhoneNumbers(input) {
        // Remove espaços extras e caracteres especiais
        let cleanInput = input.replace(/\s+/g, '').replace(/[^\d,+]/g, '');
        
        // Se encontrar números separados por vírgula
        if (cleanInput.includes(',')) {
            return cleanInput.split(',')
                .map(num => num.trim())
                .filter(num => num.length >= 10);
        }

        // Se for uma string contínua de números começando com 55
        let numbers = [];
        let currentNumber = '';
        
        for (let i = 0; i < cleanInput.length; i++) {
            currentNumber += cleanInput[i];
            
            // Verifica se encontrou um número completo (começando com 55 e tendo 12-13 dígitos)
            if (currentNumber.startsWith('55') && (currentNumber.length === 12 || currentNumber.length === 13)) {
                numbers.push(currentNumber);
                currentNumber = '';
                
                // Se o próximo número começar com 55, começa a partir dele
                if (cleanInput.substring(i + 1).startsWith('55')) {
                    currentNumber = '';
                }
            }
        }

        return numbers.filter(num => num.length >= 10);
    }

    // Importar Excel
    importExcelBtn.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(e) {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, {type: 'array'});
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(firstSheet, {header: 1});
            
            const numbers = jsonData.flat().filter(cell => cell && !isNaN(cell.toString().replace(/\D/g, '')));
            numberInput.value = numbers.join('\n');
        };
        reader.readAsArrayBuffer(file);
    });

    // Validar números
    validateBtn.addEventListener('click', async function() {
        const inputText = numberInput.value;
        const formattedNumbers = formatPhoneNumbers(inputText);

        if (formattedNumbers.length === 0) {
            alert('Por favor, insira alguns números válidos para validar.');
            return;
        }

        // Limitar a 10 números na versão gratuita
        const numbersToValidate = formattedNumbers.slice(0, FREE_LIMIT);
        if (formattedNumbers.length > FREE_LIMIT) {
            premiumMessage.classList.remove('d-none');
        } else {
            premiumMessage.classList.add('d-none');
        }

        loadingSection.classList.remove('d-none');
        resultsSection.classList.add('d-none');
        validatedNumbers = [];
        resultsTable.innerHTML = '';

        for (let i = 0; i < numbersToValidate.length; i++) {
            const number = numbersToValidate[i];
            progressBar.style.width = `${((i + 1) / numbersToValidate.length) * 100}%`;
            statusText.textContent = `Validando número ${i + 1} de ${numbersToValidate.length}...`;

            try {
                const response = await fetch('https://apizap.tinowebservices.com/api.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: `phone=${number}`
                });

                const data = await response.json();
                
                if (data.accountType === 'business' || data.accountType === 'personal') {
                    validatedNumbers.push({
                        number: number,
                        name: data.name || 'Não disponível',
                        status: 'Válido'
                    });

                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>
                            ${data.profilePic ? 
                                `<img src="${data.profilePic}" alt="Foto de perfil" class="rounded-circle" style="width: 40px; height: 40px; object-fit: cover;">` : 
                                '<span class="text-muted">n/d</span>'}
                        </td>
                        <td>${number}</td>
                        <td>${data.name || 'Não disponível'}</td>
                        <td>${data.about ? new Date(data.about.split(' ')[1]).toLocaleDateString('pt-BR') : 'n/d'}</td>
                        <td><span class="badge bg-success">Válido (${data.accountType})</span></td>
                    `;
                    resultsTable.appendChild(row);
                }
            } catch (error) {
                console.error('Erro ao validar número:', error);
            }
        }

        loadingSection.classList.add('d-none');
        resultsSection.classList.remove('d-none');
    });

    // Exportar para Excel
    exportExcelBtn.addEventListener('click', function() {
        if (validatedNumbers.length === 0) {
            alert('Não há números válidos para exportar.');
            return;
        }

        const ws = XLSX.utils.json_to_sheet(validatedNumbers);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Números Válidos");
        
        XLSX.writeFile(wb, "numeros_validos_whatsapp.xlsx");
    });

    // Funções para o modal de doação
    window.showQRCode = function(value, pixCode) {
        const qrCodeArea = document.getElementById('qrCodeArea');
        const qrCodeImage = document.getElementById('qrCodeImage');
        const pixCodeInput = document.getElementById('pixCode');
        
        // Mostrar a área do QR Code
        qrCodeArea.classList.remove('d-none');
        
        // Atualizar a imagem do QR Code
        qrCodeImage.src = `img/qr${value}.png`;
        
        // Atualizar o código PIX
        pixCodeInput.value = pixCode;
        
        // Rolar até a área do QR Code
        qrCodeArea.scrollIntoView({ behavior: 'smooth' });
    };

    window.copyPixCode = function() {
        const pixCodeInput = document.getElementById('pixCode');
        pixCodeInput.select();
        document.execCommand('copy');
        
        // Feedback visual
        const copyButton = document.querySelector('#qrCodeArea button');
        const originalText = copyButton.innerHTML;
        copyButton.innerHTML = '<i class="bi bi-check"></i> Copiado!';
        setTimeout(() => {
            copyButton.innerHTML = originalText;
        }, 2000);
    };
});
