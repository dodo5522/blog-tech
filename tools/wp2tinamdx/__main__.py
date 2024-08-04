from argparse import ArgumentParser

from .types import Args
from .converter import Converter


def parse_args() -> Args:
    parser = ArgumentParser()
    parser.add_argument(
        "-i",
        "--input-xml",
        default="wordpress-export.xml",
        help="Path to XML file exported from WordPress",
    )
    parser.add_argument(
        "-c",
        "--map-category",
        required=False,
        help="Map to convert category",
    )
    parser.add_argument(
        "-o",
        "--output-dir",
        default="markdown_posts",
        help="Path to output directory for MarkDown converted to TinaCMS",
    )
    parser.add_argument(
        "-a",
        "--set-author",
        default="takashi",
        help="Author name",
    )
    parser.add_argument(
        "--debug",
        action="store_true",
        help="Print debug info",
    )
    args = parser.parse_args()
    return Args(**vars(args))


Converter(parse_args()).run()
