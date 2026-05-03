import { auth, supabase } from './supabase-client.js';

// ==================== FORM VALIDATION ====================

const validators = {
    email: (value) => {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!value) return 'Email é obrigatório';
        if (!regex.test(value)) return 'Email inválido';
        return null;
    },

    password: (value) => {
        if (!value) return 'Senha é obrigatória';
        if (value.length < 6) return 'Senha deve ter no mínimo 6 caracteres';
        return null;
    },

    name: (value) => {
        if (!value) return 'Nome é obrigatório';
        if (value.length < 3) return 'Nome deve ter no mínimo 3 caracteres';
        return null;
    }
};

function validateField(input, validatorName) {
    const value = input.value.trim();
    const error = validators[validatorName](value);
    const errorEl = document.getElementById(input.id + 'Error');

    if (error) {
        input.classList.add('error');
        input.classList.remove('success');
        errorEl.textContent = error;
        errorEl.classList.add('show');
        return false;
    } else {
        input.classList.remove('error');
        input.classList.add('success');
        errorEl.classList.remove('show');
        return true;
    }
}

// ==================== PASSWORD STRENGTH ====================

function checkPasswordStrength(password) {
    let strength = 0;

    if (password.length >= 6) strength++;
    if (password.length >= 10) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    return strength;
}

function updatePasswordStrength(password) {
    const strengthBar = document.querySelector('.password-strength-bar');
    const strengthContainer = document.getElementById('passwordStrength');

    if (!password) {
        strengthContainer.classList.remove('show');
        return;
    }

    strengthContainer.classList.add('show');
    const strength = checkPasswordStrength(password);

    strengthBar.classList.remove('weak', 'medium', 'strong');

    if (strength <= 2) {
        strengthBar.classList.add('weak');
    } else if (strength <= 4) {
        strengthBar.classList.add('medium');
    } else {
        strengthBar.classList.add('strong');
    }
}

// ==================== TAB SWITCHING ====================

const tabs = document.querySelectorAll('.auth-tab');
const forms = document.querySelectorAll('.auth-form');

tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        const tabName = tab.dataset.tab;

        tabs.forEach(t => t.classList.remove('active'));
        forms.forEach(f => f.classList.remove('active'));

        tab.classList.add('active');
        document.getElementById(`${tabName}Form`).classList.add('active');

        clearErrors();
    });
});

// ==================== REAL-TIME VALIDATION ====================

// Login form validation
const loginEmail = document.getElementById('loginEmail');
const loginPassword = document.getElementById('loginPassword');

loginEmail.addEventListener('blur', () => validateField(loginEmail, 'email'));
loginPassword.addEventListener('blur', () => validateField(loginPassword, 'password'));

// Signup form validation
const signupName = document.getElementById('signupName');
const signupEmail = document.getElementById('signupEmail');
const signupPassword = document.getElementById('signupPassword');

signupName.addEventListener('blur', () => validateField(signupName, 'name'));
signupEmail.addEventListener('blur', () => validateField(signupEmail, 'email'));
signupPassword.addEventListener('blur', () => validateField(signupPassword, 'password'));

// Password strength indicator
signupPassword.addEventListener('input', (e) => {
    updatePasswordStrength(e.target.value);
});

// ==================== LOGIN FORM ====================

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = loginEmail.value.trim();
    const password = loginPassword.value;

    // Validate
    const emailValid = validateField(loginEmail, 'email');
    const passwordValid = validateField(loginPassword, 'password');

    if (!emailValid || !passwordValid) return;

    clearErrors();
    showLoading(true);

    const { data, error } = await auth.signIn(email, password);

    showLoading(false);

    if (error) {
        if (error.message.includes('Invalid login credentials')) {
            showError('loginPasswordError', 'Email ou senha incorretos');
        } else {
            showError('loginPasswordError', error.message);
        }
    } else {
        window.location.href = 'index.html';
    }
});

// ==================== SIGNUP FORM ====================

document.getElementById('signupForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = signupName.value.trim();
    const email = signupEmail.value.trim();
    const password = signupPassword.value;

    // Validate all fields
    const nameValid = validateField(signupName, 'name');
    const emailValid = validateField(signupEmail, 'email');
    const passwordValid = validateField(signupPassword, 'password');

    if (!nameValid || !emailValid || !passwordValid) return;

    clearErrors();
    showLoading(true);

    const { data, error } = await auth.signUp(email, password, name);

    showLoading(false);

    if (error) {
        if (error.message.includes('already registered')) {
            showError('signupEmailError', 'Este email já está cadastrado');
        } else {
            showError('signupEmailError', error.message);
        }
    } else {
        alert('✅ Conta criada com sucesso! Verifique seu email para confirmar.');

        // Clear form
        signupName.value = '';
        signupEmail.value = '';
        signupPassword.value = '';

        // Switch to login tab
        tabs[0].click();
    }
});

// ==================== GOOGLE OAUTH ====================

document.getElementById('googleLoginBtn').addEventListener('click', async () => {
    showLoading(true);
    const { error } = await auth.signInWithGoogle();
    if (error) {
        showLoading(false);
        showError('loginPasswordError', 'Erro ao fazer login com Google');
    }
});

document.getElementById('googleSignupBtn').addEventListener('click', async () => {
    showLoading(true);
    const { error } = await auth.signInWithGoogle();
    if (error) {
        showLoading(false);
        showError('signupEmailError', 'Erro ao fazer login com Google');
    }
});

// ==================== FORGOT PASSWORD ====================

document.getElementById('forgotPasswordLink').addEventListener('click', async (e) => {
    e.preventDefault();

    const email = loginEmail.value.trim();

    if (!email) {
        showError('loginEmailError', 'Digite seu email primeiro');
        return;
    }

    if (!validators.email(email)) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + '/reset-password.html'
        });

        if (error) {
            showError('loginEmailError', 'Erro ao enviar email de recuperação');
        } else {
            alert('✅ Email de recuperação enviado! Verifique sua caixa de entrada.');
        }
    } else {
        showError('loginEmailError', 'Digite um email válido');
    }
});

// ==================== HELPER FUNCTIONS ====================

function showError(elementId, message) {
    const errorEl = document.getElementById(elementId);
    errorEl.textContent = message;
    errorEl.classList.add('show');
}

function clearErrors() {
    document.querySelectorAll('.form-error').forEach(el => {
        el.classList.remove('show');
        el.textContent = '';
    });

    document.querySelectorAll('.form-input').forEach(input => {
        input.classList.remove('error', 'success');
    });
}

function showLoading(show) {
    const loading = document.getElementById('loading');
    const authForms = document.querySelectorAll('.auth-form');

    if (show) {
        loading.classList.add('show');
        authForms.forEach(f => f.style.display = 'none');
    } else {
        loading.classList.remove('show');
        authForms.forEach(f => f.style.display = '');
    }
}

// ==================== AUTO-REDIRECT IF LOGGED IN ====================

(async () => {
    const user = await auth.getUser();
    if (user) {
        window.location.href = 'index.html';
    }
})();
