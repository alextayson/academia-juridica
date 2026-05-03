import { auth } from './supabase-client.js';
import { supabase } from './supabase-client.js';

let currentUser = null;
let stats = {};

async function init() {
    currentUser = await auth.getUser();

    if (!currentUser) {
        window.location.href = 'login.html';
        return;
    }

    // Check if user is admin
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', currentUser.id)
        .single();

    if (!profile || profile.role !== 'admin') {
        alert('Acesso negado. Apenas administradores.');
        window.location.href = 'index.html';
        return;
    }

    document.getElementById('userMenu').style.display = 'flex';
    document.getElementById('userName').textContent = currentUser.email.split('@')[0];

    await loadStats();
    setupEventListeners();
}

async function loadStats() {
    // Get total users
    const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

    // Get total courses
    const { count: coursesCount } = await supabase
        .from('courses')
        .select('*', { count: 'exact', head: true });

    // Get total enrollments
    const { count: enrollmentsCount } = await supabase
        .from('enrollments')
        .select('*', { count: 'exact', head: true });

    // Get total certificates
    const { count: certificatesCount } = await supabase
        .from('certificates')
        .select('*', { count: 'exact', head: true });

    stats = {
        users: usersCount || 0,
        courses: coursesCount || 0,
        enrollments: enrollmentsCount || 0,
        certificates: certificatesCount || 0
    };

    renderStats();
}

function renderStats() {
    document.getElementById('totalUsers').textContent = stats.users;
    document.getElementById('totalCourses').textContent = stats.courses;
    document.getElementById('totalEnrollments').textContent = stats.enrollments;
    document.getElementById('totalCertificates').textContent = stats.certificates;
}

window.switchSection = async function(section) {
    // Update nav buttons
    document.querySelectorAll('.admin-nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');

    // Update sections
    document.querySelectorAll('.admin-section').forEach(sec => {
        sec.classList.remove('active');
    });

    const sectionMap = {
        'overview': 'overviewSection',
        'courses': 'coursesSection',
        'users': 'usersSection',
        'enrollments': 'enrollmentsSection'
    };

    document.getElementById(sectionMap[section]).classList.add('active');

    // Load data for section
    if (section === 'courses') await loadCourses();
    if (section === 'users') await loadUsers();
    if (section === 'enrollments') await loadEnrollments();
};

async function loadCourses() {
    const { data, error } = await supabase
        .from('courses')
        .select(`
            *,
            instructor:profiles(full_name),
            enrollments(count)
        `)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error loading courses:', error);
        return;
    }

    renderCourses(data || []);
}

function renderCourses(courses) {
    const tbody = document.getElementById('coursesTableBody');

    if (courses.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6">Nenhum curso cadastrado</td></tr>';
        return;
    }

    tbody.innerHTML = courses.map(course => `
        <tr>
            <td><strong>${course.title}</strong></td>
            <td>${course.instructor?.full_name || 'N/A'}</td>
            <td><span class="badge badge-info">${getLevelLabel(course.level)}</span></td>
            <td>${course.enrollments?.[0]?.count || 0}</td>
            <td><span class="badge badge-success">${course.published ? 'Publicado' : 'Rascunho'}</span></td>
            <td>
                <button class="action-btn" onclick="editCourse('${course.id}')">✏️ Editar</button>
                <button class="action-btn" onclick="deleteCourse('${course.id}')">🗑️ Excluir</button>
            </td>
        </tr>
    `).join('');
}

async function loadUsers() {
    const { data, error } = await supabase
        .from('profiles')
        .select(`
            *,
            enrollments(count)
        `)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error loading users:', error);
        return;
    }

    renderUsers(data || []);
}

function renderUsers(users) {
    const tbody = document.getElementById('usersTableBody');

    if (users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6">Nenhum usuário cadastrado</td></tr>';
        return;
    }

    tbody.innerHTML = users.map(user => `
        <tr>
            <td><strong>${user.full_name || 'N/A'}</strong></td>
            <td>${user.email}</td>
            <td><span class="badge badge-${user.role === 'admin' ? 'warning' : 'info'}">${getRoleLabel(user.role)}</span></td>
            <td>${user.enrollments?.[0]?.count || 0}</td>
            <td>${formatDate(user.created_at)}</td>
            <td>
                <button class="action-btn" onclick="toggleUserRole('${user.id}', '${user.role}')">
                    ${user.role === 'admin' ? '👤 Tornar Aluno' : '⭐ Tornar Admin'}
                </button>
            </td>
        </tr>
    `).join('');
}

async function loadEnrollments() {
    const { data, error } = await supabase
        .from('enrollments')
        .select(`
            *,
            user:profiles(full_name, email),
            course:courses(title)
        `)
        .order('enrolled_at', { ascending: false })
        .limit(100);

    if (error) {
        console.error('Error loading enrollments:', error);
        return;
    }

    renderEnrollments(data || []);
}

function renderEnrollments(enrollments) {
    const tbody = document.getElementById('enrollmentsTableBody');

    if (enrollments.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5">Nenhuma matrícula</td></tr>';
        return;
    }

    tbody.innerHTML = enrollments.map(enrollment => `
        <tr>
            <td><strong>${enrollment.user?.full_name || 'N/A'}</strong><br>
                <small style="color: #999;">${enrollment.user?.email}</small>
            </td>
            <td>${enrollment.course?.title || 'N/A'}</td>
            <td>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <div style="flex: 1; background: #f0f0f0; height: 8px; border-radius: 4px; overflow: hidden;">
                        <div style="width: ${enrollment.progress_percent}%; background: #714cb6; height: 100%;"></div>
                    </div>
                    <span>${enrollment.progress_percent}%</span>
                </div>
            </td>
            <td>${formatDate(enrollment.enrolled_at)}</td>
            <td>${enrollment.last_accessed_at ? formatDate(enrollment.last_accessed_at) : 'Nunca'}</td>
        </tr>
    `).join('');
}

// Course Modal
window.openCourseModal = function() {
    document.getElementById('courseModal').classList.add('active');
};

window.closeCourseModal = function() {
    document.getElementById('courseModal').classList.remove('active');
    document.getElementById('courseForm').reset();
};

document.getElementById('courseForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const courseData = {
        title: document.getElementById('courseTitle').value,
        description: document.getElementById('courseDescription').value,
        level: document.getElementById('courseLevel').value,
        duration_minutes: parseInt(document.getElementById('courseDuration').value) || 0,
        instructor_id: currentUser.id,
        published: true
    };

    const { error } = await supabase
        .from('courses')
        .insert(courseData);

    if (error) {
        alert('Erro ao criar curso: ' + error.message);
        return;
    }

    closeCourseModal();
    await loadCourses();
    await loadStats();
});

window.deleteCourse = async function(courseId) {
    if (!confirm('Excluir este curso? Esta ação não pode ser desfeita.')) return;

    const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseId);

    if (error) {
        alert('Erro ao excluir curso: ' + error.message);
        return;
    }

    await loadCourses();
    await loadStats();
};

window.toggleUserRole = async function(userId, currentRole) {
    const newRole = currentRole === 'admin' ? 'student' : 'admin';

    const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

    if (error) {
        alert('Erro ao atualizar função: ' + error.message);
        return;
    }

    await loadUsers();
};

function setupEventListeners() {
    document.getElementById('logoutBtn')?.addEventListener('click', async () => {
        await auth.signOut();
        window.location.href = 'index.html';
    });
}

function getLevelLabel(level) {
    const labels = {
        'beginner': 'Básico',
        'intermediate': 'Intermediário',
        'advanced': 'Avançado'
    };
    return labels[level] || 'Básico';
}

function getRoleLabel(role) {
    const labels = {
        'admin': 'Administrador',
        'instructor': 'Instrutor',
        'student': 'Aluno'
    };
    return labels[role] || 'Aluno';
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

init();
