document.addEventListener('DOMContentLoaded', function () {
    if (typeof Chart === 'undefined') return;

    const chartDataNode = document.getElementById('dashboard-chart-data');
    let dashboardChartData = {};
    if (chartDataNode) {
        try {
            dashboardChartData = JSON.parse(chartDataNode.textContent) || {};
        } catch (error) {
            dashboardChartData = {};
        }
    }

    const toSafePair = (raw) => {
        const arr = Array.isArray(raw) ? raw : [];
        const first = Number(arr[0]) || 0;
        const second = Number(arr[1]) || 0;
        return [Math.max(first, 0), Math.max(second, 0)];
    };

    const renderDoughnut = (canvas, payload, fallbackLabels, colors, options = {}) => {
        if (!canvas) return;

        const labels = Array.isArray(payload.labels) && payload.labels.length === 2 ? payload.labels : fallbackLabels;
        const dataPair = toSafePair(payload.data);
        const total = dataPair[0] + dataPair[1];
        const useEmptyFallback = total === 0;

        new Chart(canvas, {
            type: 'doughnut',
            data: {
                labels: useEmptyFallback ? ['Không có dữ liệu'] : labels,
                datasets: [{
                    data: useEmptyFallback ? [1] : dataPair,
                    backgroundColor: useEmptyFallback ? ['#e5e7eb'] : colors,
                    borderColor: '#ffffff',
                    borderWidth: 2,
                    hoverOffset: 4,
                }],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: options.cutout || '62%',
                plugins: {
                    legend: {
                        display: options.showLegend !== false,
                        position: 'top',
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                if (useEmptyFallback) return 'Không có dữ liệu';
                                const value = Number(context.parsed) || 0;
                                const percent = total > 0 ? Math.round((value / total) * 100) : 0;
                                return `${context.label}: ${value} (${percent}%)`;
                            },
                        },
                    },
                },
            },
        });
    };

    const booksStatusChart = document.getElementById('booksStatusChart');
    const readersChart = document.getElementById('readersChart');
    const overdueChart = document.getElementById('overdueChart');

    const booksStatus = dashboardChartData.books_status || {};
    renderDoughnut(
        booksStatusChart,
        booksStatus,
        ['Trong kho', 'Đang mượn'],
        ['#36a2eb', '#ff6384']
    );

    const readers = dashboardChartData.readers || {};
    const readerLabels = Array.isArray(readers.labels) && readers.labels.length === 2
        ? readers.labels
        : ['Đang hoạt động', 'Ngừng hoạt động'];
    const readerColors = ['#36a2eb', '#ff6384'];
    renderDoughnut(
        readersChart,
        { labels: readerLabels, data: readers.data || [0, 0] },
        ['Đang hoạt động', 'Ngừng hoạt động'],
        readerColors,
        { cutout: '66%' }
    );

    if (overdueChart) {
        const overdue = dashboardChartData.overdue || {};
        new Chart(overdueChart, {
            type: 'line',
            data: {
                labels: overdue.labels || ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'],
                datasets: [{
                    label: 'Phiếu quá hạn',
                    data: overdue.data || [0, 0, 0, 0, 0, 0, 0],
                    fill: false,
                }],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
            },
        });
    }
});