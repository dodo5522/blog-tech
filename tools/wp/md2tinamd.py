import xml.etree.ElementTree as ET
import os

# XMLファイルのパス
input_file = 'wordpress-export.xml'
# Markdownファイルの出力ディレクトリ
output_dir = 'markdown_posts'

# ディレクトリが存在しない場合は作成
if not os.path.exists(output_dir):
    os.makedirs(output_dir)

# XMLファイルの解析
tree = ET.parse(input_file)
root = tree.getroot()

# 名前空間の定義
namespace = {'wp': 'http://wordpress.org/export/1.2/'}

# 各アイテム（投稿）を処理
for item in root.findall('./channel/item'):
    title = item.find('title').text
    content = item.find('{http://purl.org/rss/1.0/modules/content/}encoded').text
    post_name = item.find('{http://wordpress.org/export/1.2/}post_name').text
    pub_date = item.find('pubDate').text

    # Markdownファイルとして保存
    md_filename = f"{output_dir}/{post_name}.md"
    with open(md_filename, 'w', encoding='utf-8') as md_file:
        md_file.write(f"---\n")
        md_file.write(f"title: \"{title}\"\n")
        md_file.write(f"date: \"{pub_date}\"\n")
        md_file.write(f"---\n\n")
        md_file.write(content)

print("変換が完了しました。")
