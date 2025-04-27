/**
 * FAQ交互模块
 * 
 * 本文件负责处理常见问题(FAQ)部分的交互功能
 */

// 初始化FAQ交互
function initFaqInteraction() {
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const button = item.querySelector('button');
        const content = item.querySelector('.faq-content');
        
        button.addEventListener('click', () => {
            const isOpen = button.getAttribute('aria-expanded') === 'true';
            
            button.setAttribute('aria-expanded', !isOpen);
            content.classList.toggle('hidden', isOpen);
            
            const icon = button.querySelector('svg');
            icon.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(180deg)';
        });
    });
}

// 导出模块函数
window.FaqModule = {
    init: initFaqInteraction
}; 