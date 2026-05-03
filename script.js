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

// Simular progresso dos cursos
const progressCards = document.querySelectorAll('.course-card.progress');
progressCards.forEach(card => {
    card.addEventListener('click', () => {
        window.location.href = 'curso-player.html';
    });
});

// Animação de hover nos cards
const cards = document.querySelectorAll('.course-card, .category-card');
cards.forEach(card => {
    card.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-4px)';
    });

    card.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0)';
    });
});

// Filtro por categoria (simulado)
const categoryCards = document.querySelectorAll('.category-card');
categoryCards.forEach(card => {
    card.addEventListener('click', function() {
        const category = this.querySelector('.category-title').textContent;
        console.log(`Filtrar por: ${category}`);
        // Aqui você implementaria o filtro real
    });
});

// Botões de ação dos cursos
const actionButtons = document.querySelectorAll('.course-action');
actionButtons.forEach(button => {
    button.addEventListener('click', function(e) {
        e.stopPropagation();
        const courseTitle = this.closest('.course-card').querySelector('.course-title').textContent;
        console.log(`Iniciar curso: ${courseTitle}`);
        // Aqui você redirecionaria para a página do curso
    });
});
