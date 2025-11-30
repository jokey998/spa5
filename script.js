document.addEventListener('DOMContentLoaded', () => {
    // 元素參照
    const scheduleTableBody = document.querySelector('#schedule-table tbody');
    const todayTitle = document.getElementById('today-title');
    const noScheduleMessage = document.getElementById('no-schedule-message');
    const scheduleTable = document.getElementById('schedule-table');
    const tabAll = document.getElementById('tab-all');
    const searchInput = document.getElementById('search-name');
    const filterDay = document.getElementById('filter-day');
    const filterTagsContainer = document.getElementById('filter-tags-container');

    // 全域變數
    let allGirlsData = [];
    let activeTags = []; // 已選取的標籤

    // 可用的標籤列表
    const availableTags = ["甜美", "可愛", "高挑", "長髮", "短髮", "大奶", "小隻馬", "氣質", "配合度高", "女友感", "服務好"];

    init();

    function init() {
        if (!scheduleTableBody) return;

        renderTagFilters();
        bindEvents();

        fetch('girls.json?v=' + new Date().getTime())
            .then(response => {
                if (!response.ok) throw new Error('Network response was not ok');
                return response.json();
            })
            .then(data => {
                allGirlsData = data;
                renderSchedule();          // 一進來就直接顯示「全部班表」
            })
            .catch(error => {
                console.error('Fetch error:', error);
                handleError();
            });
    }

    function bindEvents() {
        // 點「全部班表」時，順便重置篩選
        if (tabAll) {
            tabAll.addEventListener('click', () => {
                if (searchInput) searchInput.value = '';
                if (filterDay) filterDay.value = 'all';
                activeTags = [];
                document.querySelectorAll('.tag-filter.active')
                    .forEach(el => el.classList.remove('active'));
                renderSchedule();
            });
        }

        if (searchInput) searchInput.addEventListener('input', renderSchedule);
        if (filterDay) filterDay.addEventListener('change', renderSchedule);
    }

    function renderTagFilters() {
        if (!filterTagsContainer) return;

        filterTagsContainer.innerHTML = '';
        availableTags.forEach(tag => {
            const span = document.createElement('span');
            span.className = 'tag-filter';
            span.textContent = tag;
            span.onclick = () => {
                if (activeTags.includes(tag)) {
                    activeTags = activeTags.filter(t => t !== tag);
                    span.classList.remove('active');
                } else {
                    activeTags.push(tag);
                    span.classList.add('active');
                }
                renderSchedule();
            };
            filterTagsContainer.appendChild(span);
        });
    }

    function handleError() {
        if (todayTitle) {
            todayTitle.textContent = "⚠️ 無法載入班表";
            todayTitle.style.color = "#7f8c8d";
        }
        if (noScheduleMessage) {
            noScheduleMessage.textContent = "無法載入資料，請稍後再試或直接聯繫波波。";
            noScheduleMessage.classList.remove('hidden');
        }
        if (scheduleTable) scheduleTable.classList.add('hidden');
    }

    function renderSchedule() {
        if (!allGirlsData || allGirlsData.length === 0) return;

        const searchTerm = searchInput ? searchInput.value.trim().toLowerCase() : '';
        const selectedDay = filterDay ? filterDay.value : 'all';

        // 1. 篩選資料（只有「全部班表」邏輯）
        let filteredList = allGirlsData.filter(person => {
            let isMatch = true;

            // 星期篩選
            if (selectedDay !== 'all') {
                if (!person.schedule || !person.schedule[selectedDay]) isMatch = false;
            }

            // 名字搜尋
            if (searchTerm && !person.name.toLowerCase().includes(searchTerm)) {
                isMatch = false;
            }

            // 標籤篩選 (AND 邏輯)
            if (activeTags.length > 0) {
                const personTags = person.tags || [];
                const hasAllTags = activeTags.every(tag => personTags.includes(tag));
                if (!hasAllTags) isMatch = false;
            }

            return isMatch;
        });

        // 2. 更新標題
        if (todayTitle) {
            if (selectedDay === 'all') {
                todayTitle.textContent = "📋 全部美容師班表";
            } else {
                todayTitle.textContent = `📋 ${selectedDay} 有上班的美容師`;
            }
        }

        // 3. 渲染表格
        scheduleTableBody.innerHTML = '';

        if (filteredList.length === 0) {
            if (scheduleTable) scheduleTable.classList.add('hidden');
            if (noScheduleMessage) {
                noScheduleMessage.textContent = "沒有符合條件的美容師。";
                noScheduleMessage.classList.remove('hidden');
            }
            return;
        }

        if (scheduleTable) scheduleTable.classList.remove('hidden');
        if (noScheduleMessage) noScheduleMessage.classList.add('hidden');

        filteredList.forEach(person => {
            const tr = document.createElement('tr');
            const priceDisplay = person.price ? `$${person.price}` : "請詢問";

            // 決定顯示的時間內容
            let workTimeDisplay = '';
            if (selectedDay !== 'all') {
                workTimeDisplay = (person.schedule && person.schedule[selectedDay]) ? person.schedule[selectedDay] : '暫無班表';
            } else {
                if (person.schedule) {
                    const days = Object.keys(person.schedule).map(d => d.replace('星期', ''));
                    workTimeDisplay = days.length ? days.join(', ') : '暫無班表';
                } else {
                    workTimeDisplay = '暫無班表';
                }
            }

            // --- 1. 照片 ---
            const tdPhoto = document.createElement('td');
            const img = document.createElement('img');
            img.src = `${person.name}.jpg`;
            img.alt = person.name;
            img.className = 'beautician-img';
            img.onclick = function () { openModal(this.src); };
            img.onerror = function () {
                this.onerror = null;
                this.src = 'logo.jpg';
                this.onclick = null;
                this.style.cursor = 'default';
            };
            tdPhoto.appendChild(img);
            tr.appendChild(tdPhoto);

            // --- 2. 名字 & 標籤 ---
            const tdName = document.createElement('td');

            const nameLink = document.createElement('a');
            nameLink.href = `reviews.html?name=${encodeURIComponent(person.name)}`;
            nameLink.className = 'name-link';
            nameLink.style.textDecoration = 'none';

            nameLink.innerHTML = `
                <div style="display: flex; flex-direction: column; align-items: flex-start; gap: 5px;">
                    <span style="font-size: 1.3em; font-weight: bold; color: #2c3e50;">${person.name}</span>
                    <span style="font-size: 0.9em; color: white; background: #e91e63; padding: 4px 10px; border-radius: 15px; box-shadow: 0 2px 4px rgba(233, 30, 99, 0.3); display: inline-flex; align-items: center;">
                        👉 查看心得
                    </span>
                </div>
            `;
            tdName.appendChild(nameLink);

            if (person.tags && person.tags.length > 0) {
                const tagsDiv = document.createElement('div');
                tagsDiv.className = 'tags-display';
                tagsDiv.style.marginTop = '8px';
                person.tags.forEach(t => {
                    const tSpan = document.createElement('span');
                    tSpan.className = 'tag-badge';
                    tSpan.textContent = t;
                    tagsDiv.appendChild(tSpan);
                });
                tdName.appendChild(tagsDiv);
            }

            tr.appendChild(tdName);

            // --- 3. 時間 ---
            const tdTime = document.createElement('td');
            tdTime.textContent = workTimeDisplay;
            tr.appendChild(tdTime);

            // --- 4. 費用 ---
            const tdPrice = document.createElement('td');
            tdPrice.style.color = '#e74c3c';
            tdPrice.style.fontWeight = 'bold';
            tdPrice.textContent = priceDisplay;
            tr.appendChild(tdPrice);

            scheduleTableBody.appendChild(tr);
        });
    }
});
