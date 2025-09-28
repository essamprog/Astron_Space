document.addEventListener('DOMContentLoaded', async () => {
    // 1. احصل على الـ ID من رابط الصفحة
    const params = new URLSearchParams(window.location.search);
    const researchId = parseInt(params.get('id'));

    // عرض رسالة خطأ إذا لم يوجد ID
    if (!researchId) {
        document.getElementById('research-title').textContent = 'Error: Research ID not found.';
        document.getElementById('research-abstract').textContent = 'Please return to the search page and select a research paper.';
        return;
    }

    try {
        // 2. قم بجلب جميع بيانات الأبحاث من ملف data.json
        const response = await fetch('data.json');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const allData = await response.json();

        // 3. ابحث عن البحث الذي يتطابق مع الـ ID
        const researchData = allData.find(item => item.Id === researchId);

        if (researchData) {
            // 4. إذا تم العثور على البحث، قم بعرض بياناته في الصفحة
            document.getElementById('research-title').textContent = researchData.Title;
            document.getElementById('research-field').textContent = `Research Field: ${researchData.Field_Auto || 'N/A'}`;

            const abstractEl = document.getElementById('research-abstract');
            abstractEl.textContent = researchData.Abstract || 'No abstract available for this entry.';
            if (!researchData.Abstract) abstractEl.parentElement.style.display = 'none';

            const resultsEl = document.getElementById('research-results');
            resultsEl.textContent = researchData.Results || 'No results available for this entry.';
            if (!researchData.Results || researchData.Results === 'Not Found') resultsEl.parentElement.style.display = 'none';

            const conclusionEl = document.getElementById('research-conclusion');
            conclusionEl.textContent = researchData.Conclusion || 'No conclusion available for this entry.';
            if (!researchData.Conclusion || researchData.Conclusion === 'Not Found') conclusionEl.parentElement.style.display = 'none';

            // ✨ تحديث رابط الزر العلوي فقط ✨
            const originalLinkSidebar = document.getElementById('original-link-sidebar');
            originalLinkSidebar.href = researchData.Link;
            if (!researchData.Link) originalLinkSidebar.style.display = 'none'; // إخفاء الزر إذا لم يكن هناك رابط

            document.title = researchData.Title;

        } else {
            document.getElementById('research-title').textContent = 'Research Not Found';
            document.getElementById('research-abstract').textContent = `Could not find data for the research with ID: ${researchId}.`;
        }

    } catch (error) {
        console.error('Failed to load research data:', error);
        document.getElementById('research-title').textContent = 'Error Loading Data';
        document.getElementById('research-abstract').textContent = 'There was a problem fetching the research data. Please try again later.';
    }
});