document.addEventListener('DOMContentLoaded', function () {
    if (typeof Chart === 'undefined') return;

    const booksStatusChart = document.getElementById('booksStatusChart');
    const readersChart = document.getElementById('readersChart');
    const overdueChart = document.getElementById('overdueChart');

    if (booksStatusChart) {
        new Chart(booksStatusChart, {
            type: 'doughnut',
            data: {
                labels: ['Trong kho', 'Đang mượn'],
                datasets: [{
                    data: [49, 12]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }

    if (readersChart) {
        new Chart(readersChart, {
            type: 'doughnut',
            data: {
                labels: ['Đang hoạt động', 'Không hoạt động'],
                datasets: [{
                    data: [4, 0]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '70%'
            }
        });
    }

    if (overdueChart) {
        new Chart(overdueChart, {
            type: 'line',
            data: {
                labels: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'],
                datasets: [{
                    label: 'Phiếu quá hạn',
                    data: [0, 1, 1, 2, 1, 1, 1],
                    fill: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }
});