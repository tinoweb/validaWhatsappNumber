// Proteção adicional contra bots e scripts maliciosos
(function() {
    const securityToken = Math.random().toString(36).substring(7);
    localStorage.setItem('_secure_token', securityToken);

    // Verificar integridade da página
    function checkIntegrity() {
        const scripts = document.getElementsByTagName('script');
        const links = document.getElementsByTagName('link');
        const integrity = [...scripts, ...links].every(el => {
            return !el.src || 
                   el.src.startsWith('https://') || 
                   el.src.startsWith('http://localhost') ||
                   el.src.startsWith('file://');
        });
        return integrity;
    }

    // Monitorar mudanças na DOM
    function monitorDOMChanges() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                const nodes = [...mutation.addedNodes];
                nodes.forEach((node) => {
                    if (node.nodeName === 'SCRIPT' || node.nodeName === 'IFRAME') {
                        const src = node.src || '';
                        if (!src.startsWith('https://') && 
                            !src.startsWith('http://localhost') && 
                            !src.startsWith('file://')) {
                            node.remove();
                        }
                    }
                });
            });
        });

        observer.observe(document.documentElement, {
            childList: true,
            subtree: true
        });
    }

    // Anti-Debug (desativado em desenvolvimento)
    function antiDebug() {
        if (window.location.protocol !== 'file:') {
            const start = Date.now();
            debugger;
            const end = Date.now();
            
            if (end - start > 100) {
                window.location.reload();
            }
        }
    }

    // Proteção contra bots
    function antiBot() {
        // Desativado em desenvolvimento
        if (window.location.protocol === 'file:') return;

        const events = ['mousemove', 'keydown', 'scroll'];
        let isHuman = false;

        events.forEach(event => {
            window.addEventListener(event, () => {
                isHuman = true;
            }, { once: true });
        });

        setTimeout(() => {
            if (!isHuman) {
                document.body.innerHTML = '<h1>Acesso Negado</h1>';
            }
        }, 5000);
    }

    // Verificar ambiente de execução
    function checkEnvironment() {
        // Permitir DevTools em desenvolvimento
        if (window.location.protocol === 'file:') return true;

        if (window.Firebug && window.Firebug.chrome && window.Firebug.chrome.isInitialized) {
            return false;
        }
        
        if (window.outerWidth - window.innerWidth > 160 || window.outerHeight - window.innerHeight > 160) {
            return false;
        }

        return true;
    }

    // Inicializar proteções
    function initProtections() {
        // Em desenvolvimento, ser mais permissivo
        if (window.location.protocol === 'file:') {
            monitorDOMChanges();
            return;
        }

        if (!checkIntegrity() || !checkEnvironment()) {
            document.body.innerHTML = '<h1>Acesso Não Autorizado</h1>';
            return;
        }

        setInterval(antiDebug, 1000);
        monitorDOMChanges();
        antiBot();

        // Adicionar proteção contra print screen
        document.addEventListener('keyup', function(e) {
            if (e.key === 'PrintScreen') {
                navigator.clipboard.writeText('');
            }
        });

        // Desabilitar visualização da fonte da página
        document.addEventListener('keydown', function(e) {
            if (e.ctrlKey && e.key === 'u') {
                e.preventDefault();
                return false;
            }
        });
    }

    // Iniciar proteções
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initProtections);
    } else {
        initProtections();
    }
})();
