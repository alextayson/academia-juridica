// Initialize app
let currentFilter = { category: null, level: null, search: '' };
let currentSort = 'popular';

async function init() {
    await DataManager.init();
    renderCategories();
    renderCourses();
    setupEventListeners();
}

// Render categories
function renderCategories() {
    const grid = document.querySelector('.category-grid');
    if (!grid) return;

    grid.innerHTML = DataManager.categories.map(cat => `
        <div class="category-card" data-category="${cat.id}">
            <div class="category-icon">${cat.icon}</div>
            <h3 class="category-title">${cat.name}</h3>
            <p class="category-count">${cat.count} cursos</p>
        </div>
    `).join('');
}

// Render courses
function renderCourses() {
    let courses = DataManager.courses;

    // Apply filters
    if (currentFilter.category) {
        courses = DataManager.filterByCategory(currentFilter.category);
    }
    if (currentFilter.level) {
        courses = DataManager.filterByLevel(currentFilter.level);
    }
    if (currentFilter.search) {
        courses = DataManager.searchCourses(currentFilter.search);
    }

    // Apply sort
    courses = DataManager.sortCourses(courses, currentSort);

    // Render in progress
    renderInProgress(courses.filter(c => c.progress > 0));

    // Render all courses
    renderAllCourses(courses);
}

// Render in progress section
function renderInProgress(courses) {
    const section = document.querySelector('.section');
    const grid = section?.querySelector('.course-grid');
    if (!grid) return;

    if (courses.length === 0) {
        section.style.display = 'none';
        return;
    }

    section.style.display = 'block';
    grid.innerHTML = courses.map(course => `
        <div class="course-card progress" data-course-id="${course.id}">
            <div class="course-thumbnail">
                <div class="course-badge">Em andamento</div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${course.progress}%"></div>
                </div>
            </div>
            <div class="course-info">
                <h3 class="course-title">${course.title}</h3>
                <p class="course-meta">Módulo ${course.currentModule} de ${course.modules} • ${course.progress}% concluído</p>
                <p class="course-description">${course.description}</p>
            </div>
        </div>
    `).join('');
}

// Render all courses
function renderAllCourses(courses) {
    const sections = document.querySelectorAll('.section');
    const lastSection = sections[sections.length - 1];
    const grid = lastSection?.querySelector('.course-grid');
    if (!grid) return;

    grid.innerHTML = courses.map(course => {
        const badgeHtml = course.badge && course.badge !== 'progress'
            ? `<div class="course-badge ${course.badge}">${course.badge === 'new' ? 'Novo' : 'Popular'}</div>`
            : '';

        return `
            <div class="course-card" data-course-id="${course.id}">
                <div class="course-thumbnail">
                    ${badgeHtml}
                </div>
                <div class="course-info">
                    <h3 class="course-title">${course.title}</h3>
                    <p class="course-meta">${course.modules} módulos • ${course.duration} de conteúdo</p>
                    <p class="course-description">${course.description}</p>
                    <div class="course-footer">
                        <span class="course-level">${getLevelLabel(course.level)}</span>
                        <button class="course-action">Iniciar</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function getLevelLabel(level) {
    const labels = {
        'basico': 'Básico',
        'intermediario': 'Intermediário',
        'avancado': 'Avançado'
    };
    return labels[level] || level;
}

// Setup event listeners
function setupEventListeners() {
    // Search
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.querySelector('.search-btn');

    searchInput?.addEventListener('input', (e) => {
        currentFilter.search = e.target.value;
        renderCourses();
    });

    searchBtn?.addEventListener('click', () => {
        renderCourses();
    });

    searchInput?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            renderCourses();
        }
    });

    // Smooth scroll
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    // Category filter
    document.addEventListener('click', (e) => {
        const categoryCard = e.target.closest('.category-card');
        if (categoryCard) {
            const categoryId = categoryCard.dataset.category;
            currentFilter.category = currentFilter.category === categoryId ? null : categoryId;
            renderCourses();
        }
    });

    // Course click
    document.addEventListener('click', (e) => {
        const courseCard = e.target.closest('.course-card');
        const actionBtn = e.target.closest('.course-action');

        if (actionBtn) {
            e.stopPropagation();
            const courseId = actionBtn.closest('.course-card').dataset.courseId;
            window.location.href = `curso-player.html?course=${courseId}`;
        } else if (courseCard) {
            const courseId = courseCard.dataset.courseId;
            window.location.href = `curso-player.html?course=${courseId}`;
        }
    });

    // Hover animation
    document.addEventListener('mouseenter', (e) => {
        const card = e.target.closest('.course-card, .category-card');
        if (card) card.style.transform = 'translateY(-4px)';
    }, true);

    document.addEventListener('mouseleave', (e) => {
        const card = e.target.closest('.course-card, .category-card');
        if (card) card.style.transform = 'translateY(0)';
    }, true);
}

// Start app
init();
