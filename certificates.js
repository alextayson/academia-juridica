import { auth, certificateAPI } from './supabase-client.js';
import { certificateAPI as certAPI } from './features-api.js';

let currentUser = null;
let certificates = [];

async function init() {
    currentUser = await auth.getUser();

    if (!currentUser) {
        window.location.href = 'login.html';
        return;
    }

    document.getElementById('userMenu').style.display = 'flex';
    document.getElementById('userName').textContent = currentUser.email.split('@')[0];

    await loadCertificates();
    setupEventListeners();
}

async function loadCertificates() {
    const { data, error } = await certAPI.getUserCertificates();

    if (error) {
        console.error('Error loading certificates:', error);
        return;
    }

    certificates = data || [];
    renderCertificates();
}

function renderCertificates() {
    const grid = document.getElementById('certificatesGrid');

    if (certificates.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px;">
                <div style="font-size: 64px; margin-bottom: 16px;">🎓</div>
                <h3>Nenhum certificado ainda</h3>
                <p style="color: #666;">Complete um curso para receber seu certificado</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = certificates.map(cert => `
        <div class="certificate-card">
            <div class="certificate-preview">
                <div class="certificate-icon">🏆</div>
                <h3>${cert.course.title}</h3>
            </div>
            <div class="certificate-info">
                <div class="certificate-title">Certificado de Conclusão</div>
                <div class="certificate-meta">
                    Emitido em ${formatDate(cert.issued_at)}<br>
                    Instrutor: ${cert.course.instructor?.full_name || 'N/A'}
                </div>
                <div class="certificate-number">
                    ${cert.certificate_number}
                </div>
                <div class="certificate-actions">
                    <button class="btn-download" onclick="downloadCertificate('${cert.id}')">
                        📥 Download
                    </button>
                    <button class="btn-verify" onclick="copyCertificateCode('${cert.verification_code}')">
                        🔗 Copiar Código
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

window.downloadCertificate = async function(certId) {
    const cert = certificates.find(c => c.id === certId);
    if (!cert) return;

    // Generate PDF (would use a PDF library in production)
    alert('Download do certificado: ' + cert.certificate_number);
    // In production: window.open(cert.pdf_url);
};

window.copyCertificateCode = function(code) {
    navigator.clipboard.writeText(code);
    alert('Código copiado: ' + code);
};

window.verifyCertificate = async function() {
    const code = document.getElementById('verifyCode').value.trim();
    const resultDiv = document.getElementById('verifyResult');

    if (!code) {
        resultDiv.innerHTML = '<div class="verify-result invalid">Digite um código de verificação</div>';
        return;
    }

    const { data, error } = await certAPI.verifyCertificate(code);

    if (error || !data) {
        resultDiv.innerHTML = `
            <div class="verify-result invalid">
                <strong>❌ Certificado não encontrado</strong><br>
                Código inválido ou certificado não existe
            </div>
        `;
        return;
    }

    resultDiv.innerHTML = `
        <div class="verify-result valid">
            <strong>✅ Certificado Válido</strong><br>
            <strong>Aluno:</strong> ${data.user.full_name}<br>
            <strong>Curso:</strong> ${data.course.title}<br>
            <strong>Emitido em:</strong> ${formatDate(data.issued_at)}<br>
            <strong>Número:</strong> ${data.certificate_number}
        </div>
    `;
};

function setupEventListeners() {
    document.getElementById('logoutBtn')?.addEventListener('click', async () => {
        await auth.signOut();
        window.location.href = 'index.html';
    });

    document.getElementById('verifyCode')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            verifyCertificate();
        }
    });
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });
}

init();
