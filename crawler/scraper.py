#!/usr/bin/env python3
"""
Ollama Models Scraper
爬取 Ollama 网站的模型数据并保存为 JSON 格式
"""

import asyncio
import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Dict, Any

from playwright.async_api import async_playwright, Page


# 配置常量
BASE_URL = "https://ollama.com/search"
MAX_PAGES = 20  # 最大爬取页数
PAGE_TIMEOUT = 10000  # 页面加载超时（毫秒）
PAGE_DELAY = 1.5  # 页面间延迟（秒）
OUTPUT_FILE = Path(__file__).parent.parent / "data" / "models.json"


async def scrape_page(page: Page, page_num: int) -> List[Dict[str, Any]]:
    """
    爬取单个页面的模型数据

    Args:
        page: Playwright 页面对象
        page_num: 页码

    Returns:
        模型数据列表
    """
    url = f"{BASE_URL}?page={page_num}"
    print(f"正在爬取第 {page_num} 页: {url}")

    try:
        # 访问页面
        await page.goto(url, wait_until="networkidle")

        # 等待列表加载
        await page.wait_for_selector('ul[role="list"]', timeout=PAGE_TIMEOUT)

    except Exception as e:
        print(f"页面 {page_num} 加载失败: {e}")
        return []

    # 获取所有模型项
    model_items = await page.query_selector_all('ul[role="list"] > li')

    if not model_items:
        print(f"页面 {page_num} 没有找到模型数据")
        return []

    # 检查是否为 "No models found" 页面
    if len(model_items) == 1:
        first_item_text = await model_items[0].text_content()
        if first_item_text and "No models found" in first_item_text:
            print(f"页面 {page_num} 显示 'No models found'，停止爬取")
            return []

    # 提取每个模型的数据
    models = []
    for item in model_items:
        try:
            model_data = await extract_model_data(item)
            # 只保留 sizes 数组不为空的模型
            if model_data and model_data.get("sizes"):
                models.append(model_data)
        except Exception as e:
            print(f"提取模型数据失败: {e}")
            continue

    print(f"页面 {page_num} 成功提取 {len(models)} 个模型")
    return models


async def extract_model_data(item) -> Dict[str, Any]:
    """
    从 li 元素中提取单个模型的数据

    Args:
        item: li 元素

    Returns:
        模型数据字典
    """
    # 获取 a 标签
    link = await item.query_selector("a")
    if not link:
        return None

    # 提取 URL
    href = await link.get_attribute("href")
    url = f"https://ollama.com{href}" if href else None

    # 提取 name (h2)
    name_elem = await item.query_selector("a > div:first-child > h2")
    name = await name_elem.text_content() if name_elem else None
    name = name.strip() if name else None

    # 提取 description (p)
    desc_elem = await item.query_selector("a > div:first-child > p")
    description = await desc_elem.text_content() if desc_elem else None
    description = description.strip() if description else None

    # 提取 capabilities
    capability_elems = await item.query_selector_all(
        "a > div:nth-child(2) [x-test-capability]"
    )
    capabilities = []
    for cap_elem in capability_elems:
        cap_text = await cap_elem.text_content()
        if cap_text:
            capabilities.append(cap_text.strip())

    # 提取 sizes
    size_elems = await item.query_selector_all("a > div:nth-child(2) [x-test-size]")
    sizes = []
    for size_elem in size_elems:
        size_text = await size_elem.text_content()
        if size_text:
            sizes.append(size_text.strip())

    return {
        "name": name,
        "description": description,
        "capabilities": capabilities,
        "sizes": sizes,
        "url": url,
    }


async def scrape_all_pages() -> Dict[str, Any]:
    """
    爬取所有页面的模型数据

    Returns:
        包含所有模型数据的字典
    """
    all_models = []
    page_num = 1

    async with async_playwright() as p:
        # 启动浏览器
        browser = await p.chromium.launch(headless=True)

        # 创建上下文并禁用图片和字体加载
        context = await browser.new_context()
        await context.route(
            "**/*.{png,jpg,jpeg,gif,svg,webp,woff,woff2,ttf,eot}",
            lambda route: route.abort(),
        )

        page = await context.new_page()

        try:
            # 循环爬取每一页
            while page_num <= MAX_PAGES:
                models = await scrape_page(page, page_num)

                # 如果没有数据，停止爬取
                if not models:
                    print(f"第 {page_num} 页无数据，停止爬取")
                    break

                all_models.extend(models)
                page_num += 1

                # 延迟避免请求过快
                if page_num <= MAX_PAGES:
                    await asyncio.sleep(PAGE_DELAY)

        finally:
            await browser.close()

    # 构建返回数据
    return {
        "last_updated": datetime.now(timezone.utc).isoformat(),
        "total_pages": page_num - 1,
        "total_models": len(all_models),
        "models": all_models,
    }


def save_to_json(data: Dict[str, Any], output_path: Path) -> None:
    """
    保存数据到 JSON 文件

    Args:
        data: 要保存的数据
        output_path: 输出文件路径
    """
    # 确保输出目录存在
    output_path.parent.mkdir(parents=True, exist_ok=True)

    # 写入 JSON 文件
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"\n数据已保存到: {output_path}")
    print(f"总页数: {data['total_pages']}")
    print(f"总模型数: {data['total_models']}")


async def main():
    """主函数"""
    print("=" * 60)
    print("Ollama Models Scraper")
    print("=" * 60)
    print(f"开始时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"最大页数: {MAX_PAGES}")
    print(f"输出文件: {OUTPUT_FILE}")
    print("=" * 60)

    try:
        # 爬取数据
        data = await scrape_all_pages()

        # 保存数据
        save_to_json(data, OUTPUT_FILE)

        print("=" * 60)
        print("爬取完成！")
        print("=" * 60)

        return 0

    except Exception as e:
        print(f"\n错误: {e}", file=sys.stderr)
        import traceback

        traceback.print_exc()
        return 1


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
