/**
 * 游戏数据处理模块
 *
 * 本文件负责处理游戏数据的获取、渲染和分类筛选
 */

// 当前页数
let currentPage = 1;
// 总页数
let totalPages = 1;
// 所有游戏数据缓存
let allGamesCache = [];
// 当前类别
let currentCategory = "all";
// 是否已经加载过游戏数据
let gamesLoaded = false;
// 本地化文本映射 (简易版，仅备用)
const fallbackTranslations = {
  "games.learnMore": {
    zh: "了解更多",
    en: "Learn More",
    ja: "詳細を見る",
    ko: "더 알아보기",
  },
  "games.noGamesFound": {
    zh: "没有找到符合条件的游戏",
    en: "No games found matching your criteria",
    ja: "条件に一致するゲームが見つかりません",
    ko: "조건에 맞는 게임을 찾을 수 없습니다",
  },
  "games.noImage": {
    zh: "游戏图片",
    en: "Game Image",
    ja: "ゲーム画像",
    ko: "게임 이미지",
  },
  "games.uncategorized": {
    zh: "未分类",
    en: "Uncategorized",
    ja: "未分類",
    ko: "미분류",
  },
};

// 简易版本地化函数，在i18next不可用时使用
function simpleFallbackLocalize() {
  try {
    const lang = localStorage.getItem("i18nextLng")?.substring(0, 2) || "zh";
    const elements = document.querySelectorAll("[data-i18n]");

    elements.forEach((el) => {
      const key = el.getAttribute("data-i18n");
      if (fallbackTranslations[key] && fallbackTranslations[key][lang]) {
        el.textContent = fallbackTranslations[key][lang];
      }
    });
  } catch (e) {
    console.warn("简易本地化失败:", e);
  }
}

/**
 * 滚动到分类选项卡位置
 * 考虑header高度和额外的10px偏移量
 * 如果URL中有锚点，则不执行滚动
 */
function scrollToCategoryTab() {
  // 检查URL中是否有锚点(#)，如果有则不执行滚动
  if (window.location.hash) {
    console.log("检测到URL中有锚点，跳过分类选项卡滚动:", window.location.hash);
    return;
  }

  // 获取分类选项卡元素
  const categoryTab = document.querySelector(
    ".flex.justify-center.flex-wrap.gap-4.mb-12"
  );
  if (!categoryTab) return;

  // 获取header元素高度
  const header = document.querySelector("header");
  const headerHeight = header ? header.offsetHeight : 0;

  // 计算滚动位置：元素位置 - header高度 - 额外10px
  const scrollPosition = categoryTab.offsetTop - headerHeight - 10;

  // 平滑滚动到计算的位置
  window.scrollTo({
    top: scrollPosition,
    behavior: "smooth",
  });

  console.log("滚动到分类选项卡，位置:", scrollPosition);
}

// 获取游戏数据
function fetchGames(page = 1, category = "All") {
  if (["/", "/index.html"].includes(window.location.pathname)) {
    category = "Soccer";
  }

  console.log("正在请求游戏数据，页码:", page, "类别:", category);

  // 保存当前分类值到全局变量，确保分页时使用正确的分类
  currentCategory = category;

  // 创建加载提示元素
  const loadingOverlay = document.createElement("div");
  loadingOverlay.className =
    "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 fade-in";
  loadingOverlay.id = "loading-overlay";
  loadingOverlay.style.animation = "fadeIn 0.3s";
  loadingOverlay.innerHTML = `
    <style>
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
      }
      .fade-in {
        animation: fadeIn 0.3s;
      }
      .fade-out {
        animation: fadeOut 0.3s;
      }
    </style>
    <div class="bg-dark p-6 rounded-xl shadow-lg text-center transform scale-100 transition-transform duration-300">
      <div class="inline-block animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary mb-3"></div>
      <p class="text-white text-lg" data-i18n="games.loading">Loading game data...</p>
    </div>
  `;

  // 添加加载提示到页面
  document.body.appendChild(loadingOverlay);

  let domain = "http://localhost:9090";

  // 构建请求URL，支持分页和类别筛选
  let url = `${domain}/api/game/get_games?page=${page}`;
  if (category !== "All") {
    url += `&category=${category}`;
  }

  // 发起网络请求
  fetch(url)
    .then((response) => {
      if (!response.ok) {
        throw new Error("网络请求失败，状态码: " + response.status);
      }
      return response.json();
    })
    .then((data) => {
      console.log("获取到游戏数据:", data);

      if (data.msg === "ok") {
        try {
          // 更新总页数
          totalPages = data.total_page;

          // 更新当前页
          currentPage = page;

          // 保存到缓存
          allGamesCache = data.data;

          // 获取游戏容器
          const gamesContainer = document.querySelector(
            ".grid.grid-cols-2.sm\\:grid-cols-3.md\\:grid-cols-4.lg\\:grid-cols-5.xl\\:grid-cols-6.gap-4"
          );

          // 请求成功后才清空和渲染游戏数据
          gamesContainer.innerHTML = "";

          // 渲染游戏数据
          renderGames(data.data);

          // 更新分页按钮
          renderPagination();

          // 判断是否为初始页面加载
          const isInitialLoad = !document.querySelector(
            ".pagination-container"
          );

          // 数据加载完成后，仅在以下情况滚动到分类选项卡:
          // 1. 如果是分类按钮点击触发的加载
          // 2. 如果不是初始页面加载
          // 3. 如果URL中没有锚点
          if (!isInitialLoad && !window.location.hash) {
            setTimeout(() => {
              scrollToCategoryTab();
            }, 100);
          }
        } catch (error) {
          console.error("处理游戏数据时发生错误:", error);
          showError("处理游戏数据时发生错误: " + error.message);
        }
      } else {
        showError("获取游戏数据失败: " + (data.msg || "未知错误"));
      }
    })
    .catch((error) => {
      console.error("获取游戏数据错误:", error);
      showError("获取游戏数据时发生错误，请稍后再试。详情: " + error.message);
    })
    .finally(() => {
      // 移除加载提示
      removeLoadingOverlay();
    });
}

/**
 * 移除加载提示层，并添加淡出动画
 */
function removeLoadingOverlay() {
  const loadingOverlay = document.getElementById("loading-overlay");
  if (loadingOverlay) {
    // 添加淡出动画
    loadingOverlay.classList.add("fade-out");
    loadingOverlay.style.animation = "fadeOut 0.3s";

    // 等待动画完成后移除元素
    setTimeout(() => {
      if (loadingOverlay.parentNode) {
        document.body.removeChild(loadingOverlay);
      }
    }, 300);
  }
}

// 显示错误信息
function showError(message) {
  const gamesContainer = document.querySelector(
    ".grid.grid-cols-2.sm\\:grid-cols-3.md\\:grid-cols-4.lg\\:grid-cols-5.xl\\:grid-cols-6.gap-4"
  );

  // 添加对gamesContainer是否存在的检查
  if (!gamesContainer) {
    console.error("找不到游戏容器元素，无法显示错误信息:", message);
    // 检查我们是否在游戏详情页面，如果是，尝试使用游戏详情页面的showError函数
    if (
      window.location.href.includes("game-detail.html") &&
      typeof window.gameDetailShowError === "function"
    ) {
      window.gameDetailShowError(message);
    }
    // 确保移除加载提示
    removeLoadingOverlay();
    return;
  }

  // 显示错误信息
  gamesContainer.innerHTML = `
        <div class="col-span-full text-center py-12">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p class="text-red-400" data-i18n="games.error">错误</p>
            <p class="mt-1 text-sm text-red-600">${message}</p>
            <button class="mt-4 px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark transition" onclick="location.reload()">
                <span data-i18n="games.refresh">刷新</span>
            </button>
        </div>
    `;

  // 清空分页区域
  const paginationContainer = document.querySelector(".pagination-container");
  if (paginationContainer) {
    paginationContainer.innerHTML = "";
  }

  // 确保移除加载提示
  removeLoadingOverlay();

  // 尝试对新添加的元素应用翻译
  applyTranslation();
}

// 渲染分页按钮
function renderPagination() {
  // 查找分页容器，如果不存在则创建
  let paginationContainer = document.querySelector(".pagination-container");
  if (!paginationContainer) {
    const loadMoreContainer = document.querySelector(".text-center.mt-12");
    paginationContainer = document.createElement("div");
    paginationContainer.className =
      "pagination-container flex justify-center mt-12 space-x-3";
    loadMoreContainer.replaceWith(paginationContainer);
  }

  // 清空现有的分页按钮
  paginationContainer.innerHTML = "";

  // 如果总页数小于等于1，不显示分页
  if (totalPages <= 1) {
    return;
  }

  // 创建分页按钮
  const maxVisiblePages = 5; // 最多显示的页码数量
  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

  // 调整startPage使显示的页码数量为maxVisiblePages
  if (endPage - startPage + 1 < maxVisiblePages && startPage > 1) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  // 创建"上一页"按钮
  const prevButton = document.createElement("button");
  prevButton.className = `px-4 py-3 bg-white bg-opacity-5 rounded-md text-white font-medium transition-colors
    ${
      currentPage === 1
        ? "opacity-50 cursor-not-allowed"
        : "hover:bg-opacity-10"
    }`;
  prevButton.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
    </svg>
  `;
  prevButton.setAttribute("aria-label", "Previous Page");
  prevButton.setAttribute("data-i18n-aria-label", "pagination.previous");
  prevButton.disabled = currentPage === 1;
  prevButton.addEventListener("click", () => {
    if (currentPage > 1) {
      // 更新URL中的页码参数
      updateUrlWithPage(currentPage - 1);
      // 使用当前选中的分类
      fetchGames(currentPage - 1, currentCategory);
      // 注意：滚动逻辑已移至fetchGames的成功回调中
    }
  });
  paginationContainer.appendChild(prevButton);

  // 如果起始页不是第一页，显示第一页和省略号
  if (startPage > 1) {
    const firstPageButton = createPageButton(1);
    paginationContainer.appendChild(firstPageButton);

    if (startPage > 2) {
      const ellipsis = document.createElement("span");
      ellipsis.className = "px-4 py-3 text-lg text-gray-400";
      ellipsis.textContent = "...";
      paginationContainer.appendChild(ellipsis);
    }
  }

  // 创建中间的页码按钮
  for (let i = startPage; i <= endPage; i++) {
    const pageButton = createPageButton(i);
    paginationContainer.appendChild(pageButton);
  }

  // 如果结束页不是最后一页，显示省略号和最后一页
  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      const ellipsis = document.createElement("span");
      ellipsis.className = "px-4 py-3 text-lg text-gray-400";
      ellipsis.textContent = "...";
      paginationContainer.appendChild(ellipsis);
    }

    const lastPageButton = createPageButton(totalPages);
    paginationContainer.appendChild(lastPageButton);
  }

  // 创建"下一页"按钮
  const nextButton = document.createElement("button");
  nextButton.className = `px-4 py-3 bg-white bg-opacity-5 rounded-md text-white font-medium transition-colors
    ${
      currentPage === totalPages
        ? "opacity-50 cursor-not-allowed"
        : "hover:bg-opacity-10"
    }`;
  nextButton.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
    </svg>
  `;
  nextButton.setAttribute("aria-label", "Next Page");
  nextButton.setAttribute("data-i18n-aria-label", "pagination.next");
  nextButton.disabled = currentPage === totalPages;
  nextButton.addEventListener("click", () => {
    if (currentPage < totalPages) {
      // 更新URL中的页码参数
      updateUrlWithPage(currentPage + 1);
      // 使用当前选中的分类
      fetchGames(currentPage + 1, currentCategory);
      // 注意：滚动逻辑已移至fetchGames的成功回调中
    }
  });
  paginationContainer.appendChild(nextButton);
}

// 创建页码按钮
function createPageButton(pageNumber) {
  const button = document.createElement("button");
  const isCurrentPage = pageNumber === currentPage;

  button.className = `px-4 py-3 text-lg rounded-md text-white font-medium transition-colors ${
    isCurrentPage ? "bg-primary" : "bg-white bg-opacity-5 hover:bg-opacity-10"
  }`;
  button.textContent = pageNumber;
  button.setAttribute("aria-label", `Page ${pageNumber}`);
  button.setAttribute("data-i18n-aria-label", "pagination.page");
  button.setAttribute(
    "data-i18n-aria-label-args",
    JSON.stringify({ page: pageNumber })
  );

  if (!isCurrentPage) {
    button.addEventListener("click", () => {
      // 更新URL中的页码参数
      updateUrlWithPage(pageNumber);
      // 使用当前选中的分类作为参数，而不是默认值
      fetchGames(pageNumber, currentCategory);
      // 注意：滚动逻辑已移至fetchGames的成功回调中
    });
  }

  return button;
}

/**
 * 更新URL中的页码参数，保持分类不变
 * @param {number} page 页码
 */
function updateUrlWithPage(page) {
  // const url = new URL(window.location.href);
  // // 设置页码参数
  // if (page > 1) {
  //   url.searchParams.set("page", page.toString());
  // } else {
  //   url.searchParams.delete("page");
  // }
  // // 更新浏览器历史，不刷新页面
  // window.history.pushState({}, "", url.toString());
  // console.log("已更新URL页码参数:", url.toString());
}

/**
 * 更新URL中的分类参数，同时处理页码参数
 * @param {string} category 分类名称
 */
function updateUrlWithCategory(category) {
  // 获取当前URL并解析
  const url = new URL(window.location.href);

  // 如果是默认分类(all)，则移除category参数
  if (category === "all" || category === "All") {
    url.searchParams.delete("category");
  } else {
    // 否则设置category参数
    url.searchParams.set("category", category);
  }

  // 切换分类时，重置页码（删除页码参数）
  url.searchParams.delete("page");

  // 更新浏览器历史，不刷新页面
  window.history.pushState({}, "", url.toString());
  console.log("已更新URL参数:", url.toString());
}

/**
 * 从URL中获取分类参数
 * @returns {string} 分类名称，如果没有则返回"all"
 */
function getCategoryFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get("category") || "all";
}

/**
 * 从URL中获取页码参数
 * @returns {number} 页码，如果没有则返回1
 */
function getPageFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  const page = parseInt(urlParams.get("page"), 10);
  return isNaN(page) ? 1 : page;
}

// 渲染游戏卡片
function renderGames(games) {
  const gamesContainer = document.querySelector(
    ".grid.grid-cols-2.sm\\:grid-cols-3.md\\:grid-cols-4.lg\\:grid-cols-5.xl\\:grid-cols-6.gap-4"
  );

  // 清空容器
  gamesContainer.innerHTML = "";

  if (games.length === 0) {
    gamesContainer.innerHTML = `
            <div class="col-span-full text-center py-12">
                <p class="text-gray-400" data-i18n="games.noGamesFound">没有找到符合条件的游戏</p>
            </div>
        `;
    // 应用翻译到新添加的元素
    applyTranslation();
    return;
  }

  // 遍历游戏数据创建卡片
  games.forEach((game) => {
    const gameCard = document.createElement("div");
    gameCard.className =
      "group bg-white bg-opacity-5 rounded-xl overflow-hidden hover:bg-opacity-10 transition-all duration-300 border border-white border-opacity-5 transform hover:scale-105 hover:shadow-xl cursor-pointer";

    // 获取游戏ID
    const gameId = game._id || game.id;

    // 获取游戏主分类
    const mainCategory = game.categories || "";

    // 获取游戏标签
    const tagsText = game.tags ? game.tags.replaceAll(",", "、") : "";

    // 游戏详情页URL
    const gameDetailUrl = `game-detail.html?id=${gameId}`;

    // 获取适当的类别文本（根据当前语言翻译）
    let categoryText = mainCategory;
    try {
      if (i18next && typeof i18next.t === "function") {
        // 尝试翻译类别，如果没有特定翻译就使用原值
        const translationKey = `games.categories.${mainCategory.toLowerCase()}`;
        const translated = i18next.t(translationKey);
        // 如果翻译键与翻译结果相同，说明没有找到翻译
        categoryText =
          translated === translationKey ? mainCategory : translated;
      }
    } catch (e) {
      console.warn("获取类别翻译失败，使用原始值:", e);
    }

    // 处理未分类情况
    if (!categoryText || categoryText.trim() === "") {
      categoryText =
        i18next && typeof i18next.t === "function"
          ? i18next.t("games.uncategorized")
          : "未分类";
    }

    gameCard.innerHTML = `
            <a href="${gameDetailUrl}" class="block w-full h-full" title="${
      game.name
    }">
              <div class="aspect-[4/3] relative overflow-hidden">
                  <div class="absolute inset-0 bg-gradient-to-br from-primary/30 to-secondary/30">
                      ${
                        game.img
                          ? `<img src="${game.img}" alt="${game.name}" class="w-full h-full object-cover">`
                          : '<div class="flex items-center justify-center h-full"><p class="text-lg opacity-50" data-i18n="games.noImage">Game Image</p></div>'
                      }
                  </div>
                  <!-- 游戏类型标签 -->
                  <span class="absolute top-2 left-2 bg-primary px-2 py-0.5 rounded-full text-xs font-medium">${categoryText}</span>
              </div>
              <div class="p-2">
                  <div class="flex justify-between items-center mb-0.5">
                      <h3 class="text-sm font-bold group-hover:text-primary transition-colors line-clamp-1">${
                        game.name
                      }</h3>
                      <div class="flex items-center gap-0.5 text-yellow-400">
                          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          <span class="text-xs">${
                            Math.floor(Math.random() * 10) / 10 + 4.0
                          }</span>
                      </div>
                  </div>
                  <p class="text-xs text-gray-400 mb-1 line-clamp-1" title="${
                    game.description || ""
                  }">${game.description || ""}</p>
              </div>
            </a>
        `;

    gamesContainer.appendChild(gameCard);
  });

  // 应用翻译到新添加的元素
  applyTranslation();
}

// 应用翻译到新添加的元素
function applyTranslation() {
  // 本地化新添加的元素 - 添加错误处理
  try {
    if ($ && typeof $.fn.localize === "function") {
      $("[data-i18n]").localize();
    } else {
      console.warn("本地化函数 localize 不可用，使用简易本地化处理");
      simpleFallbackLocalize();
    }

    // 处理aria-label属性的翻译
    document.querySelectorAll("[data-i18n-aria-label]").forEach((el) => {
      const key = el.getAttribute("data-i18n-aria-label");
      try {
        if (i18next && typeof i18next.t === "function") {
          const argsAttr = el.getAttribute("data-i18n-aria-label-args");
          let args = {};
          if (argsAttr) {
            try {
              args = JSON.parse(argsAttr);
            } catch (e) {
              console.warn("解析aria-label参数失败:", e);
            }
          }
          el.setAttribute("aria-label", i18next.t(key, args));
        }
      } catch (e) {
        console.warn(`处理aria-label翻译失败 (${key}):`, e);
      }
    });
  } catch (e) {
    console.warn("执行本地化时发生错误:", e);
    // 尝试使用备用本地化函数
    simpleFallbackLocalize();
  }
}

// 绑定分类按钮事件
function bindCategoryButtons() {
  const categoryButtons = document.querySelectorAll(
    ".flex.justify-center.flex-wrap.gap-4.mb-12 button"
  );

  categoryButtons.forEach((button) => {
    button.addEventListener("click", function () {
      // 移除所有按钮的选中状态
      categoryButtons.forEach((btn) => {
        btn.classList.remove("bg-primary");
        btn.classList.add("bg-white", "bg-opacity-5");
      });

      // 添加选中状态
      this.classList.remove("bg-white", "bg-opacity-5");
      this.classList.add("bg-primary");

      // 获取选中的分类
      const selectedCategory = button.getAttribute("key");

      // 更新全局变量，确保分页时使用正确的分类
      currentCategory = selectedCategory;

      // 重置页码
      currentPage = 1;

      // 将分类添加到URL中
      updateUrlWithCategory(selectedCategory);

      // 重新请求数据
      fetchGames(currentPage, selectedCategory);
    });
  });
}

/**
 * 根据分类名称设置分类按钮选中状态
 * @param {string} category 分类名称
 */
function selectCategoryButton(category) {
  // 所有分类按钮
  const categoryButtons = document.querySelectorAll(
    ".flex.justify-center.flex-wrap.gap-4.mb-12 button"
  );

  // 默认选中"全部"按钮
  let selectedButton = categoryButtons[0];

  if (category && category !== "all") {
    // 尝试查找匹配的分类按钮
    let found = false;

    // 处理特殊情况，如"2 Player"变成"2player"以匹配data-i18n属性
    const categoryKey = category
      .toLowerCase()
      .replace(/\s+/g, "")
      .replace(/[^a-z0-9]/gi, "");

    console.log("处理后的分类键:", categoryKey);

    // 使用data-i18n属性查找按钮
    for (let i = 1; i < categoryButtons.length; i++) {
      const button = categoryButtons[i];
      const dataI18n = button.getAttribute("data-i18n");

      if (dataI18n) {
        // 从data-i18n属性中提取分类键
        const buttonKey = dataI18n.split(".").pop();
        console.log(`比较按钮 ${i}:`, buttonKey, "与分类键:", categoryKey);

        if (
          buttonKey === categoryKey ||
          buttonKey === categoryKey.replace(/[^a-z0-9]/gi, "").toLowerCase()
        ) {
          selectedButton = button;
          found = true;
          break;
        }
      }

      // 如果没有匹配到data-i18n，则检查按钮文本
      const buttonText = button.textContent.trim();
      if (buttonText === category) {
        selectedButton = button;
        found = true;
        break;
      }
    }

    // 如果没有找到匹配的分类，尝试匹配分类的部分内容
    if (!found) {
      for (let i = 1; i < categoryButtons.length; i++) {
        const button = categoryButtons[i];
        const buttonText = button.textContent.trim();

        // 检查分类名称是否包含在按钮文本中，或者按钮文本是否包含在分类名称中
        if (buttonText.includes(category) || category.includes(buttonText)) {
          selectedButton = button;
          break;
        }
      }
    }
  }

  // 重置所有按钮样式
  categoryButtons.forEach((btn) => {
    btn.classList.remove("bg-primary");
    btn.classList.add("bg-white", "bg-opacity-5");
  });

  // 设置选中按钮样式
  selectedButton.classList.remove("bg-white", "bg-opacity-5");
  selectedButton.classList.add("bg-primary");

  console.log("已选中分类按钮:", selectedButton.textContent.trim());
}

// 游戏模块初始化函数
const GameModule = {
  init: function () {
    console.log("游戏模块初始化");

    // 从URL中获取分类和页码
    const urlCategory = getCategoryFromUrl();
    const urlPage = getPageFromUrl() || 1;

    // 如果URL中有分类参数，使用它初始化当前分类
    if (urlCategory) {
      currentCategory = urlCategory;
    }

    // 仅在首次加载页面时请求游戏数据，而不是每次点击菜单时
    if (!gamesLoaded) {
      console.log("首次加载游戏数据");
      this.loadGames(urlPage, currentCategory);
      gamesLoaded = true;
    }

    // 初始化分类按钮点击事件
    this.initCategoryButtons();

    // 根据URL中的分类参数选中对应的分类按钮
    selectCategoryButton(urlCategory);
  },

  // 加载游戏数据
  loadGames: function (page = 1, category = currentCategory || "All") {
    console.log("加载游戏数据, 页码:", page, "分类:", category);
    fetchGames(page, category);
  },

  // 初始化分类按钮点击事件
  initCategoryButtons: bindCategoryButtons,
};

// 导出模块到全局作用域
window.GameModule = GameModule;
