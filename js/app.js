/**
 * Football Bros 主应用模块
 *
 * 本文件负责初始化和协调网站的所有功能模块
 */

// 确保默认语言为英文
(function () {
  try {
    // 检查是否首次访问网站
    if (!localStorage.getItem("app_visited")) {
      console.log("应用初始化: 首次访问，设置默认语言为英文");
      localStorage.setItem("app_visited", "true");

      // 如果未设置语言，则设置为英文
      if (!localStorage.getItem("i18nextLng")) {
        localStorage.setItem("i18nextLng", "en");
        // 设置cookie作为备份
        document.cookie = "i18next=en;path=/;max-age=31536000";

        // 如果i18next已初始化，尝试切换语言
        if (typeof i18next !== "undefined" && i18next.isInitialized) {
          console.log("i18next已初始化，切换语言到英文");
          i18next.changeLanguage("en");
        }
      }
    }
  } catch (e) {
    console.warn("无法设置默认语言:", e);
  }
})();

document.addEventListener("DOMContentLoaded", function () {
  // 检查URL中是否有锚点
  const hasUrlHash = window.location.hash && window.location.hash.length > 1;

  // 初始化常见问题(FAQ)交互
  if (window.FaqModule) {
    window.FaqModule.init();
  }

  // 初始化游戏数据加载
  if (window.GameModule) {
    window.GameModule.init();
  }

  // 初始化多语言支持
  if (window.I18nModule) {
    window.I18nModule.init();
  }

  // 确保语言按钮显示正确
  setTimeout(function () {
    if (typeof window.updateLanguageButton === "function") {
      window.updateLanguageButton();
    }
  }, 1000);

  // 初始化搜索功能
  initSearch();

  // 初始化移动端菜单
  initMobileMenu();

  // 初始化菜单平滑滚动
  initSmoothScroll();

  // 如果URL中有锚点，则在页面加载完成后滚动到对应位置
  if (hasUrlHash) {
    console.log("检测到URL中有锚点，将滚动到指定位置:", window.location.hash);

    // 等待页面完全加载后（包括游戏数据）再执行锚点定位
    setTimeout(function () {
      const targetId = window.location.hash.substring(1);
      const targetElement = document.getElementById(targetId);

      if (targetElement) {
        // 获取header高度，用于调整滚动位置
        const header = document.querySelector("header");
        const headerHeight = header ? header.offsetHeight : 0;

        // 计算目标位置并平滑滚动
        const targetPosition =
          targetElement.getBoundingClientRect().top +
          window.pageYOffset -
          headerHeight;

        window.scrollTo({
          top: targetPosition,
          behavior: "smooth",
        });

        console.log(`已滚动到锚点指定的位置: #${targetId}`);
      }
    }, 500); // 等待500ms确保页面内容已加载
  }
});

// 初始化菜单平滑滚动功能
function initSmoothScroll() {
  // 获取所有带有href="#xxx"格式的导航链接
  const navLinks = document.querySelectorAll('a[href^="#"]');

  navLinks.forEach((link) => {
    link.addEventListener("click", function (e) {
      e.preventDefault(); // 阻止默认行为

      const targetId = this.getAttribute("href").substring(1);
      const targetElement = document.getElementById(targetId);

      if (targetElement) {
        // 获取header高度，用于调整滚动位置
        const header = document.querySelector("header");
        const headerHeight = header ? header.offsetHeight : 0;

        // 计算目标位置并平滑滚动
        const targetPosition =
          targetElement.getBoundingClientRect().top +
          window.pageYOffset -
          headerHeight;

        window.scrollTo({
          top: targetPosition,
          behavior: "smooth",
        });

        // 更新URL，但不刷新页面
        history.pushState(null, null, `#${targetId}`);

        console.log(`滚动到 #${targetId} 区域，无需额外网络请求`);
      }
    });
  });
}

// 初始化搜索功能
function initSearch() {
  const searchButton = document.querySelector(
    'button.text-light.hover\\:text-primary svg[stroke="currentColor"]'
  ).parentNode;

  searchButton.addEventListener("click", function () {
    // 此处仅为演示，实际可以实现搜索功能
    alert("搜索功能即将上线，敬请期待！");
  });
}

// 初始化移动端菜单
function initMobileMenu() {
  const mobileMenuButton = document.querySelector(
    "button.md\\:hidden.text-light.hover\\:text-primary"
  );

  mobileMenuButton.addEventListener("click", function () {
    // 此处仅为演示，实际可以实现移动端菜单显示/隐藏
    alert("移动端菜单功能即将上线，敬请期待！");
  });
}
