import logging
import sys


def configure(name: str, debug: bool) -> logging.Logger:
    level = logging.DEBUG if debug else logging.INFO
    fmt = "%(levelname)s:%(name)s %(asctime)s %(message)s" if debug else "%(message)s"

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(logging.Formatter(fmt))

    logger = logging.getLogger(name)
    logger.addHandler(handler)
    logger.setLevel(level)

    return logger
