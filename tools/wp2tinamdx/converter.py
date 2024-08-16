from datetime import datetime
from pathlib import Path

import xml.etree.ElementTree as ET
import json
import os

from . import logger, types


# 名前空間の定義
namespace = {"wp": "http://wordpress.org/export/1.2/"}


class Converter:
    def __init__(self, args: types.Args):
        self.logger = logger.configure(__name__, args.debug)
        self.map_category = self.get_map(args.map_category)
        self.output_dir = Path(args.output_dir)
        self.input_xml = Path(args.input_xml)
        self.author = args.set_author

    def get_map(self, file_path: str) -> dict[str, str]:
        """Category変換マップファイルのデータを取得して返す"""
        if not file_path:
            return {}

        map = Path(file_path)
        if not map.exists():
            self.logger.info(f'Map file "{map.name}" not found.')
            return {}

        return json.load(map.open())

    def run(self):
        """変換メイン処理"""
        # ディレクトリが存在しない場合は作成
        if not self.output_dir.exists():
            os.makedirs(str(self.output_dir))

        # XMLファイルの解析
        tree = ET.parse(str(self.input_xml))
        root = tree.getroot()

        all_category = []
        all_tag = []

        # 各アイテム（投稿）を処理
        for item in root.findall("./channel/item"):
            title = item.find("title").text
            content = item.find(
                "{http://purl.org/rss/1.0/modules/content/}encoded"
            ).text
            post_name = item.find("{http://wordpress.org/export/1.2/}post_name").text

            categories = [
                c.text
                for c in item.findall("category")
                if c.attrib.get("domain") == "category"
            ]
            tags = [
                c.text
                for c in item.findall("category")
                if c.attrib.get("domain") == "post_tag"
            ]

            all_category.extend(categories)
            all_tag.extend(tags)

            pub_date = item.find("pubDate").text
            published_date = (
                datetime.strptime(pub_date, "%a, %d %b %Y %H:%M:%S +0000")
                if pub_date
                else datetime(1970, 1, 1)
            )

            # Markdownファイルとして保存
            md = (
                self.output_dir
                / f"{published_date.strftime('%Y-%m-%d')}-{post_name}.mdx"
            )
            with md.open("w", encoding="utf-8") as md_f:
                title_ = title.replace('"', "")
                content = [
                    "---",
                    f'title: "{title_}"',
                    'description: "hoge"',
                    "tags:",
                    "  - electricity",
                    "categories:",
                    *[f"  - {self.map_category.get(c, c)}" for c in categories],
                    "image: /images/software-developer.jpg",
                    f"date: {published_date.isoformat()}",
                    f"author: {self.author}",
                    "---",
                    "\n",
                    content if content is not None else "",
                ]
                md_f.write("\n".join(content))

        self.logger.debug(f"category: {sorted(set(all_category))}")
        self.logger.debug(f"tags: {sorted(set(all_tag))}")
        self.logger.info("変換が完了しました。")
