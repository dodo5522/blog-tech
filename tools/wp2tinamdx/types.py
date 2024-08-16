from dataclasses import dataclass


@dataclass
class Args:
    input_xml: str  # 入力XMLファイルへのパス文字列
    output_dir: str  # Markdown出力先ディレクトリへのパス文字列
    set_author: str  # Markdownファイルの著者文字列
    map_category: str  # Category文字列変換マップファイル
    published_only: bool  # 公開済みのもののみ対象とする
    debug: bool  # デバッグ用
