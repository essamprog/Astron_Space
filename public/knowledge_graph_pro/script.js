document.addEventListener('DOMContentLoaded', async function () {
    const container = document.getElementById('knowledge-graph');
    const sidebar = document.getElementById('sidebar');
    const closeBtn = document.getElementById('close-sidebar');
    const sidebarTitle = document.getElementById('sidebar-title');
    const paperList = document.getElementById('paper-list');

    // --- SIDENAV JAVASCRIPT ---
    const openNavBtn = document.getElementById('openNavBtn');
    const closeNavBtn = document.getElementById('closeNavBtn');
    const sidenav = document.getElementById('mySidenav');

    openNavBtn.addEventListener('click', () => {
        sidenav.classList.add('open');
    });

    closeNavBtn.addEventListener('click', () => {
        sidenav.classList.remove('open');
    });

    async function initializeGraph() {
        try {
            let papersData, edgesData, selectedPapersData;
            try {
                // استخدام Promise.all لجلب الملفين في نفس الوقت لأداء أفضل
                const [papersResponse, edgesResponse, selectedPapersResponse] = await Promise.all([
                    fetch('data.json'),
                    fetch('edges.json'), // <-- جلب ملف الروابط الجديد
                    fetch('selected_papers.json') // <-- جلب ملف الأبحاث المختارة
                ]);

                if (!papersResponse.ok) throw new Error('Network response for data.json was not ok');
                if (!edgesResponse.ok) throw new Error('Network response for edges.json was not ok');
                if (!selectedPapersResponse.ok) throw new Error('Network response for selected_papers.json was not ok');

                papersData = await papersResponse.json();
                edgesData = await edgesResponse.json(); // <-- تخزين بيانات الروابط
                selectedPapersData = await selectedPapersResponse.json(); // <-- تخزين بيانات الأبحاث المختارة

            } catch (error) {
                console.warn('لم يتم العثور على ملفات JSON، تأكد من وجود data.json و edges.json');
                // يمكنك هنا إضافة بيانات تجريبية بديلة لو أردت
                return; // إيقاف التنفيذ إذا فشل جلب البيانات
            }

            const colorPalette = [
                { border: '#e83e8c', background: '#161b22' },
                { border: '#fd7e14', background: '#161b22' },
                { border: '#20c997', background: '#161b22' },
                { border: '#6f42c1', background: '#161b22' },
                { border: '#007bff', background: '#161b22' },
                { border: '#ffc107', background: '#161b22' }
            ];

            const nodesArray = [];
            const topicMap = new Map();

            // --- 1. إنشاء الدوائر (المجالات) ---
            papersData.forEach(paper => {
                const topicId = paper.Cluster;
                if (!topicMap.has(topicId)) {
                    topicMap.set(topicId, {
                        name: paper.Field_Auto,
                        papers: []
                    });

                    const chosenColor = colorPalette[topicId % colorPalette.length];



                    nodesArray.push({
                        id: topicId,
                        label: paper.Field_Auto,
                        shape: 'circle',
                        size: 50,
                        color: chosenColor,
                        font: { color: 'white', size: 16 }
                    });
                }

                topicMap.get(topicId).papers.push(paper);
            });

            // --- 2. إنشاء المربعات المؤقتة ---
            // يمكنك تطوير هذا الجزء لاحقًا ليقرأ الأبحاث كعقد أيضًا
            selectedPapersData.forEach(paper => {
                nodesArray.push({
                    id: 10000 + paper.Id, // إضافة 10000 لضمان عدم تضارب الـ IDs
                    label: paper.Title, // استخدام عنوان البحث كتسمية
                    shape: 'box',
                    color: { border: '#007bff', background: '#161b22' },
                    font: { color: 'white', size: 14 },
                    widthConstraint: 150,
                    heightConstraint: 50,
                    link: paper.Link // <-- إضافة الرابط كخاصية في العقدة
                });
            });


            // --- 4. إعدادات المخطط والفيزياء ---
            const data = {
                nodes: new vis.DataSet(nodesArray),
                edges: new vis.DataSet(edgesData), // <-- استخدام بيانات الروابط من الملف مباشرة
            };

            const options = {
                nodes: {
                    borderWidth: 2,
                    size: 40,
                    font: {
                        size: 14,
                        color: '#ffffff'
                    }
                },
                edges: {
                    color: '#30363d',
                    arrows: {
                        to: { enabled: false }
                    },
                    smooth: {
                        enabled: true,
                        type: 'dynamic'
                    }
                },
                physics: {
                    enabled: true,
                    solver: 'barnesHut',
                    barnesHut: {
                        gravitationalConstant: -10000,
                        springConstant: 0.04,
                        damping: 0.17,
                        springLength: 200,
                        avoidOverlap: 0.01
                    }
                },
                interaction: {
                    hover: true,
                    tooltipDelay: 200,
                },
                layout: {
                    randomSeed: 2
                }
            };

            const network = new vis.Network(container, data, options);

            // ... هذا الجزء يبقى كما هو بدون تغيير ...
            network.on('click', function (params) {
                if (params.nodes.length > 0) {
                    const nodeId = params.nodes[0];
                    const node = data.nodes.get(nodeId);

                    if (node.shape === 'circle' && topicMap.has(nodeId)) {
                        const topicData = topicMap.get(nodeId);
                        sidebarTitle.innerHTML = `Related research: "<span style="color: #20c997;">${topicData.name}</span>"`;

                        paperList.innerHTML = '';
                        topicData.papers.forEach((paper, index) => {
                            const li = document.createElement('li');
                            const a = document.createElement('a');
                            a.href = paper.Link;
                            a.target = '_blank';
                            a.textContent = paper.Title;
                            a.title = `ID: ${paper.Id} | انقر لفتح البحث`;
                            li.appendChild(a);
                            paperList.appendChild(li);

                            setTimeout(() => {
                                li.style.opacity = '1';
                                li.style.transform = 'translateX(0)';
                            }, index * 100);

                            li.style.opacity = '0';
                            li.style.transform = 'translateX(20px)';
                            li.style.transition = 'all 0.3s ease';
                        });

                        sidebar.classList.add('visible');
                    } else if (node.shape === 'box' && node.link) {

                        // عند النقر على الصندوق، افتح الرابط في نافذة جديدة
                        window.open(node.link, '_blank');
                    }
                } else {
                    sidebar.classList.remove('visible');
                }
            });

            network.on('hoverNode', function (params) {
                container.style.cursor = 'pointer';
            });

            network.on('blurNode', function (params) {
                container.style.cursor = 'default';
            });

        } catch (error) {
            console.error("فشل تحميل البيانات:", error);
            container.innerHTML = `
                <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; color: #f85149;">
                    <h3>⚠️ فشل في تحميل البيانات</h3>
                    <p>تأكد من صحة ملف data.json أو اتصال الإنترنت</p>
                </div>
            `;
        }
    }

    // إغلاق الشريط الجانبي
    closeBtn.addEventListener('click', () => {
        sidebar.classList.remove('visible');
    });

    // إغلاق بمفتاح Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            sidebar.classList.remove('visible');
        }
    });

    initializeGraph();
});