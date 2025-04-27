/**
 * 游戏详情页面脚本
 *
 * 本文件负责处理游戏详情页面的数据获取和渲染
 */

// 页面加载完成后执行
document.addEventListener("DOMContentLoaded", () => {
  console.log("游戏详情页面已加载");

  // 确保网站默认语言为英文（针对首次访问的用户）
  try {
    // 检查是否是首次访问此页面
    const detailPageVisited = localStorage.getItem("detail_page_visited");
    if (!detailPageVisited) {
      console.log("首次访问游戏详情页，确保默认使用英文");
      localStorage.setItem("detail_page_visited", "true");
      // 如果没有明确设置语言，则默认使用英文
      if (!localStorage.getItem("i18nextLng")) {
        localStorage.setItem("i18nextLng", "en");
        console.log("设置默认语言为英文");
        // 如果i18next已初始化，则切换到英文
        if (typeof i18next !== "undefined" && i18next.isInitialized) {
          if (i18next.language !== "en") {
            console.log("切换语言到英文");
            i18next.changeLanguage("en");
          }
        }
      }
    }
  } catch (e) {
    console.warn("无法设置默认语言:", e);
  }

  // 记录历史和来源信息，用于调试返回按钮
  console.log("浏览历史长度:", window.history.length);
  console.log("页面来源:", document.referrer || "直接访问(无来源)");

  // 尝试更新语言按钮
  if (typeof window.updateLanguageButton === "function") {
    console.log("游戏详情页尝试更新语言按钮");
    window.updateLanguageButton();
    // 500ms后再次尝试更新，确保按钮被正确设置
    setTimeout(window.updateLanguageButton, 500);
  }

  // 检查jQuery是否可用
  ensureJQuery()
    .then(() => {
      console.log("jQuery已就绪，继续加载页面");

      // 立即应用一次翻译（解决初始化前的静态内容翻译）
      applyTranslation();

      // 等待 i18next 初始化完成后再加载页面
      return waitForI18next();
    })
    .then(() => {
      console.log("i18next 已完全初始化，当前语言:", i18next.language);

      // 首先应用翻译到所有静态元素（包括 header）
      applyTranslation();

      // 然后加载游戏详情内容
      loadGameDetailPage();
    })
    .catch((error) => {
      console.error("初始化失败:", error);
      // 即使初始化失败，仍尝试加载页面
      loadGameDetailPage();
    });
});

/**
 * 确保jQuery可用
 * @returns {Promise} 返回一个Promise，在jQuery可用时解析
 */
function ensureJQuery() {
  return new Promise((resolve, reject) => {
    // 如果全局jQuery已可用，直接返回
    if (typeof $ !== "undefined") {
      console.log("$ 已可用");
      return resolve();
    }

    // 如果全局jQuery可用但$未定义，赋值并返回
    if (typeof jQuery !== "undefined") {
      console.log("jQuery已可用，将其赋值给$");
      window.$ = jQuery;
      return resolve();
    }

    // 否则等待
    const checkInterval = 100;
    const timeout = 5000;
    let timeElapsed = 0;

    const check = () => {
      // 检查是否有全局jQuery或$
      if (typeof $ !== "undefined") {
        console.log("$ 变为可用");
        return resolve();
      }

      if (typeof jQuery !== "undefined") {
        console.log("jQuery变为可用，将其赋值给$");
        window.$ = jQuery;
        return resolve();
      }

      timeElapsed += checkInterval;
      if (timeElapsed >= timeout) {
        return reject(new Error("等待jQuery超时"));
      }

      setTimeout(check, checkInterval);
    };

    check();
  });
}

/**
 * 等待 i18next 初始化完成
 * @returns {Promise} 返回一个 Promise，在 i18next 初始化完成后解析
 */
function waitForI18next() {
  return new Promise((resolve, reject) => {
    const checkInterval = 100; // 检查间隔
    const timeout = 5000; // 最大等待时间
    let timeElapsed = 0;

    // 如果i18next已初始化完成，直接返回
    if (typeof i18next !== "undefined" && i18next.isInitialized) {
      console.log("i18next已初始化完成，无需等待");
      resolve(i18next.language);
      return;
    }

    // 如果全局标记已设置，也可以直接返回
    if (window.i18nextReady === true) {
      console.log("检测到全局i18nextReady标记，i18next已初始化");
      resolve(i18next.language);
      return;
    }

    // 尝试监听自定义事件
    const eventListener = function () {
      console.log("接收到i18nextInitialized事件");
      document.removeEventListener("i18nextInitialized", eventListener);

      // 在确认i18next已初始化后，检查jQuery-i18next是否也已初始化
      if (
        !window.jqueryI18nextReady &&
        typeof window.I18nModule !== "undefined" &&
        typeof window.I18nModule.reinitJQueryI18next === "function"
      ) {
        console.log("尝试通过I18nModule重新初始化jqueryI18next");
        window.I18nModule.reinitJQueryI18next();
      }

      resolve(i18next.language);
    };

    document.addEventListener("i18nextInitialized", eventListener);

    // 同时也使用轮询检查作为备选方案
    const check = () => {
      if (
        (typeof i18next !== "undefined" && i18next.isInitialized) ||
        window.i18nextReady === true
      ) {
        document.removeEventListener("i18nextInitialized", eventListener);

        // 在确认i18next已初始化后，检查jQuery-i18next是否也已初始化
        if (
          !window.jqueryI18nextReady &&
          typeof window.I18nModule !== "undefined" &&
          typeof window.I18nModule.reinitJQueryI18next === "function"
        ) {
          console.log("尝试通过I18nModule重新初始化jqueryI18next");
          window.I18nModule.reinitJQueryI18next();
        }

        resolve(i18next.language);
        return;
      }

      timeElapsed += checkInterval;
      if (timeElapsed >= timeout) {
        document.removeEventListener("i18nextInitialized", eventListener);
        reject(new Error("等待 i18next 初始化超时"));
        return;
      }

      setTimeout(check, checkInterval);
    };

    check();
  });
}

/**
 * 应用翻译到所有带有 data-i18n 属性的元素
 */
function applyTranslation() {
  try {
    // 检查全局I18nModule是否可用
    if (
      typeof window.I18nModule !== "undefined" &&
      window.I18nModule.translate
    ) {
      console.log("使用全局I18nModule.translate()应用翻译");
      window.I18nModule.translate();

      // 检查并重新翻译分类和标签元素
      translateCategoriesAndTags();
      return;
    }

    // 检查jQuery是否已加载
    if (typeof $ === "undefined") {
      console.warn("jQuery未加载，尝试全局jQuery或手动进行基本翻译");

      // 尝试使用全局jQuery
      if (typeof jQuery !== "undefined") {
        console.log("发现全局jQuery，将其赋值给$并继续");
        window.$ = jQuery;
      } else {
        // 如果没有jQuery，尝试进行最基本的DOM操作来翻译
        console.log("无法找到jQuery，使用原生DOM API进行基本翻译");
        if (typeof i18next !== "undefined" && i18next.isInitialized) {
          const elements = document.querySelectorAll("[data-i18n]");
          console.log(`找到${elements.length}个需要翻译的元素`);

          elements.forEach((el) => {
            const key = el.getAttribute("data-i18n");
            if (key) {
              try {
                const translation = i18next.t(key);
                if (translation && translation !== key) {
                  el.textContent = translation;
                }
              } catch (e) {
                console.error(`翻译键${key}失败:`, e);
              }
            }
          });

          console.log("使用原生DOM API完成基本翻译");

          // 检查并重新翻译分类和标签元素
          translateCategoriesAndTags();
          return;
        }
      }
    }

    // 检查i18next是否已初始化
    if (typeof i18next === "undefined") {
      console.warn("i18next未加载，无法应用翻译");
      return;
    }

    if (!i18next.isInitialized) {
      console.warn("i18next尚未初始化完成，稍后再尝试翻译");
      return;
    }

    // 退回到直接使用jQuery i18next方法
    console.log("应用翻译到所有元素，当前语言:", i18next.language);

    try {
      if (typeof $.fn.localize === "undefined") {
        console.warn("$.fn.localize未定义，尝试重新初始化jquery-i18next");
        if (typeof jqueryI18next !== "undefined") {
          jqueryI18next.init(i18next, $, { useOptionsAttr: true });
        }
      }

      $("[data-i18n]").localize();
      console.log("成功应用翻译到所有data-i18n元素");
    } catch (localizeError) {
      console.error("使用localize()应用翻译失败:", localizeError);

      // 备用：使用原生方法
      try {
        console.log("使用原生DOM方法作为备选");
        const elements = document.querySelectorAll("[data-i18n]");
        elements.forEach((el) => {
          const key = el.getAttribute("data-i18n");
          if (key) {
            try {
              const translation = i18next.t(key);
              if (translation && translation !== key) {
                el.textContent = translation;
              }
            } catch (e) {
              console.error(`翻译键${key}失败:`, e);
            }
          }
        });
      } catch (domError) {
        console.error("原生DOM翻译也失败:", domError);
      }
    }

    // 检查并重新翻译分类和标签元素
    translateCategoriesAndTags();

    // 在翻译完成后更新语言按钮
    if (typeof window.updateLanguageButton === "function") {
      console.log("applyTranslation后更新语言按钮");
      window.updateLanguageButton();
    }
  } catch (error) {
    console.error("应用翻译时出错:", error);
  }
}

/**
 * 翻译游戏分类和标签元素
 * 这些元素是动态生成的，可能不包含data-i18n属性
 */
function translateCategoriesAndTags() {
  try {
    if (typeof i18next === "undefined" || !i18next.isInitialized) {
      return;
    }

    // 翻译游戏分类元素
    const categoryElements = document.querySelectorAll(".game-category");
    categoryElements.forEach((el) => {
      const originalText = el.getAttribute("data-original-category");
      if (originalText) {
        // 如果有原始文本属性，使用它来尝试翻译
        const translationKey = `games.categories.${originalText.toLowerCase()}`;
        const translated = i18next.t(translationKey);
        if (translated !== translationKey) {
          el.textContent = translated;
        }
      } else {
        // 尝试检查现有文本是否需要翻译
        const currentText = el.textContent.trim();
        if (currentText !== i18next.t("gameDetail.gameInfo.uncategorized")) {
          // 为非"未分类"的文本寻找可能的翻译
          // 存储原始类别以便将来可以重新翻译
          el.setAttribute("data-original-category", currentText);
          const translationKey = `games.categories.${currentText.toLowerCase()}`;
          const translated = i18next.t(translationKey);
          if (translated !== translationKey) {
            el.textContent = translated;
          }
        }
      }
    });

    // 如果有特殊标签翻译需要，也可以在这里添加类似的逻辑

    console.log("完成分类和标签的翻译");
  } catch (e) {
    console.error("翻译分类和标签时出错:", e);
  }
}

/**
 * 加载游戏详情页面主要功能
 */
function loadGameDetailPage() {
  // 获取URL参数中的游戏ID
  const urlParams = new URLSearchParams(window.location.search);
  const gameId = urlParams.get("id");

  console.log("获取到游戏ID:", gameId);

  // 再次应用翻译以确保静态内容已翻译
  applyTranslation();

  // 确保语言按钮显示正确
  if (typeof window.updateLanguageButton === "function") {
    window.updateLanguageButton();
  }

  // 检查i18next是否已加载
  if (typeof i18next === "undefined") {
    console.error("i18next库未加载，无法提供多语言支持");
    return;
  }

  // 检查游戏ID是否有效
  if (!gameId || gameId === "undefined") {
    console.error("未找到有效的游戏ID参数");
    showError(i18next.t("gameDetail.errors.noGameId"));
    return;
  }

  // 检查语言选择器元素是否存在
  const languageDropdown = document.getElementById("language-dropdown");
  if (!languageDropdown) {
    console.warn("找不到语言选择器元素，国际化功能可能受限");
  } else {
    // 为语言切换器添加事件监听（如果尚未添加）
    if (!window.gameDetailLangListenerAdded) {
      // 监听语言变化事件，语言切换时应用翻译
      i18next.on("languageChanged", function (lng) {
        console.log("游戏详情页检测到语言变更为:", lng);
        // 应用翻译 - 基本文本元素
        applyTranslation();
      });

      window.gameDetailLangListenerAdded = true;
      console.log("已为游戏详情页添加语言变更事件监听器");
    }
  }

  // 获取游戏详情
  fetchGameDetail(gameId);
}

/**
 * 设置iframe消息监听器，用于处理iframe与主页面之间的通信
 * @deprecated 由于iframe内容不需要国际化翻译，此函数已不再使用
 */
function setupIframeMessageListener() {
  // 由于iframe内容不需要国际化翻译，移除消息监听器实现
  console.log("iframe内容不需要国际化翻译，跳过设置消息监听器");
}

/**
 * 向iframe发送当前语言设置
 * @deprecated 由于iframe内容不需要国际化翻译，此函数已不再使用
 */
function sendLanguageToIframe() {
  // 由于iframe内容不需要国际化翻译，此函数不再需要执行任何操作
  console.log("iframe内容不需要国际化翻译，跳过发送语言设置");
}

/**
 * 获取游戏详情数据
 * @param {string} gameId 游戏ID
 */
function fetchGameDetail(gameId) {
  let domain = "http://localhost:9090";

  // 构建API URL
  const url = `${domain}/api/game/get_game_info?id=${gameId}`;
  console.log("开始请求游戏数据，API URL:", url);

  fetch(url)
    .then((response) => {
      console.log("API响应状态:", response.status);
      if (!response.ok) {
        throw new Error(
          i18next.t("gameDetail.errors.networkFailed") + ": " + response.status
        );
      }
      return response.json();
    })
    .then((data) => {
      console.log("获取到游戏数据:", data);

      if (data.msg === "ok" && data.data) {
        // 获取游戏信息
        const gameInfo = data.data.game_info;
        console.log("游戏详情信息:", gameInfo);

        // 检查游戏数据是否为空
        if (!gameInfo || Object.keys(gameInfo).length === 0) {
          console.error("API返回的游戏信息为空");
          showError(i18next.t("gameDetail.errors.gameNotFound"));
          return;
        }

        // 渲染游戏详情
        renderGameDetail(gameInfo);

        // 修改网页标题
        if (gameInfo.name) {
          document.title = `Game Details｜${gameInfo.name}`;
        }

        // 修改网页描述
        if (gameInfo.description) {
          const metaDescription = document.querySelector(
            'meta[name="description"]'
          );
          if (metaDescription) {
            metaDescription.setAttribute(
              "content",
              gameInfo.description.substring(0, 157) + "..."
            );
          }
        }

        // 如果有推荐游戏，渲染推荐游戏
        if (data.data.recommended && data.data.recommended.length > 0) {
          console.log("发现推荐游戏列表，数量:", data.data.recommended.length);
          renderRecommendedGames(data.data.recommended);
        }

        // 数据加载完成后再次应用翻译
        setTimeout(() => {
          applyTranslation();
        }, 200);
      } else {
        console.error("API返回错误信息:", data.msg);
        showError(
          i18next.t("gameDetail.errors.getGameFailed") +
            ": " +
            (data.msg || i18next.t("gameDetail.errors.unknownError"))
        );
      }
    })
    .catch((error) => {
      console.error("获取游戏详情错误:", error);
      showError(
        i18next.t("gameDetail.errors.getGameFailed") + ". " + error.message
      );
    });
}

/**
 * 渲染游戏详情
 * @param {object} game 游戏数据
 */
function renderGameDetail(game) {
  // 设置页面标题
  document.title = `${game.name || i18next.t("gameDetail.pageTitle")} - ${
    i18next.t("gameDetail.pageTitle").split(" - ")[1]
  }`;

  // 添加和更新SEO相关的元标签
  updateMetaTags(game);

  // 更新结构化数据
  updateStructuredData(game);

  // 填充游戏名称
  const gameNameElement = document.getElementById("game-name");
  if (gameNameElement) {
    gameNameElement.textContent =
      game.name || i18next.t("gameDetail.gameInfo.uncategorized");
    // 移除加载中的data-i18n属性，防止后续翻译覆盖
    gameNameElement.removeAttribute("data-i18n");
  }

  // 填充游戏图片
  const gameImageElement = document.getElementById("game-image");
  const imagePlaceholder = document.getElementById("game-image-placeholder");
  if (gameImageElement && imagePlaceholder) {
    if (game.img) {
      gameImageElement.src = game.img;
      gameImageElement.alt = game.name || "";
      gameImageElement.style.display = "";

      imagePlaceholder.style.display = "none";
    } else {
      gameImageElement.style.display = "none";
    }
  }

  // 填充游戏分类
  const gameCategoriesElement = document.getElementById("game-categories");
  if (gameCategoriesElement) {
    gameCategoriesElement.innerHTML = "";

    // 处理分类 - 将字符串转换为数组
    const categoriesArray = parseStringToArray(game.categories);

    if (categoriesArray.length > 0) {
      categoriesArray.forEach((category) => {
        const categoryElement = document.createElement("div");
        categoryElement.className = "game-category";

        // 保存原始分类文本，用于语言切换时的翻译
        const originalCategory = category.trim();
        categoryElement.setAttribute(
          "data-original-category",
          originalCategory
        );

        // 尝试翻译类别，如果有特定翻译就使用翻译值
        let categoryText = originalCategory;
        try {
          if (i18next && typeof i18next.t === "function") {
            // 尝试翻译类别，如果没有特定翻译就使用原值
            const translationKey = `games.categories.${originalCategory.toLowerCase()}`;
            const translated = i18next.t(translationKey);
            // 如果翻译键与翻译结果相同，说明没有找到翻译
            categoryText =
              translated === translationKey ? originalCategory : translated;
          }
        } catch (e) {
          console.warn("获取类别翻译失败，使用原始值:", e);
        }

        categoryElement.textContent = categoryText;
        gameCategoriesElement.appendChild(categoryElement);
      });
    } else {
      const categoryElement = document.createElement("div");
      categoryElement.className = "game-category";
      categoryElement.textContent = i18next.t(
        "gameDetail.gameInfo.uncategorized"
      );
      gameCategoriesElement.appendChild(categoryElement);
    }
  }

  // 填充游戏标签
  const gameTagsElement = document.getElementById("game-tags");
  if (gameTagsElement) {
    gameTagsElement.innerHTML = "";

    // 处理标签 - 将字符串转换为数组
    const tagsArray = parseStringToArray(game.tags);

    if (tagsArray.length > 0) {
      tagsArray.forEach((tag) => {
        const tagElement = document.createElement("div");
        tagElement.className = "game-tag";
        tagElement.textContent = tag.trim();
        gameTagsElement.appendChild(tagElement);
      });
    } else {
      const tagElement = document.createElement("div");
      tagElement.className = "game-tag";
      tagElement.textContent = i18next.t("gameDetail.gameInfo.noTags");
      gameTagsElement.appendChild(tagElement);
    }
  }

  // 填充游戏描述
  const gameDescriptionElement = document.getElementById("game-description");
  if (gameDescriptionElement) {
    gameDescriptionElement.textContent =
      game.description || i18next.t("gameDetail.gameInfo.noDescription");
    // 移除加载中的data-i18n属性，防止后续翻译覆盖
    gameDescriptionElement.removeAttribute("data-i18n");
  }

  // 添加发布日期
  const gameInfoElement = document.getElementById("game-additional-info");
  if (gameInfoElement) {
    // 先清空内容，以防重复添加
    gameInfoElement.innerHTML = "";

    // 添加发布日期（如果有）
    if (game.published_date) {
      const publishedDateElement = document.createElement("div");
      publishedDateElement.className = "mt-4";
      publishedDateElement.innerHTML = `
        <h3 class="text-gray-400 mb-1">${i18next.t(
          "gameDetail.gameInfo.publishedDate"
        )}</h3>
        <p class="text-white">${game.published_date}</p>
      `;
      gameInfoElement.appendChild(publishedDateElement);
    }

    // 添加游戏尺寸（如果有）
    if (game.size) {
      const sizeElement = document.createElement("div");
      sizeElement.className = "mt-4";
      sizeElement.innerHTML = `
        <h3 class="text-gray-400 mb-1">${i18next.t(
          "gameDetail.gameInfo.gameSize"
        )}</h3>
        <p class="text-white">${game.size}</p>
      `;
      gameInfoElement.appendChild(sizeElement);
    }
  }

  // 加载游戏 iframe
  loadGameIframe(game);

  // 在渲染完成后，再次应用i18next翻译，确保所有元素都使用正确的语言
  setTimeout(() => {
    console.log("渲染完成后再次应用翻译，当前语言:", i18next.language);
    applyTranslation();
  }, 100);
}

/**
 * 将逗号分隔的字符串转换为数组
 * @param {string|Array} input 输入的字符串或数组
 * @returns {Array} 处理后的数组
 */
function parseStringToArray(input) {
  // 如果输入为空，返回空数组
  if (!input) return [];

  // 如果输入已经是数组，直接返回
  if (Array.isArray(input)) return input;

  // 处理字符串情况
  if (typeof input === "string") {
    return input.split(",").filter((item) => item.trim() !== "");
  }

  // 其他情况返回空数组
  return [];
}

/**
 * 更新SEO相关的元标签
 * @param {object} game 游戏数据
 */
function updateMetaTags(game) {
  // 描述元标签
  let description = game.description;
  if (description && description.length > 160) {
    // 截断描述，限制在160字符内
    description = description.substring(0, 157) + "...";
  }

  // 获取标签和分类作为关键词
  let keywords = [];

  // 处理标签
  const tagsArray = parseStringToArray(game.tags);
  if (tagsArray.length > 0) {
    keywords = keywords.concat(tagsArray.map((tag) => tag.trim()));
  }

  // 处理分类
  const categoriesArray = parseStringToArray(game.categories);
  if (categoriesArray.length > 0) {
    keywords = keywords.concat(
      categoriesArray.map((category) => category.trim())
    );
  }

  // 添加游戏名称作为关键词
  if (game.name) {
    keywords.push(game.name);
  }

  // 更新或创建描述元标签
  let metaDescription = document.querySelector('meta[name="description"]');
  if (!metaDescription) {
    metaDescription = document.createElement("meta");
    metaDescription.setAttribute("name", "description");
    document.head.appendChild(metaDescription);
  }
  metaDescription.setAttribute(
    "content",
    description ||
      `${
        game.name || i18next.t("gameDetail.pageTitle").split(" - ")[0]
      } - ${i18next.t("gameDetail.gameInfo.noDescription")}`
  );

  // 更新或创建关键词元标签
  let metaKeywords = document.querySelector('meta[name="keywords"]');
  if (!metaKeywords) {
    metaKeywords = document.createElement("meta");
    metaKeywords.setAttribute("name", "keywords");
    document.head.appendChild(metaKeywords);
  }
  metaKeywords.setAttribute("content", keywords.join(", "));

  // 更新Open Graph元标签，用于社交媒体分享
  updateOpenGraphTags(game);

  // 更新Twitter Card元标签
  updateTwitterCardTags(game);
}

/**
 * 更新Open Graph元标签
 * @param {object} game 游戏数据
 */
function updateOpenGraphTags(game) {
  // 基本Open Graph标签
  const ogTags = {
    "og:title": `${
      game.name || i18next.t("gameDetail.pageTitle").split(" - ")[0]
    } - ${i18next.t("gameDetail.pageTitle").split(" - ")[1]}`,
    "og:description":
      game.description || i18next.t("gameDetail.gameInfo.noDescription"),
    "og:type": "website",
    "og:url": window.location.href,
    "og:image": game.img || "", // 默认图片可以添加
  };

  // 更新或创建Open Graph标签
  Object.keys(ogTags).forEach((key) => {
    let metaTag = document.querySelector(`meta[property="${key}"]`);
    if (!metaTag) {
      metaTag = document.createElement("meta");
      metaTag.setAttribute("property", key);
      document.head.appendChild(metaTag);
    }
    metaTag.setAttribute("content", ogTags[key]);
  });
}

/**
 * 更新Twitter Card元标签
 * @param {object} game 游戏数据
 */
function updateTwitterCardTags(game) {
  // 基本Twitter Card标签
  const twitterTags = {
    "twitter:card": "summary_large_image",
    "twitter:title": `${
      game.name || i18next.t("gameDetail.pageTitle").split(" - ")[0]
    } - ${i18next.t("gameDetail.pageTitle").split(" - ")[1]}`,
    "twitter:description":
      game.description || i18next.t("gameDetail.gameInfo.noDescription"),
    "twitter:image": game.img || "", // 默认图片可以添加
  };

  // 更新或创建Twitter Card标签
  Object.keys(twitterTags).forEach((key) => {
    let metaTag = document.querySelector(`meta[name="${key}"]`);
    if (!metaTag) {
      metaTag = document.createElement("meta");
      metaTag.setAttribute("name", key);
      document.head.appendChild(metaTag);
    }
    metaTag.setAttribute("content", twitterTags[key]);
  });
}

/**
 * 渲染推荐游戏
 * @param {Array} recommendedGames 推荐游戏数组
 */
function renderRecommendedGames(recommendedGames) {
  // 查找推荐游戏容器
  const recommendedContainer = document.getElementById("recommended-games");
  if (!recommendedContainer) {
    // 如果容器不存在，创建新的容器
    createRecommendedSection(recommendedGames);
    return;
  }

  // 清空容器
  recommendedContainer.innerHTML = "";

  console.log("渲染推荐游戏列表, 数量:", recommendedGames.length);

  // 遍历推荐游戏数据创建卡片
  recommendedGames.forEach((game) => {
    const gameCard = document.createElement("div");
    gameCard.className =
      "group bg-white bg-opacity-5 rounded-xl overflow-hidden hover:bg-opacity-10 transition-all duration-300 border border-white border-opacity-5 transform hover:scale-105 hover:shadow-xl cursor-pointer";

    // 获取游戏ID
    const gameId = game._id || game.id;
    console.log("推荐游戏ID:", gameId);

    // 获取游戏主分类
    const mainCategory =
      game.categories && game.categories.length > 0
        ? game.categories[0]
        : game.category || i18next.t("gameDetail.gameInfo.uncategorized");

    // 游戏详情页URL - 修改为使用查询参数形式，保持正确的历史记录
    const gameDetailUrl = `game-detail.html?id=${gameId}`;

    gameCard.innerHTML = `
      <a href="${gameDetailUrl}" class="block w-full h-full" title="${
      game.name
    }">
        <div class="aspect-[4/3] relative overflow-hidden">
          <div class="absolute inset-0 bg-gradient-to-br from-primary/30 to-secondary/30">
            ${
              game.img
                ? `<img src="${game.img}" alt="${game.name}" class="w-full h-full object-cover">`
                : '<div class="flex items-center justify-center h-full"><p class="text-lg opacity-50"></p></div>'
            }
          </div>
          <span class="absolute top-2 left-2 bg-primary px-2 py-0.5 rounded-full text-xs font-medium">${mainCategory}</span>
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

    recommendedContainer.appendChild(gameCard);
  });
}

/**
 * 创建推荐游戏区域
 * @param {Array} recommendedGames 推荐游戏数组
 */
function createRecommendedSection(recommendedGames) {
  // 查找主内容区域
  const mainContent = document.querySelector("main .mb-12");
  if (!mainContent) return;

  // 创建推荐游戏区域
  const recommendedSection = document.createElement("div");
  recommendedSection.className =
    "bg-white bg-opacity-5 rounded-2xl p-6 mt-8 border border-white border-opacity-5";
  recommendedSection.innerHTML = `
    <h2 class="text-2xl font-bold mb-6">${i18next.t(
      "gameDetail.recommended.title"
    )}</h2>
    <div id="recommended-games" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4"></div>
  `;

  // 添加到页面
  mainContent.appendChild(recommendedSection);

  // 渲染推荐游戏
  renderRecommendedGames(recommendedGames);
}

/**
 * 加载游戏 iframe
 * @param {object} game 游戏数据
 */
function loadGameIframe(game) {
  console.log("开始加载游戏iframe，游戏链接:", game.url);

  const iframeContainer = document.getElementById("game-iframe-container");
  const iframePlaceholder = document.getElementById("iframe-placeholder");

  if (!iframeContainer || !iframePlaceholder) {
    console.error("找不到iframe容器或占位符元素");
    return;
  }

  // 检查是否有游戏链接
  if (game.url) {
    console.log("创建游戏iframe元素");

    // 创建iframe元素
    const iframe = document.createElement("iframe");
    iframe.id = "game-frame"; // 添加id属性，使按钮可以找到这个元素
    iframe.src = game.url;
    iframe.title =
      game.name || i18next.t("gameDetail.pageTitle").split(" - ")[0];
    iframe.allow =
      "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
    iframe.allowFullscreen = true;

    // 添加sandbox属性以允许脚本执行和同源访问
    iframe.sandbox = "allow-scripts allow-same-origin allow-popups allow-forms";

    // 检查是否需要处理跨域
    const currentHostname = window.location.hostname;
    const gameUrlHostname = new URL(game.url).hostname;

    if (currentHostname !== gameUrlHostname) {
      console.log("检测到跨域游戏URL，添加crossOrigin属性");
      iframe.crossOrigin = "anonymous";
    }

    // 监听iframe加载完成事件
    iframe.onload = () => {
      console.log("游戏iframe加载完成");
      // 隐藏加载占位符
      iframePlaceholder.style.display = "none";
    };

    // 监听iframe加载错误事件
    iframe.onerror = (error) => {
      console.error("游戏iframe加载失败:", error);
      iframePlaceholder.innerHTML = `
        <div class="text-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-red-500 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p class="text-red-400">${i18next.t(
            "gameDetail.gameWindow.loadFailed"
          )}</p>
        </div>
      `;
    };

    console.log("将iframe添加到容器中");
    // 添加到容器
    iframeContainer.appendChild(iframe);

    console.log("设置游戏控制按钮");
    // 添加游戏控制按钮事件监听器
    setupGameControls(iframe);
  } else {
    console.warn("游戏数据中没有提供游戏链接");
    // 没有游戏链接，显示错误信息
    iframePlaceholder.innerHTML = `
            <div class="text-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-gray-500 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p>${i18next.t("gameDetail.gameWindow.noGameLink")}</p>
            </div>
        `;
  }
}

/**
 * 设置游戏控制按钮事件监听器
 * @param {HTMLIFrameElement} iframe 游戏iframe元素
 */
function setupGameControls(iframe) {
  // 刷新游戏按钮
  const refreshButton = document.getElementById("refresh-game");
  if (refreshButton) {
    console.log("找到刷新游戏按钮，正在设置事件监听器");

    // 先移除可能存在的旧事件监听器
    refreshButton.replaceWith(refreshButton.cloneNode(true));

    // 获取新的按钮元素（因为上面的replaceWith创建了新的元素）
    const newRefreshButton = document.getElementById("refresh-game");

    // 添加事件监听器
    newRefreshButton.addEventListener("click", function () {
      console.log("刷新游戏按钮被点击");
      // 保存当前的src
      const currentSrc = iframe.src;
      console.log(`重新加载iframe，当前链接: ${currentSrc}`);

      // 先清空src，然后重新设置，确保完全刷新
      iframe.src = "";
      setTimeout(() => {
        iframe.src = currentSrc;
        console.log("iframe链接已重新设置");
      }, 100);
    });
  } else {
    console.warn("找不到刷新游戏按钮");
  }

  // 全屏按钮
  const fullscreenButton = document.getElementById("fullscreen-game");
  if (fullscreenButton) {
    console.log("找到全屏模式按钮，正在设置事件监听器");

    // 先移除可能存在的旧事件监听器
    fullscreenButton.replaceWith(fullscreenButton.cloneNode(true));

    // 获取新的按钮元素
    const newFullscreenButton = document.getElementById("fullscreen-game");

    // 添加事件监听器
    newFullscreenButton.addEventListener("click", function () {
      console.log("全屏模式按钮被点击");
      const gameContainer = document.querySelector(".game-iframe-container");

      if (document.fullscreenElement) {
        console.log("检测到已处于全屏状态，正在退出全屏");
        // 如果已经是全屏状态，退出全屏
        document.exitFullscreen().catch((err) => {
          console.error("退出全屏模式失败:", err);
        });
      } else {
        console.log("正在尝试进入全屏模式");
        // 进入全屏模式
        // 优先尝试将iframe设为全屏
        if (iframe.requestFullscreen) {
          console.log("使用标准fullscreen API");
          iframe.requestFullscreen().catch((err) => {
            console.warn("iframe全屏失败，尝试容器全屏:", err);
            // 如果iframe不能全屏，则尝试将容器全屏
            gameContainer.requestFullscreen().catch((innerErr) => {
              console.error("启用全屏模式失败:", innerErr);
            });
          });
        } else if (iframe.webkitRequestFullscreen) {
          console.log("使用webkit全屏API");
          // Safari
          iframe.webkitRequestFullscreen();
        } else if (iframe.msRequestFullscreen) {
          console.log("使用ms全屏API");
          // IE11
          iframe.msRequestFullscreen();
        } else {
          console.error("浏览器不支持全屏API");
        }
      }
    });
  } else {
    console.warn("找不到全屏模式按钮");
  }
}

/**
 * 显示错误信息
 * @param {string} message 错误信息
 */
function showError(message) {
  console.log("显示错误信息，当前语言:", i18next.language);

  // 检查是否是"游戏未找到"错误
  const isGameNotFoundError =
    message === i18next.t("gameDetail.errors.gameNotFound");

  // 隐藏加载状态
  const gameNameElement = document.getElementById("game-name");
  const gameCategoriesElement = document.getElementById("game-categories");
  const gameTagsElement = document.getElementById("game-tags");
  const gameDescriptionElement = document.getElementById("game-description");
  const iframePlaceholder = document.getElementById("iframe-placeholder");
  const gameAdditionalInfo = document.getElementById("game-additional-info");

  // 设置游戏名称为错误信息
  if (gameNameElement) {
    gameNameElement.textContent = isGameNotFoundError
      ? i18next.t("gameDetail.errors.gameNotFound").split(".")[0] // 只使用第一句
      : i18next.t("gameDetail.errors.loadFailed");
    // 移除加载中的data-i18n属性，防止后续翻译覆盖
    gameNameElement.removeAttribute("data-i18n");
  }

  // 清空分类和标签
  if (gameCategoriesElement) {
    gameCategoriesElement.innerHTML = "";
  }

  if (gameTagsElement) {
    gameTagsElement.innerHTML = "";
  }

  // 清空附加信息
  if (gameAdditionalInfo) {
    gameAdditionalInfo.innerHTML = "";
  }

  // 设置描述为错误信息
  if (gameDescriptionElement) {
    // 为游戏未找到错误提供更多帮助选项
    if (isGameNotFoundError) {
      gameDescriptionElement.innerHTML = `
        <div class="${
          isGameNotFoundError ? "text-yellow-600" : "text-red-400"
        }">
          <p>${message}</p>
          <p class="mt-2">${i18next.t("gameDetail.errors.refreshTip")}</p>
          
          <div class="mt-6 flex flex-wrap gap-4">
            <a href="index.html" class="px-5 py-2 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>${i18next.t("gameDetail.backToHome")}</span>
            </a>
            
            <a href="index.html#games" class="px-5 py-2 bg-white bg-opacity-10 text-white rounded-lg hover:bg-opacity-20 transition-colors flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span>${i18next.t("gameDetail.errors.findOtherGames")}</span>
            </a>
          </div>
        </div>
      `;

      let domain = "http://localhost:9090";

      // 尝试加载一些推荐游戏
      setTimeout(() => {
        fetch(`${domain}/api/game/get_games?page=1`)
          .then((response) => response.json())
          .then((data) => {
            if (data.msg === "ok" && data.data && data.data.length > 0) {
              console.log("加载了一些其他游戏来推荐");
              renderRecommendedGames(data.data);
            }
          })
          .catch((error) => {
            console.error("获取推荐游戏失败:", error);
          });
      }, 500);
    } else {
      // 常规错误信息
      gameDescriptionElement.innerHTML = `
        <div class="text-red-400">
          <p>${message}</p>
          <p class="mt-2">${i18next.t("gameDetail.errors.refreshTip")}</p>
          <div class="mt-4">
            <a href="index.html" class="px-5 py-2 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors">
              <span>${i18next.t("gameDetail.backToHome")}</span>
            </a>
          </div>
        </div>
      `;
    }

    // 移除加载中的data-i18n属性，防止后续翻译覆盖
    gameDescriptionElement.removeAttribute("data-i18n");
  }

  // 设置iframe占位符为错误信息
  if (iframePlaceholder) {
    iframePlaceholder.innerHTML = `
      <div class="text-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 ${
          isGameNotFoundError ? "text-yellow-500" : "text-red-500"
        } mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${
            isGameNotFoundError
              ? "M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              : "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          }" />
        </svg>
        <p class="${
          isGameNotFoundError ? "text-yellow-400" : "text-red-400"
        }">${
      isGameNotFoundError
        ? i18next.t("gameDetail.errors.gameNotFoundShort")
        : i18next.t("gameDetail.errors.loadGameFailed")
    }</p>
      </div>
    `;
  }

  // 重新设置页面标题，确保使用当前语言
  document.title =
    (isGameNotFoundError
      ? i18next.t("gameDetail.errors.gameNotFound").split(".")[0]
      : i18next.t("gameDetail.errors.loadFailed")) +
    " - " +
    i18next.t("gameDetail.pageTitle").split(" - ")[1];

  // 再次应用i18next翻译给其他静态元素
  setTimeout(() => {
    console.log("错误显示后再次应用翻译，确保所有元素都使用正确的语言");
    applyTranslation();
  }, 100);
}

// 将showError函数暴露为全局函数，以便games.js可以调用它
window.gameDetailShowError = showError;

/**
 * 更新结构化数据标记
 * @param {object} game 游戏数据
 */
function updateStructuredData(game) {
  const schemaScript = document.getElementById("game-schema-data");
  if (!schemaScript) return;

  // 处理分类
  const genres = parseStringToArray(game.categories);

  // 获取游戏标签作为关键词
  const tagsArray = parseStringToArray(game.tags);
  const keywords = tagsArray.join(", ");

  // 构建结构化数据对象
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "VideoGame",
    name: game.name || i18next.t("gameDetail.pageTitle").split(" - ")[0],
    description:
      game.description || i18next.t("gameDetail.gameInfo.noDescription"),
    genre: genres,
    image: game.img || "",
    url: window.location.href,
    datePublished: game.published_date || "",
    keywords: keywords,
    gamePlatform: "Web Browser",
    applicationCategory: "Game",
    offers: {
      "@type": "Offer",
      availability: "https://schema.org/InStock",
      price: "0",
      priceCurrency: "CNY",
    },
  };

  // 更新结构化数据脚本内容
  schemaScript.textContent = JSON.stringify(schemaData, null, 2);
}

// 监听语言变化事件，当语言改变时重新加载游戏详情
document.addEventListener("i18nextLanguageChanged", function () {
  console.log("语言已更改，重新应用翻译");

  // 首先应用基本翻译
  applyTranslation();

  // 检查是否在游戏详情页面，如果是则重新加载当前游戏详情
  const urlParams = new URLSearchParams(window.location.search);
  const gameId = urlParams.get("id");

  if (gameId) {
    console.log("当前在游戏详情页面，重新加载游戏详情，ID:", gameId);
    // 可选：如果性能是问题，可以设置一个标志防止完全重新加载数据
    // 而是只重新渲染现有数据
    fetchGameDetail(gameId);
  }
});
