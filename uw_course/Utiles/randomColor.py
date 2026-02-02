from random import choice

_PALETTE = [
    "#1F77B4",  # blue
    "#FF7F0E",  # orange
    "#2CA02C",  # green
    "#D62728",  # red
    "#9467BD",  # purple
    "#8C564B",  # brown
    "#E377C2",  # pink
    "#7F7F7F",  # gray
    "#BCBD22",  # olive
    "#17BECF",  # cyan
    "#4E79A7",  # blue
    "#F28E2B",  # orange
    "#59A14F",  # green
    "#E15759",  # red
    "#76B7B2",  # teal
    "#EDC948",  # yellow
]


def randomColor():
    return choice(_PALETTE)


def randomGray():
    return "#9E9E9E"
